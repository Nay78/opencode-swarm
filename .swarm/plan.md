# opencode-swarm v4.3.0 — Hooks, Context, Commands & Agent Awareness
Swarm: paid
Phase: 5 [COMPLETE] | Updated: 2026-02-07

## Overview
Four feature areas deferred from v4.2.0, now planned for v4.3.0. Ordered by dependency:
1. **Hooks Pipeline Enhancement** — Foundation (other features depend on this)
2. **Context Pruning** — Depends on hooks
3. **Slash Commands** — Independent but benefits from hooks
4. **Agent Awareness** — Depends on hooks (renamed from "Message Passing" — see note)

> **Rename rationale**: "Agent Message Passing" implied direct inter-agent communication (message queues, routing). What we're actually building is **Agent Awareness** — hooks that track agent activity and inject cross-agent context via system prompts. No message queue, no routing. The architect remains sole orchestrator.

### Real OpenCode Plugin API Hooks (from @opencode-ai/plugin v1.1.19)
Available hook types we can use:
- `chat.message` — Called on new message (sessionID, agent, model, parts)
- `chat.params` — Modify LLM params (temperature, topP, topK, options)
- `config` — Modify OpenCode config (can register commands here)
- `command.execute.before` — Intercept slash commands (command, sessionID, arguments, parts)
- `tool.execute.before` — Before tool use (tool name, args)
- `tool.execute.after` — After tool use (title, output, metadata)
- `experimental.chat.messages.transform` — Transform full message array (CURRENTLY USED)
- `experimental.chat.system.transform` — Transform system prompt (system string array)
- `experimental.session.compacting` — Customize session compaction prompt/context

**CONSTRAINT**: Plugin API allows ONE handler per hook type. Multiple hooks using the same type MUST be composed into a single handler via `composeHandlers()`.

### Acceptance Criteria (Global)
- `bun test` passes with 0 failures (including new tests)
- Build, typecheck, lint all clean
- All features opt-in via config (backward compatible)
- No new runtime dependencies
- All file I/O in hooks uses async APIs (Bun.file / fs/promises)

---

## Phase 1: Hooks Pipeline Enhancement [COMPLETE]

### 1.1: Fix pipeline-tracker default value bug [SMALL] ✅
### 1.2: Create hook utilities [SMALL] ✅
### 1.3: Add system prompt transform hook [MEDIUM] ✅
### 1.4: Add session compaction hook [MEDIUM] ✅
### 1.5: Refactor pipeline-tracker to use safeHook + composeHandlers [SMALL] ✅
### 1.6: Update hooks index and registration [SMALL] ✅
### 1.7: Review + test pass [SMALL] ✅

---

## Phase 2: Context Pruning [COMPLETE]
depends: Phase 1

### 2.1: Add context budget tracker [MEDIUM]
NEW FILE: src/hooks/context-budget.ts
HOOK TYPE: `experimental.chat.messages.transform` (composed with pipeline-tracker via composeHandlers)
PURPOSE: Estimate token usage and inject budget warnings into architect messages
- Uses `estimateTokens()` from utils.ts on all message parts
- Context limit: configurable per-model via `context_budget.model_limits` map, with sensible default (128k tokens)
  Example: `{ "claude-sonnet-4-20250514": 200000, "default": 128000 }` (addresses critic #3)
- When budget > warn_threshold: inject "[CONTEXT WARNING: ~N% used. Consider summarizing to .swarm/context.md]"
- When budget > critical_threshold: inject "[CONTEXT CRITICAL: ~N% used. Offload details immediately]"
- Config: `context_budget: { enabled, warn_threshold (0.7), critical_threshold (0.9), model_limits }`
MODIFY: src/config/schema.ts — add context_budget config section
MODIFY: src/index.ts — compose context-budget + pipeline-tracker into single `experimental.chat.messages.transform` handler
TEST: tests/unit/hooks/context-budget.test.ts

### 2.2: Enhance compaction context injection [SMALL]
MODIFY: src/hooks/compaction-customizer.ts (from Phase 1)
PURPOSE: Enrich compaction context with swarm-specific data
- Read .swarm/plan.md: extract current phase + incomplete tasks
- Read .swarm/context.md: extract decisions + patterns sections
- Inject as compaction context strings (max 500 chars each to avoid bloat)
- This is our main "pruning" lever — guide OpenCode's built-in compaction
TEST: Update tests/unit/hooks/compaction-customizer.test.ts

### 2.3: Enhance system prompt context injection [SMALL]
MODIFY: src/hooks/system-enhancer.ts (from Phase 1)
PURPOSE: Inject current task context so agents stay focused after compaction
- Current phase + task from plan.md (abbreviated to ~200 chars)
- Key decisions from context.md (top 3 most recent)
- Keeps agents on track even when conversation history is compacted
TEST: Update tests/unit/hooks/system-enhancer.test.ts

### 2.4: Review + test pass [SMALL]
- Full suite pass
- Reviewer check: correctness, token estimation, threshold behavior, composeHandlers integration
- Acceptance: Budget warnings inject correctly, compaction preserves swarm context

---

## Phase 3: Slash Commands [COMPLETE]

### 3.1: Register commands via config hook [SMALL]
MODIFY: src/index.ts — in the existing `config` hook handler, add command registration AFTER agent merge:
```typescript
// Register /swarm command
opencodeConfig.command = {
  ...(opencodeConfig.command as Record<string, unknown> || {}),
  swarm: { template: "{{arguments}}", description: "Swarm management commands" }
};
```
PURPOSE: Register `/swarm` as an OpenCode command so `command.execute.before` receives it
NOTE: Verified from @opencode-ai/sdk types — Config type has `command?: { [key: string]: { template, description?, agent?, model?, subtask? } }`. Uses spread to preserve existing user-defined commands.
TEST: Update tests/unit/config/ or add inline assertions verifying config hook sets opencodeConfig.command.swarm

### 3.2: Implement command handler infrastructure [MEDIUM]
NEW FILE: src/commands/index.ts
HOOK TYPE: `command.execute.before`
PURPOSE: Route `/swarm <subcommand>` to handlers via factory pattern

**Factory function**: `createSwarmCommandHandler(directory: string, agents: Record<string, AgentDefinition>)`
- Returns a `command.execute.before` handler with closure over directory + agents
- Called in src/index.ts where both ctx.directory and agents are available
- Handler logic:
  - If `input.command !== "swarm"` → return immediately (pass through)
  - Parse arguments: `const parts = input.arguments.trim().split(/\s+/).filter(Boolean)` — filter(Boolean) handles empty string edge case
  - `const [subcommand, ...args] = parts` — if parts is empty, subcommand is undefined → show help
  - Dispatch: "status" → statusHandler, "plan" → planHandler, "agents" → agentsHandler
  - Unknown/empty subcommand → set `output.parts` with help text listing available commands
  - All handlers receive (directory, agents, args) as needed

**String → Part[] conversion**: Each handler returns `Promise<string>` (markdown text). The dispatcher converts:
```typescript
const text = await handler(directory, agents, args);
output.parts = [{ type: "text", text } as unknown as Part];
```
Note: `Part` is a union type (TextPart | SubtaskPart | ...) from @opencode-ai/sdk. TextPart has {id, sessionID, messageID, type: "text", text}. For hook output, we only need to set `type` and `text` — OpenCode fills in the rest. Cast via `as unknown as Part` for type safety (same pattern used for other hook registrations).

**Integration into src/index.ts**:
```typescript
import { createSwarmCommandHandler } from './commands';
// In plugin return object (flat keys, same level as other hooks):
'command.execute.before': safeHook(createSwarmCommandHandler(ctx.directory, agents)) as any,
```
- `command.execute.before` is a NEW hook type (not yet used) — no composeHandlers needed
- safeHook wraps the handler for crash safety
- Import added at top of index.ts alongside existing hook imports
- Plugin return object uses flat keys (not nested `hooks`), so this is simply a new property

NEW BARREL: src/commands/index.ts exports createSwarmCommandHandler + re-exports individual handlers
TEST: tests/unit/commands/index.test.ts — mock readSwarmFileAsync via module mock, test routing for "status", "plan", "agents", unknown, empty args, and non-swarm commands

### 3.3: Implement /swarm status command [SMALL]
NEW FILE: src/commands/status.ts
EXPORT: `handleStatusCommand(directory: string, agents: Record<string, AgentDefinition>): Promise<string>`
PURPOSE: Show current swarm state from .swarm/plan.md
- Uses readSwarmFileAsync(directory, "plan.md") for file I/O
- Uses extractCurrentPhase() for phase detection
- Counts completed (- [x]) vs total (- [ ] and - [x]) tasks in current phase
- Shows agent count from Object.keys(agents).length
- Returns formatted markdown string
- If plan.md missing → return "No active swarm plan found."
TEST: tests/unit/commands/status.test.ts — use Bun mock to stub readSwarmFileAsync, test with sample plan content, missing plan, and edge cases

### 3.4: Implement /swarm plan command [SMALL]
NEW FILE: src/commands/plan.ts
EXPORT: `handlePlanCommand(directory: string, args: string[]): Promise<string>`
PURPOSE: Show plan.md content or specific phase
- `/swarm plan` (no args) → return full plan.md content
- `/swarm plan 2` (numeric arg) → extract Phase 2 section only
- Phase extraction: split on `## Phase \d+` regex, find matching section, return from heading to next heading or EOF
- If plan.md missing → "No active swarm plan found."
- If phase number not found → "Phase N not found in plan."
- Malformed/non-numeric arg → treat as full plan display
TEST: tests/unit/commands/plan.test.ts — stub readSwarmFileAsync, test full plan, specific phase, missing plan, invalid phase number, malformed heading

### 3.5: Implement /swarm agents command [SMALL]
NEW FILE: src/commands/agents.ts
EXPORT: `handleAgentsCommand(agents: Record<string, AgentDefinition>): string`
PURPOSE: List all registered agents (synchronous — no file I/O needed)
- Iterate Object.entries(agents)
- For each: show name, model, temperature
- Indicate read-only if agent.tools has `write: false` or `edit: false`
- Format as markdown table or list
- If no agents → "No agents registered."
TEST: tests/unit/commands/agents.test.ts — pass mock agent configs, verify output format, test empty agents, test read-only detection

### 3.6: Review + test pass [SMALL]
- Full suite pass (341+ tests)
- Reviewer check: command registration, argument parsing, error handling, output formatting, integration with index.ts
- Acceptance: All 3 commands work, unknown subcommands show help, non-swarm commands pass through

---

## Phase 4: Agent Awareness [COMPLETE]
depends: Phase 1

### 4.1: Add shared state module [SMALL] ✅
### 4.2: Add agent activity tracking via tool hooks [MEDIUM] ✅
### 4.3: Add delegation tracking via chat.message hook [SMALL] ✅
### 4.4: Add cross-agent context injection to system-enhancer [MEDIUM] ✅
### 4.5: Register new hooks in index.ts [SMALL] ✅
### 4.6: Review + test pass [MEDIUM] ✅
- Reviewer: APPROVED (LOW risk) after 1 revision cycle (6 fixes applied)
- Tests: 67 new tests (24 state + 14 agent-activity + 16 delegation-tracker + 13 system-enhancer cross-agent)
- Full suite: 447 tests pass across 21 files, build/typecheck/lint clean

---

## Phase 5: Documentation + Release [COMPLETE]
depends: Phases 1-4

### 5.1: Update CHANGELOG.md with v4.3.0 entry [SMALL] ✅
### 5.2: Update README.md — version badge, feature list, test count [SMALL] ✅
### 5.3: Update docs/architecture.md — hooks system, commands, context pruning [MEDIUM] ✅
### 5.4: Update docs/installation.md — new config options [SMALL] ✅
### 5.5: Bump package.json to 4.3.0 [SMALL] ✅
### 5.6: Final full verification + review [SMALL] ✅
- `bun test` — 447 tests pass across 21 files
- `bun run build` — clean
- `bun run typecheck` — clean
- `bun run lint` — 7 known warnings (as any casts), 0 errors
- Reviewer: APPROVED (LOW risk), test count discrepancy fixed

---

## Config Schema Design (addresses critic #5)
Group related flags under `hooks` and `context_budget` objects instead of flat booleans:

```typescript
{
  // Existing (unchanged)
  agents: { ... },
  swarms: { ... },
  max_iterations: 5,
  qa_retry_limit: 3,
  inject_phase_reminders: true,  // kept for backward compat

  // New — grouped config
  hooks: {
    system_enhancer: true,              // experimental.chat.system.transform
    compaction: true,                   // experimental.session.compacting
    agent_activity: true,              // tool.execute.before/after
    delegation_tracker: false,         // chat.message (opt-in diagnostic)
    agent_awareness_max_chars: 300     // max chars for cross-agent context injection
  },
  context_budget: {
    enabled: true,
    warn_threshold: 0.7,
    critical_threshold: 0.9,
    model_limits: {                    // tokens per model
      "default": 128000
    }
  }
}
```
