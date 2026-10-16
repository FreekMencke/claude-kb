/**
 * The knowledge base as MCP resources, for a user to attach rather than for Claude to search: in Claude Code,
 * `@claude-kb:kb://entry/MCP-017`, which the `@` menu fuzzy-searches. INDEX.md's Quick answers, each topic's with its
 * recommendations, and each entry, as the Markdown the tools return (kb-tools.ts). Merged entries aren't listed, but
 * read by ID like any other.
 */
import type { Index } from './kb-index.ts';
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

/** INDEX.md's Quick answers, each topic's, then each entry; none before the first index. */
export function listResources(index: Index | undefined): Resource[] {
  if (index === undefined) return [];
  const topics = [...index.topics].map(([topic, title]) => ({
    uri: `kb://topic/${topic}`,
    name: topic,
    title: `${title}: Quick answers and recommendations`,
    mimeType: MIME,
  }));
  const entries = [...index.entries.values()]
    .filter(e => !e.mergedInto.length)
    .map(e => ({ uri: `kb://entry/${e.id}`, name: e.id, title: e.title, mimeType: MIME }));
  return [
    { uri: QUICK_ANSWERS, name: 'quick-answers', title: 'Quick answers across the knowledge base', mimeType: MIME },
    ...topics,
    ...entries,
  ];
}

/** A resource's kind and Markdown, or undefined for a URI that names none. Throws a ToolError before the first index. */
export function readResource(index: Index | undefined, uri: string): { kind: ResourceKind; text: string } | undefined {
  const kb = loaded(index);
  if (uri === QUICK_ANSWERS) return { kind: 'index', text: quickAnswers(kb) };
  const topic = TOPIC_URI.exec(uri)?.[1];
  if (topic !== undefined && kb.topics.has(topic)) return { kind: 'topic', text: quickAnswers(kb, topic) };
  const id = ENTRY_URI.exec(uri)?.[1];
  if (id !== undefined && kb.get([id]).length) return { kind: 'entry', text: get(kb, [id]) };
  return undefined;
}
