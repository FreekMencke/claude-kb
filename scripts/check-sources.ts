/**
 * What changed in the sources the entries cite, and which entries' quotes they still hold. Builds a URL-to-entries map
 * from the Sources lines, fetches each URL's raw form, normalises and hashes it, and compares with the last run. For
 * every entry it also looks up each quote of 6+ words in that entry's sources.
 *
 * Usage: node scripts/check-sources.ts [--state DIR] [--hosts a.com,b.com] [--limit N] [--concurrency N]
 * --hosts keeps only URLs on those hosts, and only entries citing nothing else for the quote check.
 * Prints counts, URLs and entry IDs. Third-party text stays in the state directory (default: the git-ignored
 * evals/results/sources/, in Actions a cache and an artifact): hashes.json, text/<hash of the URL>.txt and report.json
 * with diffs and near matches. Never commit it; the repo is public.
 * A quote that isn't found is reported, never failed: the misses mix wording edits with examples, prompts and paraphrase.
 *
 * Our own rather than changedetection.io (a long-running service with a browser) or urlwatch (Python, a config per URL):
 * both report that a page changed, but neither knows which entries cite it, the raw form of a docs page, or quotes, which
 * is most of this file. Node built-ins only, like check-kb.ts.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { entries, readText, words } from './kb-parse.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCES_LINE = /^- Sources:(.*)$/m;
const URL_IN_LINE = /https?:\/\/[^\s)>\]]+/g;
const MIN_QUOTE_WORDS = 6;
const NEAR_MATCH = 0.8;
const FETCH_TIMEOUT_MS = 30_000;
const PER_HOST = 3;
// Changes too often for a hash to mean anything: 718 new bullets in 14 versions after 2.1.299 (2026-10-30)
const CHANGELOG_URL = 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md';

export interface Fetched {
  status: number;
  text: string;
  contentType: string;
}
export type Fetcher = (url: string) => Promise<Fetched>;

export interface StoredPage {
  hash: string;
  checked: string;
}

/** Each cited URL, without its fragment, and the entries citing it. */
export function sourcesByUrl(topics: Map<string, string>): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const text of topics.values()) {
    for (const [id, body] of entries(text)) {
      const line = SOURCES_LINE.exec(body)?.[1] ?? '';
      for (const m of line.matchAll(URL_IN_LINE)) {
        const url = m[0].replace(/#.*$/, '').replace(/[.,;]+$/, '');
        if (!map.has(url)) map.set(url, new Set());
        map.get(url)!.add(id);
      }
    }
  }
  return map;
}

/** Where to fetch a cited URL from: the Markdown of a Claude docs page, the raw text of a file on GitHub. */
export function rawUrl(url: string): string {
  const u = new URL(url);
  if ((u.hostname === 'code.claude.com' || u.hostname === 'platform.claude.com') && u.pathname.includes('/docs/')) {
    if (!/\.(md|txt)$/.test(u.pathname)) return `${u.origin}${u.pathname.replace(/\/$/, '')}.md`;
  }
  const blob = /^\/([^/]+)\/([^/]+)\/(?:blob|raw)\/(.+)$/.exec(u.pathname);
  if (u.hostname === 'github.com' && blob) return `https://raw.githubusercontent.com/${blob[1]}/${blob[2]}/${blob[3]}`;
  return url;
}

/** Page text without markup that changes between requests: scripts, styles, comments, tags, runs of whitespace. */
export function normalise(body: string, contentType: string): string {
  const html = /html/.test(contentType) || /^\s*<!doctype html/i.test(body);
  const text = html
    ? body
        .replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1\s*>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<\/(p|div|li|h[1-6]|tr|pre|section|article)\s*>|<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&[lr]squo;/g, "'")
        .replace(/&[lr]dquo;/g, '"')
        .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    : body;
  return text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** GitHub's page furniture, whose counters change by the hour, so a repo or issue page would look changed every run. */
const GITHUB_COUNTER =
  /^(?:(?:Star|Fork|Issues|Pull requests|Discussions|Watch) [\d.,]+k?\b|[\d.,]+k? (?:stars?|forks?|watching)\b)/;

export function withoutCounters(text: string): string {
  return text
    .split('\n')
    .filter(line => !GITHUB_COUNTER.test(line))
    .join('\n');
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/** Lines of `after` that aren't in `before`, and the reverse: enough to read a change without a line-by-line diff. */
export function changedLines(before: string, after: string): { added: string[]; removed: string[] } {
  const old = new Set(before.split('\n'));
  const now = new Set(after.split('\n'));
  return { added: after.split('\n').filter(l => !old.has(l)), removed: before.split('\n').filter(l => !now.has(l)) };
}

/**
 * The double-quoted passages of 6+ words in an entry's text. Leaves out its fields, code blocks and any code span with a
 * double quote in it, which is our own example; other code spans are often part of a quote, so they stay.
 */
export function quotesIn(entry: string): string[] {
  const prose = entry
    .replace(/^## .*$/gm, '')
    .replace(/^- (?:Type|Applies to|Confidence|Last verified|Sources|Related):.*$/gm, '')
    .replace(/^```[\s\S]*?^```/gm, '')
    .replace(/`[^`\n]*["“”][^`\n]*`/g, '');
  const found: string[] = [];
  for (const m of prose.matchAll(/"([^"\n]+)"|“([^”\n]+)”/g)) {
    const quote = m[1] ?? m[2];
    if (words(quote).length >= MIN_QUOTE_WORDS) found.push(quote);
  }
  return found;
}

/** Text as compared for a quote: lower case, without Markdown markers, typographic marks or punctuation. */
export function comparable(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Practical Typography puts a soft hyphen in nearly every word
      .replace(/\u00ad/g, '')
      .replace(/[*_`#>|\\]/g, ' ')
      .replace(/[‘’]/g, "'")
      .replace(/[^\p{L}\p{N}%$'+]+/gu, ' ')
      .replace(/'/g, '')
      .trim()
  );
}

function levenshteinRatio(a: string[], b: string[]): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return 1 - row[b.length] / Math.max(a.length, b.length, 1);
}

/** Whether `quote` is in `source`, both `comparable`; if not, the closest passage when it is near enough. */
export function findQuote(
  quote: string,
  source: string,
): { found: boolean; near?: { ratio: number; passage: string } } {
  // An ellipsis joins fragments of one sentence: each has to be there, the short ones say nothing
  const fragments = quote
    .split(/\s*(?:\.\.\.|…|\[\.\.\.\])\s*/)
    .map(comparable)
    .filter(f => words(f).length >= 3);
  if (!fragments.length) return { found: true };
  const padded = ` ${source} `;
  if (fragments.every(f => padded.includes(` ${f} `))) return { found: true };

  const missing = words(fragments.find(f => !padded.includes(` ${f} `))!);
  const have = words(source);
  const wanted = new Set(missing);
  // Only windows sharing most of the quote's words get the costly comparison
  let shared = 0;
  const candidates: number[] = [];
  for (let i = 0; i < have.length; i++) {
    if (wanted.has(have[i])) shared += 1;
    if (i >= missing.length && wanted.has(have[i - missing.length])) shared -= 1;
    if (i >= missing.length - 1 && shared >= missing.length * NEAR_MATCH * 0.8) candidates.push(i - missing.length + 1);
  }
  let best = 0;
  let bestAt = -1;
  for (const start of candidates) {
    const ratio = levenshteinRatio(missing, have.slice(start, start + missing.length));
    if (ratio > best) {
      best = ratio;
      bestAt = start;
    }
  }
  if (best < NEAR_MATCH) return { found: false };
  return { found: false, near: { ratio: best, passage: have.slice(bestAt, bestAt + missing.length).join(' ') } };
}

export const defaultFetcher: Fetcher = async url => {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': 'claude-kb source check (github.com/FreekMencke/claude-kb)',
      'Accept': 'text/markdown, text/plain, text/html;q=0.9, */*;q=0.1',
      // Without it Google's docs hosts answer in a language picked per request, so every page looks changed
      'Accept-Language': 'en',
    },
  });
  return {
    status: response.status,
    text: await response.text(),
    contentType: response.headers.get('content-type') ?? '',
  };
};

/** Runs `work` over `items`, at most `limit` at once overall and PER_HOST per host, so no host sees a burst. */
async function pooled<T>(
  items: T[],
  hostOf: (item: T) => string,
  limit: number,
  work: (item: T) => Promise<void>,
): Promise<void> {
  const busy = new Map<string, number>();
  const waiting = [...items];
  await new Promise<void>(done => {
    let running = 0;
    const pump = () => {
      if (!waiting.length && !running) return done();
      for (let i = 0; i < waiting.length && running < limit;) {
        const host = hostOf(waiting[i]);
        if ((busy.get(host) ?? 0) >= PER_HOST) {
          i += 1;
          continue;
        }
        const [item] = waiting.splice(i, 1);
        running += 1;
        busy.set(host, (busy.get(host) ?? 0) + 1);
        void work(item).finally(() => {
          running -= 1;
          busy.set(host, busy.get(host)! - 1);
          pump();
        });
      }
    };
    pump();
  });
}

export interface PageResult {
  url: string;
  entries: string[];
  state: 'new' | 'same' | 'changed' | 'volatile' | 'failed';
  error?: string;
  added?: number;
  removed?: number;
}

export interface QuoteResult {
  id: string;
  total: number;
  found: number;
  near: { quote: string; ratio: number; passage: string }[];
  missing: string[];
  unreadSources: number;
}

export interface Report {
  date: string;
  pages: PageResult[];
  quotes: QuoteResult[];
  changelogBullets: string[];
  diffs: Record<string, { added: string[]; removed: string[] }>;
}

export interface Options {
  root: string;
  state: string;
  hosts?: string[];
  limit?: number;
  concurrency?: number;
  fetcher?: Fetcher;
  date?: string;
  retryDelayMs?: number;
}

/** One run: fetch, compare with the state directory, update it, and return what changed and what the quotes found. */
export async function run(options: Options): Promise<Report> {
  const { root, state, hosts, limit, concurrency = 16, fetcher = defaultFetcher, retryDelayMs = 2000 } = options;
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  const topics = new Map(
    readdirSync(join(root, 'topics'))
      .filter(f => /^kb-.*\.md$/.test(f))
      .sort()
      .map(f => [f, readText(join(root, 'topics', f))]),
  );
  const byUrl = sourcesByUrl(topics);
  const onHost = (url: string) => !hosts || hosts.includes(new URL(url).hostname);
  let urls = [...byUrl.keys()].filter(onHost).sort();
  if (limit) urls = urls.slice(0, limit);

  mkdirSync(join(state, 'text'), { recursive: true });
  const hashesFile = join(state, 'hashes.json');
  const stored: Record<string, StoredPage> = existsSync(hashesFile) ? JSON.parse(readFileSync(hashesFile, 'utf8')) : {};
  const textFile = (url: string) => join(state, 'text', `${sha256(url)}.txt`);
  const report: Report = { date, pages: [], quotes: [], changelogBullets: [], diffs: {} };
  const fresh = new Map<string, string>();

  const read = async (url: string): Promise<string> => {
    const raw = rawUrl(url);
    const attempt = () =>
      fetcher(raw).catch((error: unknown): Fetched => ({ status: 599, text: String(error), contentType: '' }));
    let page = await attempt();
    if (page.status === 429 || page.status >= 500) {
      await delay(retryDelayMs);
      page = await attempt();
    }
    if (page.status >= 400) throw new Error(page.status === 599 ? page.text.slice(0, 120) : `HTTP ${page.status}`);
    const plain = normalise(page.text, page.contentType);
    const text = new URL(raw).hostname === 'github.com' ? withoutCounters(plain) : plain;
    // A bot wall can answer 200 with nothing in it, which mustn't replace a page we could read
    if (!text) throw new Error('empty page');
    return text;
  };

  await pooled(
    urls,
    u => new URL(rawUrl(u)).hostname,
    concurrency,
    async url => {
      const result: PageResult = { url, entries: [...byUrl.get(url)!].sort(), state: 'same' };
      report.pages.push(result);
      try {
        const text = await read(url);
        fresh.set(url, text);
        const hash = sha256(text);
        const before = stored[url];
        if (!before) result.state = 'new';
        else if (before.hash !== hash) {
          // A page that differs between two requests in a row changes by itself: nonces, counters, rotating content
          const again = await read(url);
          if (sha256(again) !== hash) result.state = 'volatile';
          else {
            result.state = 'changed';
            const previous = existsSync(textFile(url)) ? readFileSync(textFile(url), 'utf8') : '';
            const diff = changedLines(previous, text);
            result.added = diff.added.length;
            result.removed = diff.removed.length;
            if (rawUrl(url) === CHANGELOG_URL) report.changelogBullets = diff.added.filter(l => l.startsWith('- '));
            else report.diffs[url] = diff;
          }
        }
        stored[url] = { hash, checked: date };
        writeFileSync(textFile(url), text);
      } catch (error) {
        result.state = 'failed';
        result.error = error instanceof Error ? error.message : String(error);
        // A page that was readable last time still answers for the quote check
        if (existsSync(textFile(url))) fresh.set(url, readFileSync(textFile(url), 'utf8'));
      }
    },
  );
  writeFileSync(hashesFile, JSON.stringify(stored, null, 0));

  const comparableText = new Map<string, string>();
  const textOf = (url: string) => {
    if (!comparableText.has(url)) comparableText.set(url, comparable(fresh.get(url) ?? ''));
    return comparableText.get(url)!;
  };
  for (const text of topics.values()) {
    for (const [id, body] of entries(text)) {
      const cited = [
        ...new Set(
          [...(SOURCES_LINE.exec(body)?.[1] ?? '').matchAll(URL_IN_LINE)].map(m =>
            m[0].replace(/#.*$/, '').replace(/[.,;]+$/, ''),
          ),
        ),
      ];
      if (!cited.length || !cited.every(onHost)) continue;
      const quotes = quotesIn(body);
      if (!quotes.length) continue;
      const readable = cited.filter(u => fresh.has(u));
      const source = readable.map(textOf).join(' ');
      const result: QuoteResult = {
        id,
        total: quotes.length,
        found: 0,
        near: [],
        missing: [],
        unreadSources: cited.length - readable.length,
      };
      for (const quote of quotes) {
        const hit = findQuote(quote, source);
        if (hit.found) result.found += 1;
        else if (hit.near) result.near.push({ quote, ratio: hit.near.ratio, passage: hit.near.passage });
        else result.missing.push(quote);
      }
      report.quotes.push(result);
    }
  }
  report.pages.sort((a, b) => (a.url < b.url ? -1 : 1));
  writeFileSync(join(state, 'report.json'), JSON.stringify(report, null, 1));
  return report;
}

/** The report's counts, with URLs and entry IDs only, so a public job log carries no third-party text. */
export function summary(report: Report): string[] {
  const count = (state: PageResult['state']) => report.pages.filter(p => p.state === state);
  const quoted = report.quotes;
  const found = quoted.reduce((n, q) => n + q.found, 0);
  const total = quoted.reduce((n, q) => n + q.total, 0);
  const near = quoted.reduce((n, q) => n + q.near.length, 0);
  const clean = quoted.filter(q => q.found === q.total && !q.unreadSources).length;
  const lines = [
    `pages ${report.pages.length}: ${count('same').length} same, ${count('changed').length} changed, ${count('new').length} new, ${count('volatile').length} volatile, ${count('failed').length} failed`,
    `quotes of ${MIN_QUOTE_WORDS}+ words: ${total} in ${quoted.length} entries, ${found} found, ${near} near matches, ${total - found - near} not found; ${clean} entries fully verified`,
    `claude-code CHANGELOG: ${report.changelogBullets.length} new bullets`,
  ];
  const byHost = new Map<string, Record<string, number>>();
  for (const page of report.pages) {
    const host = new URL(page.url).hostname;
    const row = byHost.get(host) ?? {};
    row[page.state] = (row[page.state] ?? 0) + 1;
    byHost.set(host, row);
  }
  const unstable = [...byHost].filter(([, row]) => row.volatile || row.failed).sort(([a], [b]) => (a < b ? -1 : 1));
  for (const [host, row] of unstable) lines.push(`host ${host}: ${JSON.stringify(row)}`);
  for (const page of count('changed')) {
    lines.push(
      `changed ${page.url} (+${page.added} -${page.removed} lines), cited by ${page.entries.length}: ${page.entries.slice(0, 12).join(', ')}`,
    );
  }
  for (const q of quoted.filter(q => q.near.length))
    lines.push(`near match ${q.id}: ${q.near.length} of ${q.total} quotes`);
  return lines;
}

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main(args: string[]): Promise<void> {
  const report = await run({
    root: ROOT,
    state: option(args, '--state') ?? join(ROOT, 'evals/results/sources'),
    hosts: option(args, '--hosts')?.split(','),
    limit: option(args, '--limit') ? Number(option(args, '--limit')) : undefined,
    concurrency: option(args, '--concurrency') ? Number(option(args, '--concurrency')) : undefined,
  });
  for (const line of summary(report)) console.log(line);
}

if (import.meta.filename === process.argv[1]) await main(process.argv.slice(2));
