#!/usr/bin/env node
/**
 * PreToolUse hook of the kb-lookup plugin: once per session, when Claude is about to edit an instruction file or run a
 * major upgrade, adds one line saying the knowledge base covers that kind of change. Sessions doing this work reached
 * the KB in 8 of 27 cases (2026-10-31 to 2026-11-14, scripts/kb-usage.ts), and a rule in every session would cost
 * tokens on every turn (FreekMencke/claude-kb#342).
 *
 * It never blocks: any failure exits 0 with no output. Node built-ins only, so the plugin needs no install step.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// The same work scripts/kb-usage.ts counts as "instruction-file or upgrade", so its report measures this hook.
// hooks.json's `if` rules already narrow the calls; a Claude Code that ignores `if` would otherwise fire on every edit.
const INSTRUCTION_FILE = /(?:^|[\\/])(?:CLAUDE\.md|SKILL\.md)$|[\\/]agents[\\/][^\\/]+\.md$/;
const UPGRADE =
  /\bng update\b|\bnpm (?:install|i|update|up)\b[^\n|&;]*@(?:latest|next|\d+)\b|\bnpx npm-check-updates\b|\bncu\b/;
// Worded as a fact, not an order: text framed as a system command can trip the prompt-injection defences (HOOK-007)
const REMINDER =
  'The claude-kb knowledge base has sourced, dated entries on this kind of change (CLAUDE.md rules, skills, agents, hooks, major version upgrades): the claude-kb-lookup skill or the kb_search tool.';

try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const relevant =
    input.tool_name === 'Bash'
      ? UPGRADE.test(input.tool_input?.command ?? '')
      : INSTRUCTION_FILE.test(input.tool_input?.file_path ?? '');
  if (relevant && input.session_id) {
    const dir = input.scratchpad_dir ?? join(tmpdir(), 'claude-kb-reminder');
    mkdirSync(dir, { recursive: true });
    // `wx` fails when the marker exists, which is how a later call in the same session stays silent
    writeFileSync(join(dir, `kb-reminder-${input.session_id}`), '', { flag: 'wx' });
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: REMINDER } }));
  }
} catch {
  // Already reminded, unreadable input or an unwritable directory: say nothing
}
