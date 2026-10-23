/**
 * The knowledge base as MCP resources, for a user to attach rather than for Claude to search: in Claude Code,
 * `@claude-kb:kb://topic/mcp` or `@claude-kb:kb://entry/MCP-017`. INDEX.md's Quick answers (the stack's as
 * `kb://topic/stack`) and each topic's with its recommendations are listed; entries read by ID through the
 * `kb://entry/{id}` template. Listing every entry passed 100,000 characters at about 810 entries (2026-10-17), about
 * 25k tokens through Claude Code's ListMcpResourcesTool.
 */
import { type Index, STACK_TOPIC } from './kb-index.ts';
import { get, loaded, quickAnswers } from './kb-tools.ts';
import type { ResourceKind } from './metrics.ts';

const MIME = 'text/markdown';
const QUICK_ANSWERS = 'kb://quick-answers';
const TOPIC_URI = /^kb:\/\/topic\/([a-z0-9-]+)$/;
const ENTRY_URI = /^kb:\/\/entry\/([A-Za-z]+-\d+)$/;

export interface Resource {
  uri: string;
  name: string;
  title: string;
  mimeType: string;
}

export const TEMPLATES = [
  {
    uriTemplate: 'kb://entry/{id}',
    name: 'entry',
    title: 'An entry by ID',
    description: 'A claude-kb entry by its ID, such as MCP-017',
    mimeType: MIME,
  },
];

/** INDEX.md's Quick answers, then each topic's; none before the first index. */
export function listResources(index: Index | undefined): Resource[] {
  if (index === undefined) return [];
  const topics = [...index.topics].map(([topic, title]) => ({
    uri: `kb://topic/${topic}`,
    name: topic,
    title: `${title}: Quick answers and recommendations`,
    mimeType: MIME,
  }));
  return [
    { uri: QUICK_ANSWERS, name: 'quick-answers', title: 'Quick answers on using Claude', mimeType: MIME },
    // INDEX.md's second table, which the tools' no-topic answer leaves out: `kb://topic/stack`
    ...(index.quickAnswers.has(STACK_TOPIC)
      ? [
          {
            uri: `kb://topic/${STACK_TOPIC}`,
            name: STACK_TOPIC,
            title: 'Quick answers on the stack Claude works on',
            mimeType: MIME,
          },
        ]
      : []),
    ...topics,
  ];
}

/** A resource's kind and Markdown, or undefined for a URI that names none. Throws a ToolError before the first index. */
export function readResource(index: Index | undefined, uri: string): { kind: ResourceKind; text: string } | undefined {
  const kb = loaded(index);
  if (uri === QUICK_ANSWERS) return { kind: 'index', text: quickAnswers(kb) };
  const topic = TOPIC_URI.exec(uri)?.[1];
  if (topic !== undefined && (kb.topics.has(topic) || (topic === STACK_TOPIC && kb.quickAnswers.has(topic))))
    return { kind: 'topic', text: quickAnswers(kb, topic) };
  const id = ENTRY_URI.exec(uri)?.[1];
  if (id !== undefined && kb.get([id]).length) return { kind: 'entry', text: get(kb, [id]) };
  return undefined;
}
