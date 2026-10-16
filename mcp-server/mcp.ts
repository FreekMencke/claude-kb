/**
 * MCP over Streamable HTTP, stateless, without the SDK: four read-only tools need initialize, ping, tools/list and
 * tools/call answered as JSON, nothing more. The official SDK (v2) builds a server per request: it cost about 20 MiB at
 * idle and peaked at 275 MiB instead of 110 under a burst of 50 parallel calls (FreekMencke/claude-kb#146). So this
 * module implements the 2025 protocol family (2024-11-05 to 2025-11-25) by hand. A 2026-07-28 client probes with
 * `server/discover` under its own MCP-Protocol-Version header, gets a 400 and falls back to initialize; the tests
 * connect with the SDK's client, which does exactly that.
 */
import packageJson from './package.json' with { type: 'json' };
import { type Args, INSTRUCTIONS, type Tool, ToolError, TOOLS } from './kb-tools.ts';
import { type ToolName, timedTool } from './metrics.ts';
import type { KbState } from './server.ts';

const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

// JSON-RPC error codes
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

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

const BY_NAME = new Map(TOOLS.map(tool => [tool.definition.name, timedTool(tool.definition.name, call(tool))]));
const TOOL_LIST = { tools: TOOLS.map(tool => tool.definition) };

/** A tool's result, with a ToolError's message (a bad argument, or no index yet) as an `isError` result. */
function call(tool: Tool): (state: KbState, args: Args) => ToolResult {
  return (state, args) => {
    try {
      return { content: [{ type: 'text', text: tool.run(state, args) }] };
    } catch (error) {
      if (!(error instanceof ToolError)) throw error;
      return { content: [{ type: 'text', text: error.message }], isError: true };
    }
  };
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
  if (typeof id !== 'string' && typeof id !== 'number') {
    return error(null, INVALID_REQUEST, 'Use a string or number id');
  }
  const p = typeof params === 'object' && params !== null ? (params as Args) : {};
  try {
    switch (method) {
      case 'initialize':
        return result(id, {
          protocolVersion: VERSIONS.includes(p.protocolVersion as string) ? p.protocolVersion : VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'claude-kb', version: packageJson.version, icons: ICONS },
          instructions: INSTRUCTIONS,
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
