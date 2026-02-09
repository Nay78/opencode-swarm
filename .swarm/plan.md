# Agent Guardrails — Circuit Breaker for Runaway Agents
Swarm: mega
Phase: 2 [IN PROGRESS] | Updated: 2026-02-09

## Problem
Subagents (especially the coder) sometimes get stuck in loops — outputting nonsense, repeating tool calls, or spinning for hours. The architect waits for the Task tool to return and never notices. This burns significant API costs with zero value.

## Solution
Two-layer circuit breaker system using existing Plugin API hooks.

Layer 1 (Soft Warning): At 50% of limits, inject a warning message into the agent's chat stream asking it to self-correct.
Layer 2 (Hard Block): At 100% of limits, block ALL further tool calls (throw error) AND inject a forceful "STOP" message.

Detection signals:
1. Tool call count per agent session
2. Wall-clock time since session started
3. Repetition — same tool+args hash >N times consecutively
4. Consecutive errors — >N errors in a row

---

## Phase 1: Core Implementation [COMPLETE]

- [x] 1.1: Add guardrails config schema [SMALL]
- [x] 1.2: Add per-session state tracking [SMALL]
- [x] 1.3: Implement guardrails hook logic [MEDIUM]
- [x] 1.4: Integrate into plugin hooks [SMALL]
- [x] 1.5: Tests (46 new tests, 668 total) [MEDIUM]
- [x] 1.6: Phase 1 verification — all green [SMALL]

---

## Phase 2: Documentation & Ship [IN PROGRESS]

### 2.1: Update README [SMALL]
- [ ] 2.1

### 2.2: CHANGELOG + version bump [SMALL]
- [ ] 2.2

### 2.3: Final verification + commit + push [SMALL]
- [ ] 2.3 (depends: 2.1, 2.2)
