/** The plugin's reminder hook (../hooks/kb-reminder.mjs), run as Claude Code runs it: JSON on stdin, JSON or nothing out. */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { tempDir } from './helpers.ts';

const ROOT = join(import.meta.dirname, '../..');

function hook(input: unknown): { status: number | null; context?: string } {
  const run = spawnSync('node', [join(ROOT, 'hooks/kb-reminder.mjs')], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
  });
  const context = run.stdout ? JSON.parse(run.stdout).hookSpecificOutput.additionalContext : undefined;
  return { status: run.status, context };
}

const call = (session: string, dir: string, tool: string, input: object) => ({
  session_id: session,
  scratchpad_dir: dir,
  tool_name: tool,
  tool_input: input,
});

describe('kb-reminder hook', () => {
  test.each([
    ['Write', { file_path: '/repo/CLAUDE.md' }],
    ['Edit', { file_path: '/repo/.claude/skills/deploy/SKILL.md' }],
    ['Edit', { file_path: '/repo/.claude/agents/reviewer.md' }],
    ['Bash', { command: 'npx ng update @angular/core@22' }],
    ['Bash', { command: 'cd api && npm install express@5' }],
  ])('reminds on %s %o', (tool, input) => {
    const result = hook(call('s', tempDir(), tool, input));
    expect(result.status).toBe(0);
    expect(result.context).toContain('claude-kb knowledge base');
  });

  test.each([
    ['Edit', { file_path: '/repo/src/add.ts' }],
    ['Write', { file_path: '/repo/docs/agents.md' }],
    ['Bash', { command: 'npm install express' }],
    ['Bash', { command: 'npm test' }],
  ])('stays silent on %s %o', (tool, input) => {
    expect(hook(call('s', tempDir(), tool, input))).toEqual({ status: 0, context: undefined });
  });

  test('reminds once per session, and again in another session', () => {
    const dir = tempDir();
    const edit = (session: string) => hook(call(session, dir, 'Edit', { file_path: '/repo/CLAUDE.md' }));
    expect(edit('one').context).toBeDefined();
    expect(edit('one').context).toBeUndefined();
    expect(edit('two').context).toBeDefined();
  });

  test('never blocks: input it cannot read exits 0 with no output', () => {
    expect(hook('not json')).toEqual({ status: 0, context: undefined });
    expect(hook({ tool_name: 'Edit', tool_input: { file_path: '/repo/CLAUDE.md' } })).toEqual({
      status: 0,
      context: undefined,
    });
  });

  test('every handler in hooks.json runs the script, narrowed by one `if` rule', () => {
    const { hooks } = JSON.parse(readFileSync(join(ROOT, 'hooks/hooks.json'), 'utf8'));
    const handlers = hooks.PreToolUse.flatMap((group: { hooks: { command: string; if: string }[] }) => group.hooks);
    expect(handlers.length).toBeGreaterThan(0);
    for (const handler of handlers) {
      expect(handler.command).toBe('node "${CLAUDE_PLUGIN_ROOT}/hooks/kb-reminder.mjs"');
      expect(handler.if).toMatch(/^(Edit|Write|Bash)\(.+\)$/);
    }
  });
});
