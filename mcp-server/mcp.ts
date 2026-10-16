/**
 * MCP over Streamable HTTP, stateless, without the SDK: four read-only tools need initialize, ping, tools/list and
 * tools/call answered as JSON, nothing more. The official SDK (v2) builds a server per request: it cost about 20 MiB at
 * idle and peaked at 275 MiB instead of 110 under a burst of 50 parallel calls (FreekMencke/claude-kb#146). So this
 * module implements the 2025 protocol family (2024-11-05 to 2025-11-25) by hand. A 2026-07-28 client probes with
 * `server/discover` under its own MCP-Protocol-Version header, gets a 400 and falls back to initialize; the tests
 * connect with the SDK's client, which does exactly that.
 */
import packageJson from './package.json' with { type: 'json' };
import * as tools from './kb-tools.ts';
import { type ToolName, timedTool } from './metrics.ts';
import type { KbState } from './server.ts';

const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

// JSON-RPC error codes
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

// Read-only tools can run without a per-call prompt
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
const TOPIC = { type: ['string', 'null'], description: 'Only this topic: a name such as mcp or a prefix such as MCP' };

export const PUBLIC_URL = 'https://claude-kb.freekmencke.com';
// The spec asks clients to fetch icons only from the server's own origin: server.ts serves them (ICON_FILES)
const ICONS = [
  { src: `${PUBLIC_URL}/icon.png`, mimeType: 'image/png', sizes: ['512x512'] },
  { src: `${PUBLIC_URL}/icon.svg`, mimeType: 'image/svg+xml', sizes: ['any'] },
];

export interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

type Args = Record<string, unknown>;

interface Tool {
  definition: { name: ToolName; title: string; description: string; inputSchema: object; annotations: object };
  run: (state: KbState, args: Args) => string;
}

/**
 * Descriptions carry the usage rules too: claude.ai web and desktop drop `instructions` (anthropics/claude-ai-mcp#93).
 * Bounds are checked in kb-tools.ts as well as declared here, so a bad value gets a message saying what to pass. Text
 * content only: with an output schema, Claude Code hands Claude the structured JSON instead.
 */
const TOOLS: Tool[] = [
  {
    definition: {
      name: 'kb_search',
      title: 'Search the knowledge base',
      description:
        'Search claude-kb, a knowledge base on using Claude and Claude Code efficiently: models and effort, subagents,' +
        ' skills, hooks, prompting, CLAUDE.md and memory, MCP servers and connectors, sessions, workflows, tokens and' +
        ' caching, docs, SEO. Returns entry IDs with title, type, confidence, last-verified date and a summary. Search' +
        ' first, then kb_get the 1 to 4 best IDs. Cite entry IDs. Check an entry last verified more than 60 days ago' +
        ' against its sources.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Words, a phrase, or entry IDs such as MCP-017' },
          topic: TOPIC,
          type: {
            type: ['string', 'null'],
            description: `Only this entry type: ${tools.TYPES.join(', ')}`,
          },
          limit: { type: 'integer', minimum: 1, maximum: 20, default: 8, description: 'How many entries' },
        },
        required: ['query'],
      },
      annotations: READ_ONLY,
    },
    run: (state, args) =>
      tools.search(
        state.index,
        string(args, 'query'),
        optionalString(args, 'topic'),
        optionalString(args, 'type'),
        integer(args, 'limit', 8),
      ),
  },
  {
    definition: {
      name: 'kb_get',
      title: 'Read entries',
      description:
        'The full Markdown of claude-kb entries by ID, with their sources, confidence, last-verified date and related' +
        ' IDs. A merged entry comes with the entry it points to.',
      inputSchema: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 10,
            description: 'Entry IDs, such as ["MCP-017", "TOK-005"]',
          },
        },
        required: ['ids'],
      },
      annotations: READ_ONLY,
    },
    run: (state, args) => tools.get(state.index, strings(args, 'ids')),
  },
  {
    definition: {
      name: 'kb_quick_answers',
      title: 'Quick answers',
      description:
        "claude-kb's most-asked questions, each with a one-line answer and its entry IDs: across the knowledge base, or" +
        " for one topic together with that topic's recommendations for our setup.",
      inputSchema: {
        type: 'object',
        properties: { topic: { ...TOPIC, description: `${TOPIC.description}; leave out for all` } },
      },
      annotations: READ_ONLY,
    },
    run: (state, args) => tools.quickAnswers(state.index, optionalString(args, 'topic')),
  },
  {
    definition: {
      name: 'kb_status',
      title: 'Knowledge base status',
      description: 'The claude-kb commit this server has loaded, its number of entries, and when it last indexed them.',
      inputSchema: { type: 'object', properties: {} },
      annotations: READ_ONLY,
    },
    run: state => state.statusText(),
  },
];
const BY_NAME = new Map(TOOLS.map(tool => [tool.definition.name, timedTool(tool.definition.name, call(tool))]));
const TOOL_LIST = { tools: TOOLS.map(tool => tool.definition) };

/** A tool's result, with a ToolError's message (a bad argument, or no index yet) as an `isError` result. */
function call(tool: Tool): (state: KbState, args: Args) => ToolResult {
  return (state, args) => {
    try {
      return { content: [{ type: 'text', text: tool.run(state, args) }] };
    } catch (error) {
      if (!(error instanceof tools.ToolError)) throw error;
      return { content: [{ type: 'text', text: error.message }], isError: true };
    }
  };
}

function string(args: Args, key: string): string {
  const value = args[key];
  if (typeof value !== 'string') throw new tools.ToolError(`Pass ${key} as a string.`);
  return value;
}

function optionalString(args: Args, key: string): string | undefined {
  return args[key] == null ? undefined : string(args, key);
}

function integer(args: Args, key: string, fallback: number): number {
  const value = args[key] ?? fallback;
  if (!Number.isInteger(value)) throw new tools.ToolError(`Pass ${key} as a whole number.`);
  return value as number;
}

function strings(args: Args, key: string): string[] {
  const value = args[key];
  if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) {
    throw new tools.ToolError(`Pass ${key} as a list of strings, such as ["MCP-017"].`);
  }
  return value;
}

/** What to send back: the HTTP status and the JSON body, or none (202) when a POST held only notifications. */
export interface McpReply {
  status: number;
  body?: unknown;
}

type Message = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown };

/**
 * The reply to a POSTed body, already parsed from JSON (`undefined` when it didn't parse), and its MCP-Protocol-Version
 * header. Unexpected errors are passed to `onError` and answered with JSON-RPC's internal error.
 */
export function handle(body: unknown, protocolVersion: string | undefined, state: KbState, onError: OnError): McpReply {
  // Sent on every request after initialize; the spec answers an unsupported one with 400
  if (protocolVersion !== undefined && !VERSIONS.includes(protocolVersion)) {
    return rejected(400, `Unsupported MCP-Protocol-Version ${protocolVersion}: use one of ${VERSIONS.join(', ')}`);
  }
  if (body === undefined) return { status: 400, body: error(null, PARSE_ERROR, 'Parse error') };
  // 2025-03-26 allowed batches; later revisions dropped them
  if (Array.isArray(body)) {
    if (!body.length) return { status: 400, body: error(null, INVALID_REQUEST, 'Empty batch') };
    const replies = body.map(message => answer(message, state, onError)).filter(reply => reply !== undefined);
    return replies.length ? { status: 200, body: replies } : { status: 202 };
  }
  const reply = answer(body, state, onError);
  if (reply === undefined) return { status: 202 };
  return { status: 'error' in reply && reply.error.code === INVALID_REQUEST ? 400 : 200, body: reply };
}

/** An HTTP error with a JSON-RPC error body, as the spec allows for a request it can't take. */
export function rejected(status: number, message: string): McpReply {
  return { status, body: error(null, INVALID_REQUEST, message) };
}

type OnError = (error: unknown) => void;
type Reply =
  | { jsonrpc: '2.0'; id: unknown; result: unknown }
  | { jsonrpc: '2.0'; id: unknown; error: { code: number; message: string } };

function answer(message: unknown, state: KbState, onError: OnError): Reply | undefined {
  if (typeof message !== 'object' || message === null) return error(null, INVALID_REQUEST, 'Not a JSON-RPC message');
  const { jsonrpc, id, method, params } = message as Message;
  if (jsonrpc !== '2.0') return error(id ?? null, INVALID_REQUEST, 'Not a JSON-RPC 2.0 message');
  // A notification (initialized, cancelled) or a response: nothing to answer
  if (id === undefined || typeof method !== 'string') return undefined;
  if (typeof id !== 'string' && typeof id !== 'number') return error(null, INVALID_REQUEST, 'Use a string or number id');
  const p = typeof params === 'object' && params !== null ? (params as Args) : {};
  try {
    switch (method) {
      case 'initialize':
        return result(id, {
          protocolVersion: VERSIONS.includes(p.protocolVersion as string) ? p.protocolVersion : VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'claude-kb', version: packageJson.version, icons: ICONS },
          instructions: tools.INSTRUCTIONS,
        });
      case 'ping':
        return result(id, {});
      case 'tools/list':
        return result(id, TOOL_LIST);
      case 'tools/call': {
        const run = BY_NAME.get(p.name as ToolName);
        if (!run) return error(id, INVALID_PARAMS, `Unknown tool: ${String(p.name)}`);
        const args = typeof p.arguments === 'object' && p.arguments !== null ? (p.arguments as Args) : {};
        return result(id, run(state, args));
      }
      default:
        return error(id, METHOD_NOT_FOUND, `Method not found: ${method}`);
    }
  } catch (e) {
    onError(e);
    return error(id, INTERNAL_ERROR, 'Internal error');
  }
}

function result(id: unknown, value: unknown): Reply {
  return { jsonrpc: '2.0', id, result: value };
}

function error(id: unknown, code: number, message: string): Reply {
  return { jsonrpc: '2.0', id, error: { code, message } };
}
