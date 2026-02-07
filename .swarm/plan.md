# opencode-swarm v4.4.0 — DX, Quality & Feature Enhancement
Swarm: paid
Phase: 1 [PENDING] | Updated: 2026-02-07

## Problem
After shipping v4.3.2 (security hardening), three improvement categories emerged from codebase analysis and SME consultation:
1. **Quality gaps** — Dependencies outdated, test coverage at ~70% file coverage (hooks/commands undertested)
2. **DX friction** — CLI only has `install`, no `uninstall`; errors are generic warnings; no config validation command
3. **Missing features** — No `/swarm history` or `/swarm config` slash commands for better discoverability

## Solution
Four phases of incremental improvements. Each phase is independently shippable. No architectural changes — all work extends existing patterns.

---

## Phase 1: Dependency Updates + Test Coverage Expansion [COMPLETE]

### 1.1: Update dependencies [SMALL]
- [x] 1.1
FILE: package.json
CHANGE:
- Update `@opencode-ai/plugin` from ^1.1.19 to ^1.1.53 (minor bump: 1.1.48 → 1.1.53)
- Update `@opencode-ai/sdk` from ^1.1.19 to ^1.1.53 (minor bump: 1.1.48 → 1.1.53)
- Update `@biomejs/biome` from 2.3.11 to 2.3.14 (patch bump)
- Run `bun install` to update lockfile
- Review changelogs for @opencode-ai/plugin and @opencode-ai/sdk for any breaking changes or deprecated APIs
- Run full test suite + build + typecheck to verify no regressions
- ROLLBACK: If any tests fail or breaking changes found, revert package.json and bun.lock to pre-update state and document the incompatibility
ACCEPTANCE: All 506+ tests pass, build clean, typecheck clean, lint clean. No deprecated API warnings.

### 1.2: Add tests for src/hooks/extractors.ts [MEDIUM]
- [x] 1.2 (depends: 1.1)
FILE: tests/unit/hooks/extractors.test.ts (EXISTS — 400 lines, extend it)
SOURCE: src/hooks/extractors.ts (209 lines)
CHANGE: Review existing test coverage and add tests for any untested code paths:
- extractPhase() — edge cases: malformed plan, missing phase markers, empty file
- extractCurrentTask() — edge cases: no current marker, multiple markers
- extractDecisions() — edge cases: empty context, malformed sections
- extractAgentActivity() — edge cases: no activity section, truncation
ACCEPTANCE: All extractors functions have tests for happy path + edge cases. Coverage target: every exported function tested.

### 1.3: Add tests for src/hooks/system-enhancer.ts [MEDIUM]
- [x] 1.3 (depends: 1.1)
FILE: tests/unit/hooks/system-enhancer.test.ts (EXISTS — 959 lines, extend it)
SOURCE: src/hooks/system-enhancer.ts (140 lines)
CHANGE: Review existing test coverage and add tests for any untested code paths:
- Cross-agent context injection (truncation at maxChars boundary)
- System prompt with missing .swarm files (graceful degradation)
- Agent label matching (coder/reviewer/test_engineer labels)
ACCEPTANCE: All exported functions tested. Edge cases covered.

### 1.4: Add tests for src/hooks/context-budget.ts [MEDIUM]
- [x] 1.4 (depends: 1.1)
FILE: tests/unit/hooks/context-budget.test.ts (EXISTS — 573 lines, extend it)
SOURCE: src/hooks/context-budget.ts (115 lines)
CHANGE: Review existing test coverage and add tests for any untested code paths:
- Threshold warnings at exactly 70% and 90%
- Custom model limits from config
- Token estimation with various character counts
- Budget when no messages present
ACCEPTANCE: All threshold and estimation logic tested.

### 1.5: Add tests for src/hooks/agent-activity.ts [MEDIUM]
- [x] 1.5 (depends: 1.1)
FILE: tests/unit/hooks/agent-activity.test.ts (EXISTS — 504 lines, extend it)
SOURCE: src/hooks/agent-activity.ts (239 lines)
CHANGE: Review existing test coverage and add tests for any untested code paths:
- Activity aggregation (multiple tools, same tool repeated)
- Flush to context.md (mock file write, verify format)
- replaceActivitySection() — heading found vs not found
- Concurrent flush lock behavior
ACCEPTANCE: All aggregation and flush logic tested.

### 1.6: Add tests for src/hooks/delegation-tracker.ts [SMALL]
- [x] 1.6 (depends: 1.1)
FILE: tests/unit/hooks/delegation-tracker.test.ts (EXISTS — 295 lines, extend it)
SOURCE: src/hooks/delegation-tracker.ts (62 lines)
CHANGE: Review existing test coverage and add tests for any untested code paths:
- Delegation chain recording
- Active agent tracking across sessions
- Config flag to enable/disable chain logging
ACCEPTANCE: All exported functions tested.

### 1.7: Add tests for src/hooks/compaction-customizer.ts [SMALL]
- [x] 1.7 (depends: 1.1)
FILE: tests/unit/hooks/compaction-customizer.test.ts (EXISTS — 402 lines, extend it)
SOURCE: src/hooks/compaction-customizer.ts (78 lines)
CHANGE: Review existing test coverage and add tests for any untested code paths:
- Compaction with plan.md present vs absent
- Compaction with context.md present vs absent
- Output format includes phase info and decisions
ACCEPTANCE: All compaction logic tested.

### 1.8: Add tests for src/hooks/pipeline-tracker.ts [SMALL]
- [x] 1.8 (depends: 1.1)
FILE: tests/unit/hooks/pipeline-tracker.test.ts (EXISTS — 363 lines, extend it)
SOURCE: src/hooks/pipeline-tracker.ts (99 lines)
CHANGE: Review existing test coverage and add tests for any untested code paths:
- Phase reminder injection with various plan states
- Message transform with empty messages array
- Config flag to disable phase reminders
ACCEPTANCE: All pipeline tracker logic tested.

### 1.9: Add tests for src/commands/ [MEDIUM]
- [x] 1.9 (depends: 1.1)
FILES: tests/unit/commands/index.test.ts (95 lines), status.test.ts (75 lines), plan.test.ts (106 lines), agents.test.ts (342 lines) — all EXIST, extend them
SOURCE: src/commands/index.ts (62 lines), status.ts (39 lines), plan.ts (64 lines), agents.ts (34 lines)
CHANGE: Review existing test coverage and add tests for any untested code paths:
- Command dispatcher: unknown subcommand → help text
- Status command: various plan states (no plan, empty plan, multi-phase)
- Plan command: phase number out of range, invalid phase number
- Agents command: empty agents list, agents with various access flags
ACCEPTANCE: All command handlers tested with edge cases.

### 1.10: Phase 1 verification [SMALL]
- [x] 1.10 (depends: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9)
CHANGE:
- `bun test` — all tests pass (target: 550+ tests)
- `bun run build` — clean
- `bun run typecheck` — clean
- `bun run lint` — clean (7 known warnings)
ACCEPTANCE: All verification passes.

---

## Phase 2: CLI Uninstall + Enhanced Error Reporting [COMPLETE]

### 2.1: Add CLI `uninstall` command [MEDIUM]
- [x] 2.1
FILE: src/cli/index.ts
CHANGE:
- Add `uninstall` command handler following the existing `install` pattern
- Reads opencode.json, removes 'opencode-swarm' from the `plugin` array
- Optionally removes opencode-swarm.json config file (with --clean flag)
- Prints confirmation message
- Add `uninstall` to help text
- Add `--clean` flag documentation
EDGE CASES (all must be handled):
- opencode.json does not exist → warn "No opencode.json found", exit 0
- opencode.json is malformed JSON → error "Could not parse opencode.json", exit 1
- plugin array is missing or empty → warn "Plugin not found in config", exit 0
- plugin entry not found → warn "opencode-swarm not installed", exit 0
- --clean with missing config file → silently skip (no error)
- File permission errors → catch and report with actionable message
ACCEPTANCE: `opencode-swarm uninstall` removes plugin entry from opencode.json. `--clean` also removes config file. Idempotent (running twice doesn't error). All edge cases produce clear user messages.

### 2.2: Add custom error classes [SMALL]
- [x] 2.2
FILE: src/utils/errors.ts (NEW)
CHANGE:
- Create SwarmError base class extending Error with `code` and `guidance` fields
- Create subclasses: ConfigError, HookError, ToolError, CLIError
- Each error includes a `guidance` string with actionable user-facing advice
- Export all classes from src/utils/index.ts
NOTE: This phase only introduces the error classes and integrates them into safeHook (task 2.3). Existing error sites across the codebase are NOT refactored — they can adopt SwarmError incrementally in future releases. No widespread import changes needed.
ACCEPTANCE: Error classes are importable. Each has code, message, and guidance fields.

### 2.3: Integrate error classes into safeHook [SMALL]
- [x] 2.3 (depends: 2.2)
FILE: src/hooks/utils.ts
CHANGE:
- Import HookError from utils/errors
- In safeHook catch block: if error is a SwarmError, log the guidance alongside the warning
- Non-SwarmError errors continue to log as before (backward compatible)
- Format: `[opencode-swarm] Hook '${name}' failed: ${message}\n  → ${guidance}`
ACCEPTANCE: SwarmError instances produce guidance in log output. Non-SwarmError behavior unchanged.

### 2.4: Add tests for CLI uninstall [MEDIUM]
- [x] 2.4 (depends: 2.1)
FILE: tests/unit/cli/uninstall.test.ts (NEW)
CHANGE:
- Test: uninstall removes plugin from opencode.json
- Test: uninstall with --clean removes config file
- Test: uninstall when plugin not present (idempotent, warns)
- Test: uninstall with missing opencode.json (warns, exits 0)
- Test: uninstall with malformed opencode.json (errors, exits 1)
- Test: uninstall with empty/missing plugin array (warns, exits 0)
- Test: --clean with missing config file (silently succeeds)
ACCEPTANCE: All uninstall scenarios and edge cases tested.

### 2.5: Add tests for error classes [SMALL]
- [x] 2.5 (depends: 2.2, 2.3)
FILE: tests/unit/utils/errors.test.ts (NEW)
CHANGE:
- Test: SwarmError has code, message, guidance fields
- Test: Subclasses (ConfigError, HookError, ToolError, CLIError) have correct names
- Test: safeHook logs guidance for SwarmError instances
- Test: safeHook unchanged behavior for regular Error instances
ACCEPTANCE: All error classes and integration tested.

### 2.6: Phase 2 verification [SMALL]
- [x] 2.6 (depends: 2.4, 2.5)
CHANGE: Full verification (test, build, typecheck, lint). All pass.

---

## Phase 3: New Slash Commands [COMPLETE]

### 3.1: Add `/swarm history` command [SMALL]
- [x] 3.1
FILES: src/commands/history.ts (NEW), src/commands/index.ts
CHANGE:
- Create handleHistoryCommand(directory, args) that reads plan.md via readSwarmFileAsync()
- Extracts all phases and their status ([COMPLETE], [IN PROGRESS], [PENDING])
- For each completed phase: show phase name, task count, completion status
- Format as markdown table
- Register in command dispatcher switch + help text
NOTE: No new persistence needed. plan.md is already persisted to disk by the architect. This command simply reads and formats existing data.
ACCEPTANCE: `/swarm history` shows completed phases summary. Missing/empty plan.md → "No history available."

### 3.2: Add `/swarm config` command [SMALL]
- [x] 3.2
FILES: src/commands/config.ts (NEW), src/commands/index.ts
CHANGE:
- Create handleConfigCommand(directory, args) that loads the current plugin config
- Uses existing loadPluginConfig(directory) from src/config/loader.ts — this reads from disk (user + project config files), no new persistence needed
- Displays current config as formatted JSON
- Shows config file location(s) (user-level, project-level)
- Register in command dispatcher switch + help text
ACCEPTANCE: `/swarm config` shows current resolved config. Missing config → shows defaults.

### 3.3: Add tests for new commands [SMALL]
- [x] 3.3 (depends: 3.1, 3.2)
FILES: tests/unit/commands/history.test.ts (NEW), tests/unit/commands/config.test.ts (NEW)
CHANGE:
- History: test with complete plan, empty plan, multi-phase plan
- Config: test with default config, custom config, missing config file
ACCEPTANCE: All new command handlers tested.

### 3.4: Phase 3 verification [SMALL]
- [x] 3.4 (depends: 3.3)
CHANGE: Full verification (test, build, typecheck, lint). All pass.

---

## Phase 4: Version Bump + Ship [COMPLETE]

### 4.1: Bump version to 4.4.0 [SMALL]
- [x] 4.1
FILE: package.json
CHANGE: Bump `"version"` field from `"4.3.2"` to `"4.4.0"`

### 4.2: Update CHANGELOG.md [SMALL]
- [x] 4.2 (depends: 4.1)
FILE: CHANGELOG.md
CHANGE: Add `## [4.4.0] - YYYY-MM-DD` entry (use actual date) with sections:
### Changed
- Updated `@opencode-ai/plugin` and `@opencode-ai/sdk` to 1.1.53
- Updated `@biomejs/biome` to 2.3.14
### Added
- CLI `uninstall` command with `--clean` flag for removing plugin from opencode.json
- Custom error classes (`SwarmError`, `ConfigError`, `HookError`, `ToolError`, `CLIError`) with actionable guidance messages
- `/swarm history` slash command — view completed phases from plan.md
- `/swarm config` slash command — view current resolved plugin configuration
- Enhanced `safeHook` error logging with guidance for SwarmError instances
### Tests
- Expanded test coverage for hooks (extractors, system-enhancer, context-budget, agent-activity, delegation-tracker, compaction-customizer, pipeline-tracker)
- Expanded test coverage for commands (status, plan, agents, dispatcher)
- New test suites for CLI uninstall, error classes, history command, config command

### 4.3: Final verification + rebuild [SMALL]
- [x] 4.3 (depends: 4.2)
CHANGE:
- `bun run build` — rebuild dist/
- `bun test` — all tests pass (target: 570+ tests)
- `bun run typecheck` — clean
- `bun run lint` — clean
- Reviewer: APPROVED required
ACCEPTANCE: All checks pass. Ready to commit and tag.
