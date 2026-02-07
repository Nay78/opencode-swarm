# opencode-swarm v4.5.0 — Tech Debt Resolution + New Features
Swarm: paid
Phase: 1 [PENDING] | Updated: 2026-02-07

## Problem
After shipping v4.4.0 (DX improvements), the codebase has accumulated tech debt and several high-value features are missing:
1. **Tech debt** — 7 `as any` casts, 3 string concatenation lint warnings, README stale (v4.3.1 badge, 447/483 test count, missing v4.4.0 features), duplicate prefix-stripping logic in agents/index.ts
2. **Feature gaps** — No `/swarm diagnose` health check, no `/swarm export` backup, no `/swarm reset` for starting fresh
3. **DX polish** — README doesn't document v4.4.0 features (history, config, uninstall commands)

## Solution
Three phases of improvements. Tech debt first (clean foundation), then new features, then README overhaul + ship.

---

## Phase 1: Tech Debt Resolution [PENDING]

### 1.1: Fix string concatenation lint warnings [SMALL]
- [ ] 1.1
FILES: src/hooks/agent-activity.ts, src/hooks/system-enhancer.ts
CHANGE:
- agent-activity.ts line 216: `content.trimEnd() + '\n\n' + newSection + '\n'` → template literal
- agent-activity.ts line 235: `content.substring(0, headingIndex) + newSection + '\n'` → template literal
- agent-activity.ts lines 226-231: multi-line string concat in return → template literal
- system-enhancer.ts line 136: `contextSummary.substring(0, maxChars - 3) + '...'` → template literal
ACCEPTANCE: `bun run lint` shows 0 infos for useTemplate. Only the 7 `as any` warnings remain.

### 1.2: Extract prefix-stripping utility in agents/index.ts [SMALL]
- [ ] 1.2
FILE: src/agents/index.ts
CHANGE:
- Create a helper function `stripSwarmPrefix(agentName: string, swarmPrefix?: string): string` that:
  - Returns agentName unchanged if swarmPrefix is undefined/empty
  - Returns agentName unchanged if it doesn't start with `${swarmPrefix}_`
  - Otherwise strips the prefix and returns the base name
  - Includes input validation (empty string guard)
- Replace the 3 duplicate `swarmPrefix.substring()` patterns in getModelForAgent (line 32-33), isAgentDisabled (line 52-54), getTemperatureOverride (line 67-69) with calls to this helper
- Export the helper for testing
ACCEPTANCE: No duplicate prefix-stripping code. Helper is tested. All existing tests still pass.

### 1.3: Remove `as any` casts in src/index.ts [MEDIUM]
- [ ] 1.3
FILE: src/index.ts
CHANGE:
- Investigate the Plugin type from @opencode-ai/plugin to find the correct hook handler types
- If the Plugin type doesn't export granular hook types (likely), create a local `PluginHooks` type in src/index.ts or src/types.ts that properly types each hook
- If proper typing isn't feasible without upstream changes, add `// biome-ignore lint/suspicious/noExplicitAny: Plugin API type limitation` inline comments to each `as any` cast to make the intent explicit
- Goal: either eliminate the casts or explicitly document why they're needed
ACCEPTANCE: Either 0 `as any` warnings OR all 7 have documented biome-ignore comments. Lint output is clean.

### 1.4: Add tests for stripSwarmPrefix utility [SMALL]
- [ ] 1.4 (depends: 1.2)
FILE: tests/unit/agents/prefix-utils.test.ts (NEW)
CHANGE:
- Test: no prefix (undefined) returns name unchanged
- Test: prefix match strips correctly (e.g., "local_coder" → "coder")
- Test: prefix doesn't match returns name unchanged
- Test: empty string input
- Test: prefix with no underscore separator
ACCEPTANCE: All prefix utility edge cases tested.

### 1.5: Phase 1 verification [SMALL]
- [ ] 1.5 (depends: 1.1, 1.3, 1.4)
CHANGE: Full verification (test, build, typecheck, lint). All pass. Lint warnings reduced.

---

## Phase 2: New Slash Commands [PENDING]

### 2.1: Add `/swarm diagnose` command [MEDIUM]
- [ ] 2.1
FILES: src/commands/diagnose.ts (NEW), src/commands/index.ts
CHANGE:
- Create handleDiagnoseCommand(directory, args) that checks swarm health:
  - .swarm/ directory exists
  - plan.md exists and is parseable (has phases)
  - context.md exists
  - Plugin config is valid (loadPluginConfig succeeds)
  - Reports each check with pass/fail status
- Register in command dispatcher and help text
ACCEPTANCE: `/swarm diagnose` shows health status. All checks produce clear pass/fail output.

### 2.2: Add `/swarm export` command [MEDIUM]
- [ ] 2.2
FILES: src/commands/export.ts (NEW), src/commands/index.ts
CHANGE:
- Create handleExportCommand(directory, args) that:
  - Reads plan.md and context.md from .swarm/
  - Serializes to a single JSON object: { version: "4.5.0", exported: ISO timestamp, plan: string, context: string }
  - Returns the JSON as formatted output (displayed to user, not written to file — the user can copy/paste or redirect)
- Register in command dispatcher and help text
ACCEPTANCE: `/swarm export` outputs valid JSON with plan + context. Missing files produce null values, not errors.

### 2.3: Add `/swarm reset` command [SMALL]
- [ ] 2.3
FILES: src/commands/reset.ts (NEW), src/commands/index.ts
CHANGE:
- Create handleResetCommand(directory, args) that:
  - Displays warning: "This will clear plan.md and context.md. Use /swarm export first to backup."
  - Requires `--confirm` flag to actually execute (safety gate)
  - Without --confirm: shows warning + instructions, does NOT delete
  - With --confirm: deletes plan.md and context.md via Bun.write (empty string or unlink)
  - Reports what was cleared
- Register in command dispatcher and help text
ACCEPTANCE: `/swarm reset` warns without --confirm. With --confirm, clears .swarm/ state files. Missing files handled gracefully.

### 2.4: Add tests for new commands [MEDIUM]
- [ ] 2.4 (depends: 2.1, 2.2, 2.3)
FILES: tests/unit/commands/diagnose.test.ts (NEW), tests/unit/commands/export.test.ts (NEW), tests/unit/commands/reset.test.ts (NEW)
CHANGE:
- Diagnose: test with full .swarm/ setup, missing files, invalid config
- Export: test with both files present, one missing, both missing
- Reset: test without --confirm (no deletion), with --confirm (files deleted), missing files
ACCEPTANCE: All new command handlers tested with edge cases.

### 2.5: Phase 2 verification [SMALL]
- [ ] 2.5 (depends: 2.4)
CHANGE: Full verification (test, build, typecheck, lint). All pass.

---

## Phase 3: README Overhaul + Ship [PENDING]

### 3.1: Update README.md [MEDIUM]
- [ ] 3.1
FILE: README.md
CHANGE:
- Update version badge: 4.3.1 → 4.5.0
- Update tests badge: 483 → current count
- Update "What's New" section to cover v4.3.2 through v4.5.0:
  - v4.3.2: Security hardening (path validation, fetch hardening, config size limits)
  - v4.4.0: CLI uninstall, error classes, /swarm history + config
  - v4.5.0: Tech debt cleanup, /swarm diagnose + export + reset
- Add all 8 slash commands to the Slash Commands section: status, plan, agents, history, config, diagnose, export, reset
- Add CLI section documenting both install and uninstall (with --clean)
- Update test count in Testing section
- Add Troubleshooting section with common issues
ACCEPTANCE: README accurately reflects v4.5.0 state. All features documented.

### 3.2: Bump version to 4.5.0 + update CHANGELOG [SMALL]
- [ ] 3.2
FILES: package.json, CHANGELOG.md
CHANGE:
- Bump version to 4.5.0
- Add CHANGELOG entry with:
  ### Fixed
  - Replaced string concatenation with template literals in hooks (lint clean)
  - Extracted duplicate prefix-stripping logic into `stripSwarmPrefix()` utility
  - Documented or eliminated `as any` casts in plugin hook registration
  ### Added
  - `/swarm diagnose` — health check for .swarm/ files, config, and plugin state
  - `/swarm export` — export plan.md + context.md as portable JSON
  - `/swarm reset` — clear .swarm/ state with safety confirmation
  - `stripSwarmPrefix()` utility with input validation
  ### Changed
  - README.md updated with all v4.3.2-v4.5.0 features, commands, and troubleshooting
  ### Tests
  - New test suites for diagnose, export, reset commands and prefix utility

### 3.3: Final verification + rebuild [SMALL]
- [ ] 3.3 (depends: 3.1, 3.2)
CHANGE:
- `bun run build` — rebuild dist/
- `bun test` — all tests pass
- `bun run typecheck` — clean
- `bun run lint` — clean (reduced warnings)
- Reviewer: APPROVED required
ACCEPTANCE: All checks pass. Ready to commit and tag.
