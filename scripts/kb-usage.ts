/**
 * How the knowledge base gets used, from local Claude Code transcripts: per period, the sessions, those using KB tools
 * and how they reached them, the searches and reads, the rank each read ID had in earlier searches, what was returned
 * but never read, and the same per topic.
 *
 * Usage: node scripts/kb-usage.ts [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--period week|all] [--root DIR] [--queries FILE]
 * Prints counts only. Query text may name private repos, so it goes only to --queries, which defaults to the git-ignored
 * evals/results/usage/queries.jsonl.
 * Transcripts go after `cleanupPeriodDays` (30 here), so run it before the window you need expires. Projects whose
 * folder starts with -tmp are probes and evals, and are left out.
 *
 * Node built-ins only, like check-kb.ts.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entries } from './kb-parse.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOOKUP_SKILL = /(?:^|:)claude-kb-lookup$/;
const KB_TOOL = /(?:^|__)kb_(search|get|quick_answers|status)$/;
// Each hit starts a paragraph of kb_search's text, as `ID: title (type, confidence, ...`
const HIT = /(?:^|\n\n)([A-Z]+-\d+): /g;
const NAMED_THE_KB = /\bKB\b|claude-kb|knowledge base/i;
// Work the KB is meant to inform, per the lookup skill's "Use before": instruction files, agents and major bumps
const INSTRUCTION_FILE = /(?:^|\/)(?:CLAUDE\.md|SKILL\.md)$|\/agents\/[^/]+\.md$/;
const UPGRADE =
  /\bng update\b|\bnpm (?:install|i|update|up)\b[^\n|&;]*@(?:latest|next|\d+)\b|\bnpx npm-check-updates\b|\bncu\b/;

/** One KB tool call in a transcript, deduplicated by its tool_use id: a resumed session copies earlier lines. */
export interface KbCall {
  session: string;
  project: string;
  time: string;
  tool: 'search' | 'get' | 'quick_answers' | 'status';
  inSubagent: boolean;
  query?: string;
  topic?: string;
  ids: string[];
  empty: boolean;
}

/** One top-level session and what its transcripts show. */
export interface Session {
  id: string;
  project: string;
  start: string;
  kbCalls: KbCall[];
  skillLoads: string[];
  relevantWork: boolean;
  firstUse?: 'named' | 'after-skill' | 'unprompted';
}

export interface Usage {
  sessions: number;
  sessionsWithKb: number;
  routeSkill: number;
  routeDirect: number;
  routeSubagentOnly: number;
  lookupSkillLoads: number;
  firstUseNamed: number;
  firstUseAfterSkill: number;
  firstUseUnprompted: number;
  relevantSessions: number;
  relevantWithKb: number;
  searches: number;
  distinctSearches: number;
  emptySearches: number;
  searchAfterSearch: number;
  topicFilter: number;
  quickAnswers: number;
  gets: number;
  idsRequested: number;
  idsSeen: number;
  rank1: number;
  top5: number;
  deeper: number;
  distinctReturned: number;
  distinctRead: number;
  returnedNeverRead: number;
  perTopic: Map<string, { searches: number; returned: number; read: number; neverRead: number }>;
}

function* transcriptFiles(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isDirectory()) yield* transcriptFiles(path);
    else if (e.name.endsWith('.jsonl')) yield path;
  }
}

function textOf(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map(b => (typeof b === 'string' ? b : b?.type === 'text' ? (b.text ?? '') : '')).join('\n');
}

/** Sessions in `root`, one per top-level transcript, with their subagents' calls folded in. */
export function readSessions(root: string): Session[] {
  const sessions = new Map<string, Session>();
  const seenTools = new Set<string>();
  for (const project of readdirSync(root, { withFileTypes: true })) {
    if (!project.isDirectory() || project.name.startsWith('-tmp')) continue;
    for (const file of transcriptFiles(join(root, project.name))) {
      const inSubagent = file.includes('/subagents/');
      const pending = new Map<string, KbCall>();
      let session: Session | undefined;
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        // Parsing every line of 2.7 GB takes minutes; only these two kinds of line matter
        if (!line.includes('"tool_use"') && !line.includes('"tool_result"') && !line.includes('"type":"user"'))
          continue;
        let row: any;
        try {
          row = JSON.parse(line);
        } catch {
          continue;
        }
        const id = row.sessionId;
        if (!id || !row.timestamp) continue;
        session = sessions.get(id);
        if (!session) {
          session = {
            id,
            project: project.name,
            start: row.timestamp,
            kbCalls: [],
            skillLoads: [],
            relevantWork: false,
          };
          sessions.set(id, session);
        } else if (row.timestamp < session.start) session.start = row.timestamp;
        const content = row.message?.content;
        // isMeta lines are injected skill bodies and reminders, not what the user typed
        if (row.type === 'user' && !row.isMeta && !inSubagent && !session.firstUse && !session.kbCalls.length) {
          if (NAMED_THE_KB.test(textOf(content))) session.firstUse = 'named';
        }
        if (!Array.isArray(content)) continue;
        for (const block of content) {
          if (block?.type === 'tool_use') {
            if (seenTools.has(block.id)) continue;
            seenTools.add(block.id);
            const input = block.input ?? {};
            if (block.name === 'Skill' && typeof input.skill === 'string') {
              session.skillLoads.push(input.skill);
              if (!session.firstUse && !session.kbCalls.length && !LOOKUP_SKILL.test(input.skill))
                session.firstUse = 'after-skill';
            }
            if (['Edit', 'Write', 'MultiEdit'].includes(block.name) && INSTRUCTION_FILE.test(input.file_path ?? ''))
              session.relevantWork = true;
            if (block.name === 'Bash' && UPGRADE.test(input.command ?? '')) session.relevantWork = true;
            const kb = KB_TOOL.exec(block.name ?? '');
            if (!kb) continue;
            const call: KbCall = {
              session: id,
              project: project.name,
              time: row.timestamp,
              tool: kb[1] as KbCall['tool'],
              inSubagent,
              query: input.query,
              topic: input.topic,
              // The server rejects ids sent as a string, which models sometimes do: that call read nothing
              ids: kb[1] === 'get' && Array.isArray(input.ids) ? input.ids : [],
              empty: false,
            };
            session.kbCalls.push(call);
            pending.set(block.id, call);
          } else if (block?.type === 'tool_result' && pending.has(block.tool_use_id)) {
            const call = pending.get(block.tool_use_id)!;
            if (call.tool === 'search') {
              const text = textOf(block.content);
              call.ids = [...text.matchAll(HIT)].map(m => m[1]);
              call.empty = text.startsWith('No entries match');
            }
          }
        }
      }
    }
  }
  return [...sessions.values()];
}

/** The best (lowest) 1-based rank each ID had in `calls`' searches. */
function bestRanks(calls: KbCall[]): Map<string, number> {
  const ranks = new Map<string, number>();
  for (const call of calls) {
    if (call.tool !== 'search') continue;
    call.ids.forEach((id, i) => {
      if (!ranks.has(id) || i + 1 < ranks.get(id)!) ranks.set(id, i + 1);
    });
  }
  return ranks;
}

function prefixOf(id: string): string {
  return id.replace(/-\d+$/, '');
}

/** Counts over `sessions`; a session's KB calls count in full, whichever day they fell on. */
export function summarise(sessions: Session[]): Usage {
  const u: Usage = {
    sessions: sessions.length,
    sessionsWithKb: 0,
    routeSkill: 0,
    routeDirect: 0,
    routeSubagentOnly: 0,
    lookupSkillLoads: 0,
    firstUseNamed: 0,
    firstUseAfterSkill: 0,
    firstUseUnprompted: 0,
    relevantSessions: 0,
    relevantWithKb: 0,
    searches: 0,
    distinctSearches: 0,
    emptySearches: 0,
    searchAfterSearch: 0,
    topicFilter: 0,
    quickAnswers: 0,
    gets: 0,
    idsRequested: 0,
    idsSeen: 0,
    rank1: 0,
    top5: 0,
    deeper: 0,
    distinctReturned: 0,
    distinctRead: 0,
    returnedNeverRead: 0,
    perTopic: new Map(),
  };
  const queries = new Set<string>();
  const returned = new Set<string>();
  const read = new Set<string>();
  const topic = (id: string) => {
    const prefix = prefixOf(id);
    if (!u.perTopic.has(prefix)) u.perTopic.set(prefix, { searches: 0, returned: 0, read: 0, neverRead: 0 });
    return u.perTopic.get(prefix)!;
  };
  for (const session of sessions) {
    const calls = [...session.kbCalls].sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    const loaded = session.skillLoads.filter(s => LOOKUP_SKILL.test(s)).length;
    u.lookupSkillLoads += loaded;
    const used = calls.length > 0 || loaded > 0;
    if (used) {
      u.sessionsWithKb += 1;
      if (loaded) u.routeSkill += 1;
      else if (calls.some(c => !c.inSubagent)) u.routeDirect += 1;
      else u.routeSubagentOnly += 1;
      if (session.firstUse === 'named') u.firstUseNamed += 1;
      else if (session.firstUse === 'after-skill') u.firstUseAfterSkill += 1;
      else u.firstUseUnprompted += 1;
    }
    if (session.relevantWork && !/-claude-(?:kb|skills)(?:--|$)/.test(session.project)) {
      u.relevantSessions += 1;
      if (used) u.relevantWithKb += 1;
    }
    let previous: KbCall | undefined;
    calls.forEach((call, i) => {
      if (call.tool === 'quick_answers') u.quickAnswers += 1;
      if (call.tool === 'search') {
        u.searches += 1;
        queries.add((call.query ?? '').trim().toLowerCase());
        if (call.empty) u.emptySearches += 1;
        if (call.topic) u.topicFilter += 1;
        if (previous?.tool === 'search' && previous.inSubagent === call.inSubagent) u.searchAfterSearch += 1;
        for (const id of call.ids) returned.add(id);
        for (const prefix of new Set(call.ids.map(prefixOf))) topic(prefix).searches += 1;
      }
      if (call.tool === 'get') {
        u.gets += 1;
        const ranks = bestRanks(calls.slice(0, i));
        for (const id of call.ids) {
          u.idsRequested += 1;
          read.add(id);
          const rank = ranks.get(id);
          if (rank === undefined) continue;
          u.idsSeen += 1;
          if (rank === 1) u.rank1 += 1;
          if (rank <= 5) u.top5 += 1;
          else u.deeper += 1;
        }
      }
      if (call.tool === 'search' || call.tool === 'get') previous = call;
    });
  }
  u.distinctSearches = queries.size;
  u.distinctReturned = returned.size;
  u.distinctRead = read.size;
  for (const id of returned) {
    topic(id).returned += 1;
    if (!read.has(id)) {
      u.returnedNeverRead += 1;
      topic(id).neverRead += 1;
    }
  }
  for (const id of read) topic(id).read += 1;
  return u;
}

/** Monday of `date`'s week, as YYYY-MM-DD. */
export function weekOf(date: string): string {
  const day = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

/** One JSON line per search for the `real` retrieval set: the query, what it returned, what was read from it later. */
export function queryLog(sessions: Session[]): string {
  const rows: string[] = [];
  for (const session of sessions) {
    const calls = [...session.kbCalls].sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
    calls.forEach((call, i) => {
      if (call.tool !== 'search') return;
      const later = new Set(calls.slice(i + 1).flatMap(c => (c.tool === 'get' ? c.ids : [])));
      const read = call.ids.filter(id => later.has(id));
      const { project, time, query, topic, ids } = call;
      rows.push(JSON.stringify({ project, session: session.id, time, query, topic, returned: ids, read }));
    });
  }
  return rows.length ? `${rows.join('\n')}\n` : '';
}

function print(label: string, u: Usage, corpus: number): void {
  const pct = (a: number, b: number) => (b ? `${a} of ${b}` : '0');
  console.log(`## ${label}`);
  console.log(`sessions ${u.sessions}, with KB ${u.sessionsWithKb}`);
  console.log(
    `route: lookup skill ${u.routeSkill}, direct tool ${u.routeDirect}, subagent only ${u.routeSubagentOnly}`,
  );
  console.log(`lookup skill loads through the Skill tool: ${u.lookupSkillLoads}`);
  console.log(
    `first use: user named the KB ${u.firstUseNamed}, after another skill ${u.firstUseAfterSkill}, unprompted ${u.firstUseUnprompted}`,
  );
  console.log(
    `instruction-file or upgrade sessions outside claude-kb and claude-skills: ${pct(u.relevantWithKb, u.relevantSessions)} used the KB`,
  );
  console.log(
    `searches ${u.searches} (${u.distinctSearches} distinct), ${u.emptySearches} empty, ${u.searchAfterSearch} directly after another search, topic filter on ${u.topicFilter}`,
  );
  console.log(`kb_quick_answers ${u.quickAnswers}, kb_get calls ${u.gets}`);
  console.log(
    `IDs requested ${u.idsRequested}, ${u.idsSeen} seen in an earlier search: rank 1 ${u.rank1}, top 5 ${u.top5}, deeper ${u.deeper}`,
  );
  console.log(
    `entries returned ${u.distinctReturned}, read ${u.distinctRead}, returned but never read ${u.returnedNeverRead}, corpus ${corpus}`,
  );
  const topics = [...u.perTopic].sort(([a], [b]) => (a < b ? -1 : 1));
  if (topics.length) {
    console.log('| Topic | Searches returning it | Returned | Read | Never read |');
    console.log('|---|---|---|---|---|');
    for (const [name, t] of topics)
      console.log(`| ${name} | ${t.searches} | ${t.returned} | ${t.read} | ${t.neverRead} |`);
  }
  console.log('');
}

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function main(args: string[]): void {
  const root = option(args, '--root') ?? join(homedir(), '.claude/projects');
  const from = option(args, '--from') ?? '0000';
  // Both ends are inclusive and apply to the day a session started
  const to = option(args, '--to') ?? '9999';
  const period = option(args, '--period') ?? 'week';
  const queries = option(args, '--queries') ?? join(ROOT, 'evals/results/usage/queries.jsonl');
  const sessions = readSessions(root).filter(s => s.start.slice(0, 10) >= from && s.start.slice(0, 10) <= to);
  const corpus = readdirSync(join(ROOT, 'topics'))
    .filter(f => /^kb-.*\.md$/.test(f))
    .reduce((n, f) => n + [...entries(readFileSync(join(ROOT, 'topics', f), 'utf8'))].length, 0);
  if (period === 'week') {
    const weeks = [...new Set(sessions.map(s => weekOf(s.start)))].sort();
    for (const week of weeks) {
      print(`Week of ${week}`, summarise(sessions.filter(s => weekOf(s.start) === week)), corpus);
    }
  }
  print(`All, ${from} to ${to}`, summarise(sessions), corpus);
  mkdirSync(dirname(queries), { recursive: true });
  writeFileSync(queries, queryLog(sessions));
}

if (import.meta.filename === process.argv[1]) main(process.argv.slice(2));
