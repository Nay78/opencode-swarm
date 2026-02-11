# Fix Circuit Breaker Duration Limits
Swarm: mega
Phase: 1 [PENDING] | Updated: 2026-02-11

## Problem
The guardrails circuit breaker kills architect sessions prematurely at 30-90 minutes. Despite 5 prior fix attempts (v5.0.3-5.0.7), the fundamental design is flawed: session duration is hard-capped at 120 minutes in the Zod schema, and even the 90-minute architect default is too short for multi-phase projects that legitimately run 2-4+ hours.

## Root Cause
1. `max_duration_minutes` has `z.number().min(1).max(120)` — cannot go above 120
2. Architect built-in default is 90 min — too low for real work
3. Duration is cumulative from session start with no reset mechanism
4. No idle timeout — the breaker can't distinguish "active for 3 hours" from "stuck for 3 hours"

## Fix Strategy
- Allow `0` as a special "no limit" value for duration
- Set architect default to `0` (unlimited duration)
- Add idle timeout detection (time since last successful tool call)
- Raise schema max from 120 to 480 for users who want explicit caps
- Keep repetition, consecutive error, and tool call limits unchanged

---

## Phase 1: Schema & State Changes [PENDING]

- [ ] 1.1: Update GuardrailsProfileSchema and GuardrailsConfigSchema — allow 0 (no limit) for max_duration_minutes, raise max to 480 [SMALL]
- [ ] 1.2: Update DEFAULT_AGENT_PROFILES — set architect max_duration_minutes to 0 (unlimited) [SMALL]
- [ ] 1.3: Add idle_timeout_minutes to GuardrailsProfileSchema and GuardrailsConfigSchema — default 60 min, min 5, max 240 [SMALL]
- [ ] 1.4: Add lastSuccessTime field to AgentSessionState in state.ts [SMALL]
- [ ] 1.5: Update guardrails.ts — skip duration check when max_duration_minutes is 0, add idle timeout check, update toolAfter to track lastSuccessTime [MEDIUM]
- [ ] 1.6: Update tests — fix assertions for new schema ranges, add idle timeout tests, add 0=unlimited tests [MEDIUM]
- [ ] 1.7: Build, run full test suite, bump version to 5.0.8, update CHANGELOG [SMALL]
