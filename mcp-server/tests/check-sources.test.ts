/** The source checker (../scripts/check-sources.ts) with a fake fetcher, on a one-topic fixture. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  changedLines,
  comparable,
  type Fetcher,
  findQuote,
  normalise,
  quotesIn,
  rawUrl,
  run,
  sourcesByUrl,
  summary,
  withoutCounters,
} from '../../scripts/check-sources.ts';
import { tempDir } from './helpers.ts';

function entry(id: string, sources: string, body: string): string {
  return `## [${id}] Title\n- Type: fact\n- Applies to: general\n- Confidence: official-docs\n- Last verified: 2026-10-30\n- Sources: ${sources}\n- Related: \n\n${body}\n\n`;
}

function repo(topic: string): string {
  const root = tempDir();
  mkdirSync(join(root, 'topics'));
  writeFileSync(join(root, 'topics', 'kb-test.md'), `# Test\n\n${topic}`);
  return root;
}

/** Answers from `pages`, by the URL asked for; anything else is a 404. */
function fetcher(pages: Record<string, string | string[]>): Fetcher {
  return async url => {
    const page = pages[url];
    if (page === undefined) return { status: 404, text: '', contentType: 'text/plain' };
    const text = Array.isArray(page) ? (page.shift() ?? '') : page;
    return { status: 200, text, contentType: 'text/markdown' };
  };
}

describe('sourcesByUrl', () => {
  test('maps each URL, without its fragment, to the entries citing it', () => {
    const topic =
      entry('TST-001', '[A](https://example.com/a#one), [B](https://example.com/b)', 'Body.') +
      entry('TST-002', '[A again](https://example.com/a#two)', 'Body.');
    const map = sourcesByUrl(new Map([['kb-test.md', `# T\n\n${topic}`]]));
    expect([...map.get('https://example.com/a')!]).toEqual(['TST-001', 'TST-002']);
    expect([...map.get('https://example.com/b')!]).toEqual(['TST-001']);
  });
});

describe('rawUrl', () => {
  test.each([
    ['https://code.claude.com/docs/en/hooks', 'https://code.claude.com/docs/en/hooks.md'],
    ['https://platform.claude.com/docs/en/api/errors/', 'https://platform.claude.com/docs/en/api/errors.md'],
    ['https://code.claude.com/docs/en/hooks.md', 'https://code.claude.com/docs/en/hooks.md'],
    ['https://github.com/o/r/blob/abc123/src/a.ts', 'https://raw.githubusercontent.com/o/r/abc123/src/a.ts'],
    ['https://github.com/o/r/issues/1', 'https://github.com/o/r/issues/1'],
    ['https://nodejs.org/en/blog', 'https://nodejs.org/en/blog'],
  ])('%s', (url, raw) => expect(rawUrl(url)).toBe(raw));
});

describe('normalise', () => {
  test('drops markup and what changes between requests from HTML', () => {
    const html =
      '<html><script>var n="x1"</script><style>a{}</style><!-- c --><p>One &amp; two</p><div>it&#39;s  &#x27;ok&#x27; &rsquo;</div></html>';
    expect(normalise(html, 'text/html')).toBe("One & two\nit's 'ok' '");
  });

  test('leaves Markdown tags alone, apart from whitespace', () => {
    expect(normalise('a  b\n\n<kbd>c</kbd>\n', 'text/markdown')).toBe('a b\n<kbd>c</kbd>');
  });
});

describe('withoutCounters', () => {
  test("drops GitHub's counters and keeps the rest", () => {
    const page =
      'Star 89.1k ( 89.1k ) You must be signed in\n89.1k stars\nIssues 126 ( 126 )\nPull requests 67\nIssues are tracked here\nA real line';
    expect(withoutCounters(page)).toBe('Issues are tracked here\nA real line');
  });
});

describe('quotesIn', () => {
  test('finds quotes of 6+ words, keeps code spans inside them, skips fields, code blocks and example spans', () => {
    const text = entry(
      'TST-001',
      '[A "quoted title of six or more words"](https://example.com)',
      [
        'They say "run `/clear` before you start the next task" here.',
        'And “a curly quote of six whole words” too, but "too short to count" stays out.',
        'An example: `say "this is our own example of ours" please`.',
        '```\n"inside a code block of six words here"\n```',
      ].join('\n'),
    );
    expect(quotesIn(text)).toEqual(['run `/clear` before you start the next task', 'a curly quote of six whole words']);
  });
});

describe('findQuote', () => {
  const source = comparable(
    "Use `/clear` to start fresh. It wastes tokens on every subsequent message, so don't wait.",
  );

  test('finds a quote through case, Markdown and typographic marks', () => {
    expect(findQuote('use **/clear** to start fresh', source).found).toBe(true);
    expect(findQuote('so don’t wait', source).found).toBe(true);
  });

  test('ignores soft hyphens', () => {
    expect(
      findQuote('a line of zeroes above a line of ones', comparable('a line of ze\u00adroes above a line of ones'))
        .found,
    ).toBe(true);
  });

  test('only matches whole words', () => {
    expect(findQuote('se /clear to start fresh', source).found).toBe(false);
  });

  test('each fragment around an ellipsis has to be there', () => {
    expect(findQuote('use /clear to start fresh … on every subsequent message', source).found).toBe(true);
    expect(findQuote('use /clear to start fresh … on every later message', source).found).toBe(false);
  });

  test('reports a wording edit as a near match with the passage', () => {
    const hit = findQuote('it wastes tokens on each subsequent message so dont wait', source);
    expect(hit.found).toBe(false);
    expect(hit.near?.passage).toBe('it wastes tokens on every subsequent message so dont wait');
    expect(hit.near?.ratio).toBeCloseTo(0.9);
  });

  test('reports nothing for a passage that is not there', () => {
    expect(findQuote('a completely different sentence about something else entirely', source)).toEqual({
      found: false,
    });
  });
});

describe('changedLines', () => {
  test('lists added and removed lines', () => {
    expect(changedLines('a\nb', 'b\nc')).toEqual({ added: ['c'], removed: ['a'] });
  });
});

describe('run', () => {
  const URL_A = 'https://example.com/a';
  const options = (root: string, state: string, pages: Record<string, string | string[]>) => ({
    root,
    state,
    fetcher: fetcher(pages),
    date: '2026-10-30',
    retryDelayMs: 0,
  });

  test('new, then same, then changed, with the diff kept out of the summary', async () => {
    const root = repo(entry('TST-001', `[A](${URL_A})`, 'Body.'));
    const state = tempDir();
    const first = await run(options(root, state, { [URL_A]: 'one\ntwo' }));
    expect(first.pages[0]).toMatchObject({ url: URL_A, state: 'new', entries: ['TST-001'] });

    const second = await run(options(root, state, { [URL_A]: 'one\ntwo' }));
    expect(second.pages[0].state).toBe('same');

    const third = await run(options(root, state, { [URL_A]: 'one\nsecret-third-party-text' }));
    expect(third.pages[0]).toMatchObject({ state: 'changed', added: 1, removed: 1 });
    expect(third.diffs[URL_A]).toEqual({ added: ['secret-third-party-text'], removed: ['two'] });
    expect(summary(third).join('\n')).not.toContain('secret-third-party-text');
    expect(summary(third).join('\n')).toContain(`changed ${URL_A} (+1 -1 lines), cited by 1: TST-001`);
    expect(JSON.parse(readFileSync(join(state, 'hashes.json'), 'utf8'))[URL_A].hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('a page that differs between two requests is volatile, not changed', async () => {
    const root = repo(entry('TST-001', `[A](${URL_A})`, 'Body.'));
    const state = tempDir();
    await run(options(root, state, { [URL_A]: 'start' }));
    const report = await run(options(root, state, { [URL_A]: ['nonce-1', 'nonce-2'] }));
    expect(report.pages[0].state).toBe('volatile');
    expect(report.diffs).toEqual({});
  });

  test('a failed page keeps its stored hash, and its stored text still answers for quotes', async () => {
    const quote = 'this sentence has more than six words';
    const root = repo(entry('TST-001', `[A](${URL_A})`, `It says "${quote}".`));
    const state = tempDir();
    await run(options(root, state, { [URL_A]: `Page: ${quote}.` }));
    const report = await run(options(root, state, {}));
    expect(report.pages[0]).toMatchObject({ state: 'failed', error: 'HTTP 404' });
    expect(report.quotes[0]).toMatchObject({ total: 1, found: 1, unreadSources: 0 });
    const after = await run(options(root, state, { [URL_A]: `Page: ${quote}.` }));
    expect(after.pages[0].state).toBe('same');
  });

  test('an empty answer counts as a failure and keeps the stored page', async () => {
    const root = repo(entry('TST-001', `[A](${URL_A})`, 'Body.'));
    const state = tempDir();
    await run(options(root, state, { [URL_A]: 'content' }));
    const report = await run(options(root, state, { [URL_A]: '  \n ' }));
    expect(report.pages[0]).toMatchObject({ state: 'failed', error: 'empty page' });
    const after = await run(options(root, state, { [URL_A]: 'content' }));
    expect(after.pages[0].state).toBe('same');
  });

  test('the Claude Code changelog reports only its added bullets', async () => {
    const url = 'https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md';
    const raw = 'https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md';
    const root = repo(entry('TST-001', `[C](${url})`, 'Body.'));
    const state = tempDir();
    await run(options(root, state, { [raw]: '## 1.0\n- old' }));
    const report = await run(options(root, state, { [raw]: '## 1.1\n- new one\n- new two\n## 1.0\n- old' }));
    expect(report.changelogBullets).toEqual(['- new one', '- new two']);
    expect(report.diffs).toEqual({});
  });

  test('counts quotes found, near and missing, and a run limited to hosts skips entries citing others', async () => {
    const other = 'https://other.example/b';
    const root = repo(
      entry(
        'TST-001',
        `[A](${URL_A})`,
        'It says "alpha beta gamma delta epsilon zeta" and "alpha beta gamma delta epsilon theta" and "nothing like this appears in that page".',
      ) + entry('TST-002', `[A](${URL_A}), [B](${other})`, 'It says "alpha beta gamma delta epsilon zeta".'),
    );
    const report = await run({
      ...options(root, tempDir(), { [URL_A]: 'alpha beta gamma delta epsilon zeta' }),
      hosts: ['example.com'],
    });
    expect(report.pages.map(p => p.url)).toEqual([URL_A]);
    expect(report.quotes.map(q => q.id)).toEqual(['TST-001']);
    expect(report.quotes[0]).toMatchObject({ total: 3, found: 1 });
    expect(report.quotes[0].near).toHaveLength(1);
    expect(report.quotes[0].missing).toEqual(['nothing like this appears in that page']);
    expect(summary(report)[1]).toBe(
      'quotes of 6+ words: 3 in 1 entries, 1 found, 1 near matches, 1 not found; 0 entries fully verified',
    );
  });
});
