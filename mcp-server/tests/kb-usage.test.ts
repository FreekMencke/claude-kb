/** The usage report (../scripts/kb-usage.ts) on small fake transcripts. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { queryLog, readSessions, summarise, weekOf } from '../../scripts/kb-usage.ts';
import { tempDir } from './helpers.ts';

const TOOL = 'mcp__plugin_kb-lookup_claude-kb__';
let nextId = 0;

function line(sessionId: string, minute: number, type: string, content: unknown, extra: object = {}): string {
  const timestamp = `2026-10-20T10:${String(minute).padStart(2, '0')}:00.000Z`;
  return JSON.stringify({ type, sessionId, timestamp, message: { content }, ...extra });
}

/** A kb_search call and its result, returning `ids` in that order. */
function search(sessionId: string, minute: number, query: string, ids: string[], topic?: string): string[] {
  const id = `toolu_${nextId++}`;
  const text = ids.length
    ? ids.map(i => `${i}: Title (fact, official-docs, last verified 2026-10-14)\nSummary.`).join('\n\n') +
      '\n\ncorpus: abc'
    : `No entries match "${query}". Try other words`;
  return [
    line(sessionId, minute, 'assistant', [{ type: 'tool_use', id, name: `${TOOL}kb_search`, input: { query, topic } }]),
    line(sessionId, minute, 'user', [{ type: 'tool_result', tool_use_id: id, content: [{ type: 'text', text }] }]),
  ];
}

function get(sessionId: string, minute: number, ids: string[]): string {
  return line(sessionId, minute, 'assistant', [
    { type: 'tool_use', id: `toolu_${nextId++}`, name: `${TOOL}kb_get`, input: { ids } },
  ]);
}

function write(root: string, path: string, lines: string[]): void {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), `${lines.join('\n')}\n`);
}

describe('readSessions and summarise', () => {
  test('counts searches, ranks and what was never read', () => {
    const root = tempDir();
    write(root, '-repo/s1.jsonl', [
      line('s1', 0, 'user', 'How do hooks work?'),
      ...search('s1', 1, 'hooks', ['HOOK-001', 'HOOK-002', 'HOOK-003', 'HOOK-004', 'HOOK-005', 'HOOK-006']),
      ...search('s1', 2, 'Hook events', ['HOOK-003'], 'HOOK'),
      get('s1', 3, ['HOOK-001', 'HOOK-003', 'HOOK-006', 'TOK-009']),
    ]);
    const u = summarise(readSessions(root));
    expect(u).toMatchObject({
      sessions: 1,
      sessionsWithKb: 1,
      routeDirect: 1,
      searches: 2,
      distinctSearches: 2,
      searchAfterSearch: 1,
      topicFilter: 1,
    });
    // TOK-009 was never searched; HOOK-003's better rank is its rank 1 in the second search
    expect(u).toMatchObject({ idsRequested: 4, idsSeen: 3, rank1: 2, top5: 2, deeper: 1 });
    expect(u).toMatchObject({ distinctReturned: 6, distinctRead: 4, returnedNeverRead: 3 });
    expect(u.perTopic.get('HOOK')).toEqual({ searches: 2, returned: 6, read: 3, neverRead: 3 });
    expect(u.perTopic.get('TOK')).toEqual({ searches: 0, returned: 0, read: 1, neverRead: 0 });
  });

  test('a resumed transcript copying the same tool call counts once', () => {
    const root = tempDir();
    const calls = search('s1', 1, 'hooks', ['HOOK-001']);
    write(root, '-repo/s1.jsonl', calls);
    write(root, '-repo/s1-copy.jsonl', calls);
    expect(summarise(readSessions(root)).searches).toBe(1);
  });

  test('an empty search is counted', () => {
    const root = tempDir();
    write(root, '-repo/s1.jsonl', search('s1', 1, 'zzz', []));
    expect(summarise(readSessions(root))).toMatchObject({ searches: 1, emptySearches: 1, distinctReturned: 0 });
  });

  test('leaves out -tmp projects', () => {
    const root = tempDir();
    write(root, '-tmp-probe/s1.jsonl', search('s1', 1, 'hooks', ['HOOK-001']));
    write(root, '-repo/s2.jsonl', [line('s2', 0, 'user', 'hello')]);
    expect(summarise(readSessions(root))).toMatchObject({ sessions: 1, searches: 0, sessionsWithKb: 0 });
  });

  test('a subagent counts toward its session, and the route says how the KB was reached', () => {
    const root = tempDir();
    write(root, '-repo/s1.jsonl', [line('s1', 0, 'user', 'go')]);
    write(root, '-repo/s1/subagents/agent-a.jsonl', search('s1', 1, 'hooks', ['HOOK-001']));
    write(root, '-repo/s2.jsonl', [
      line('s2', 0, 'assistant', [
        { type: 'tool_use', id: 'skill-1', name: 'Skill', input: { skill: 'kb-lookup:claude-kb-lookup' } },
      ]),
    ]);
    write(root, '-repo/s2/subagents/agent-b.jsonl', search('s2', 1, 'hooks', ['HOOK-001']));
    const u = summarise(readSessions(root));
    expect(u).toMatchObject({
      sessions: 2,
      sessionsWithKb: 2,
      routeSkill: 1,
      routeSubagentOnly: 1,
      routeDirect: 0,
      lookupSkillLoads: 1,
    });
  });

  test('first use: named by the user, after another skill, or unprompted; injected text does not count', () => {
    const root = tempDir();
    write(root, '-repo/named.jsonl', [
      line('named', 0, 'user', 'check the claude-kb first'),
      ...search('named', 1, 'a', ['HOOK-001']),
    ]);
    write(root, '-repo/skill.jsonl', [
      line('skill', 0, 'assistant', [{ type: 'tool_use', id: 'skill-2', name: 'Skill', input: { skill: 'research' } }]),
      ...search('skill', 1, 'b', ['HOOK-001']),
    ]);
    write(root, '-repo/none.jsonl', [
      line('none', 0, 'user', 'the knowledge base says', { isMeta: true }),
      line('none', 0, 'user', 'write a hook'),
      ...search('none', 1, 'c', ['HOOK-001']),
    ]);
    expect(summarise(readSessions(root))).toMatchObject({
      firstUseNamed: 1,
      firstUseAfterSkill: 1,
      firstUseUnprompted: 1,
    });
  });

  test('relevant work counts instruction files and upgrades outside claude-kb and claude-skills', () => {
    const root = tempDir();
    const edit = (s: string, id: string, file: string) =>
      line(s, 0, 'assistant', [{ type: 'tool_use', id, name: 'Edit', input: { file_path: file } }]);
    write(root, '-home-repos-web/a.jsonl', [edit('a', 'e1', '/r/CLAUDE.md'), ...search('a', 1, 'x', ['HOOK-001'])]);
    write(root, '-home-repos-web/b.jsonl', [edit('b', 'e2', '/r/.claude/agents/reviewer.md')]);
    write(root, '-home-repos-web/c.jsonl', [
      line('c', 0, 'assistant', [
        { type: 'tool_use', id: 'b1', name: 'Bash', input: { command: 'ng update @angular/core@22' } },
      ]),
    ]);
    write(root, '-home-repos-web/d.jsonl', [edit('d', 'e3', '/r/src/app.ts')]);
    write(root, '-home-repos-claude-kb--claude-worktrees-x/e.jsonl', [edit('e', 'e4', '/r/CLAUDE.md')]);
    expect(summarise(readSessions(root))).toMatchObject({ relevantSessions: 3, relevantWithKb: 1 });
  });
});

describe('queryLog', () => {
  test('labels each search with what was read from it later', () => {
    const root = tempDir();
    write(root, '-repo/s1.jsonl', [
      ...search('s1', 1, 'first', ['HOOK-001', 'HOOK-002']),
      ...search('s1', 2, 'second', ['HOOK-002', 'HOOK-003']),
      get('s1', 3, ['HOOK-002']),
      ...search('s1', 4, 'third', ['HOOK-002']),
    ]);
    const rows = queryLog(readSessions(root))
      .trim()
      .split('\n')
      .map(l => JSON.parse(l));
    expect(rows.map(r => [r.query, r.read])).toEqual([
      ['first', ['HOOK-002']],
      ['second', ['HOOK-002']],
      ['third', []],
    ]);
  });
});

describe('weekOf', () => {
  test('is the Monday of the week', () => {
    expect(weekOf('2026-10-30T19:00:00.000Z')).toBe('2026-10-26');
    expect(weekOf('2026-10-26T00:00:00.000Z')).toBe('2026-10-26');
    expect(weekOf('2026-11-01T23:59:00.000Z')).toBe('2026-10-26');
  });
});
