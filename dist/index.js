import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// src/config/loader.ts
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// src/config/schema.ts
import { z } from "zod";
var AgentOverrideConfigSchema = z.object({
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  disabled: z.boolean().optional()
});
var SwarmConfigSchema = z.object({
  name: z.string().optional(),
  agents: z.record(z.string(), AgentOverrideConfigSchema).optional()
});
var HooksConfigSchema = z.object({
  system_enhancer: z.boolean().default(true),
  compaction: z.boolean().default(true),
  agent_activity: z.boolean().default(true),
  delegation_tracker: z.boolean().default(false),
  agent_awareness_max_chars: z.number().min(50).max(2000).default(300),
  delegation_gate: z.boolean().default(true),
  delegation_max_chars: z.number().min(500).max(20000).default(4000)
});
var ScoringWeightsSchema = z.object({
  phase: z.number().min(0).max(5).default(1),
  current_task: z.number().min(0).max(5).default(2),
  blocked_task: z.number().min(0).max(5).default(1.5),
  recent_failure: z.number().min(0).max(5).default(2.5),
  recent_success: z.number().min(0).max(5).default(0.5),
  evidence_presence: z.number().min(0).max(5).default(1),
  decision_recency: z.number().min(0).max(5).default(1.5),
  dependency_proximity: z.number().min(0).max(5).default(1)
});
var DecisionDecaySchema = z.object({
  mode: z.enum(["linear", "exponential"]).default("exponential"),
  half_life_hours: z.number().min(1).max(168).default(24)
});
var TokenRatiosSchema = z.object({
  prose: z.number().min(0.1).max(1).default(0.25),
  code: z.number().min(0.1).max(1).default(0.4),
  markdown: z.number().min(0.1).max(1).default(0.3),
  json: z.number().min(0.1).max(1).default(0.35)
});
var ScoringConfigSchema = z.object({
  enabled: z.boolean().default(false),
  max_candidates: z.number().min(10).max(500).default(100),
  weights: ScoringWeightsSchema.optional(),
  decision_decay: DecisionDecaySchema.optional(),
  token_ratios: TokenRatiosSchema.optional()
});
var ContextBudgetConfigSchema = z.object({
  enabled: z.boolean().default(true),
  warn_threshold: z.number().min(0).max(1).default(0.7),
  critical_threshold: z.number().min(0).max(1).default(0.9),
  model_limits: z.record(z.string(), z.number().min(1000)).default({ default: 128000 }),
  max_injection_tokens: z.number().min(100).max(50000).default(4000),
  scoring: ScoringConfigSchema.optional()
});
var EvidenceConfigSchema = z.object({
  enabled: z.boolean().default(true),
  max_age_days: z.number().min(1).max(365).default(90),
  max_bundles: z.number().min(10).max(1e4).default(1000),
  auto_archive: z.boolean().default(false)
});
var SummaryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  threshold_bytes: z.number().min(1024).max(1048576).default(20480),
  max_summary_chars: z.number().min(100).max(5000).default(1000),
  max_stored_bytes: z.number().min(10240).max(104857600).default(10485760),
  retention_days: z.number().min(1).max(365).default(7)
});
var GuardrailsProfileSchema = z.object({
  max_tool_calls: z.number().min(0).max(1000).optional(),
  max_duration_minutes: z.number().min(0).max(480).optional(),
  max_repetitions: z.number().min(3).max(50).optional(),
  max_consecutive_errors: z.number().min(2).max(20).optional(),
  warning_threshold: z.number().min(0.1).max(0.9).optional(),
  idle_timeout_minutes: z.number().min(5).max(240).optional()
});
var DEFAULT_AGENT_PROFILES = {
  architect: {
    max_tool_calls: 0,
    max_duration_minutes: 0,
    max_consecutive_errors: 8,
    warning_threshold: 0.75
  },
  coder: {
    max_tool_calls: 400,
    max_duration_minutes: 45,
    warning_threshold: 0.85
  },
  test_engineer: {
    max_tool_calls: 400,
    max_duration_minutes: 45,
    warning_threshold: 0.85
  },
  explorer: {
    max_tool_calls: 150,
    max_duration_minutes: 20,
    warning_threshold: 0.75
  },
  reviewer: {
    max_tool_calls: 200,
    max_duration_minutes: 30,
    warning_threshold: 0.65
  },
  critic: {
    max_tool_calls: 200,
    max_duration_minutes: 30,
    warning_threshold: 0.65
  },
  sme: {
    max_tool_calls: 200,
    max_duration_minutes: 30,
    warning_threshold: 0.65
  }
};
var DEFAULT_ARCHITECT_PROFILE = DEFAULT_AGENT_PROFILES.architect;
var GuardrailsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  max_tool_calls: z.number().min(0).max(1000).default(200),
  max_duration_minutes: z.number().min(0).max(480).default(30),
  max_repetitions: z.number().min(3).max(50).default(10),
  max_consecutive_errors: z.number().min(2).max(20).default(5),
  warning_threshold: z.number().min(0.1).max(0.9).default(0.75),
  idle_timeout_minutes: z.number().min(5).max(240).default(60),
  profiles: z.record(z.string(), GuardrailsProfileSchema).optional()
});
function normalizeAgentName(name) {
  return name.toLowerCase().replace(/[-\s]+/g, "_");
}
function stripKnownSwarmPrefix(name) {
  if (!name)
    return name;
  if (ALL_AGENT_NAMES.includes(name))
    return name;
  const normalized = normalizeAgentName(name);
  for (const agentName of ALL_AGENT_NAMES) {
    const normalizedAgent = normalizeAgentName(agentName);
    if (normalized === normalizedAgent)
      return agentName;
    if (normalized.endsWith("_" + normalizedAgent)) {
      return agentName;
    }
  }
  return name;
}
function resolveGuardrailsConfig(base, agentName) {
  if (!agentName) {
    return base;
  }
  const baseName = stripKnownSwarmPrefix(agentName);
  const builtInLookup = DEFAULT_AGENT_PROFILES[baseName];
  const builtIn = builtInLookup;
  const userProfile = base.profiles?.[baseName] ?? base.profiles?.[agentName];
  if (!builtIn && !userProfile) {
    return base;
  }
  return { ...base, ...builtIn, ...userProfile };
}
var PluginConfigSchema = z.object({
  agents: z.record(z.string(), AgentOverrideConfigSchema).optional(),
  swarms: z.record(z.string(), SwarmConfigSchema).optional(),
  max_iterations: z.number().min(1).max(10).default(5),
  qa_retry_limit: z.number().min(1).max(10).default(3),
  inject_phase_reminders: z.boolean().default(true),
  hooks: HooksConfigSchema.optional(),
  context_budget: ContextBudgetConfigSchema.optional(),
  guardrails: GuardrailsConfigSchema.optional(),
  evidence: EvidenceConfigSchema.optional(),
  summaries: SummaryConfigSchema.optional()
});

// src/config/loader.ts
var CONFIG_FILENAME = "opencode-swarm.json";
var PROMPTS_DIR_NAME = "opencode-swarm";
var MAX_CONFIG_FILE_BYTES = 102400;
function getUserConfigDir() {
  return process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
}
function loadConfigFromPath(configPath) {
  try {
    const stats = fs.statSync(configPath);
    if (stats.size > MAX_CONFIG_FILE_BYTES) {
      console.warn(`[opencode-swarm] Config file too large (max 100 KB): ${configPath}`);
      return null;
    }
    const content = fs.readFileSync(configPath, "utf-8");
    const rawConfig = JSON.parse(content);
    const result = PluginConfigSchema.safeParse(rawConfig);
    if (!result.success) {
      console.warn(`[opencode-swarm] Invalid config at ${configPath}:`);
      console.warn(result.error.format());
      return null;
    }
    return result.data;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
      console.warn(`[opencode-swarm] Error reading config from ${configPath}:`, error.message);
    }
    return null;
  }
}
var MAX_MERGE_DEPTH = 10;
function deepMergeInternal(base, override, depth) {
  if (depth >= MAX_MERGE_DEPTH) {
    throw new Error(`deepMerge exceeded maximum depth of ${MAX_MERGE_DEPTH}`);
  }
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const baseVal = base[key];
    const overrideVal = override[key];
    if (typeof baseVal === "object" && baseVal !== null && typeof overrideVal === "object" && overrideVal !== null && !Array.isArray(baseVal) && !Array.isArray(overrideVal)) {
      result[key] = deepMergeInternal(baseVal, overrideVal, depth + 1);
    } else {
      result[key] = overrideVal;
    }
  }
  return result;
}
function deepMerge(base, override) {
  if (!base)
    return override;
  if (!override)
    return base;
  return deepMergeInternal(base, override, 0);
}
function loadPluginConfig(directory) {
  const userConfigPath = path.join(getUserConfigDir(), "opencode", CONFIG_FILENAME);
  const projectConfigPath = path.join(directory, ".opencode", CONFIG_FILENAME);
  let config = loadConfigFromPath(userConfigPath) ?? {
    max_iterations: 5,
    qa_retry_limit: 3,
    inject_phase_reminders: true
  };
  const projectConfig = loadConfigFromPath(projectConfigPath);
  if (projectConfig) {
    config = {
      ...config,
      ...projectConfig,
      agents: deepMerge(config.agents, projectConfig.agents)
    };
  }
  return config;
}
function loadAgentPrompt(agentName) {
  const promptsDir = path.join(getUserConfigDir(), "opencode", PROMPTS_DIR_NAME);
  const result = {};
  const promptPath = path.join(promptsDir, `${agentName}.md`);
  if (fs.existsSync(promptPath)) {
    try {
      result.prompt = fs.readFileSync(promptPath, "utf-8");
    } catch (error) {
      console.warn(`[opencode-swarm] Error reading prompt file ${promptPath}:`, error instanceof Error ? error.message : String(error));
    }
  }
  const appendPromptPath = path.join(promptsDir, `${agentName}_append.md`);
  if (fs.existsSync(appendPromptPath)) {
    try {
      result.appendPrompt = fs.readFileSync(appendPromptPath, "utf-8");
    } catch (error) {
      console.warn(`[opencode-swarm] Error reading append prompt ${appendPromptPath}:`, error instanceof Error ? error.message : String(error));
    }
  }
  return result;
}

// src/config/constants.ts
var QA_AGENTS = ["reviewer", "critic"];
var PIPELINE_AGENTS = ["explorer", "coder", "test_engineer"];
var ORCHESTRATOR_NAME = "architect";
var ALL_SUBAGENT_NAMES = [
  "sme",
  ...QA_AGENTS,
  ...PIPELINE_AGENTS
];
var ALL_AGENT_NAMES = [
  ORCHESTRATOR_NAME,
  ...ALL_SUBAGENT_NAMES
];
var DEFAULT_MODELS = {
  architect: "anthropic/claude-sonnet-4-5",
  explorer: "google/gemini-2.0-flash",
  coder: "anthropic/claude-sonnet-4-5",
  test_engineer: "google/gemini-2.0-flash",
  sme: "google/gemini-2.0-flash",
  reviewer: "google/gemini-2.0-flash",
  critic: "google/gemini-2.0-flash",
  default: "google/gemini-2.0-flash"
};
var DEFAULT_SCORING_CONFIG = {
  enabled: false,
  max_candidates: 100,
  weights: {
    phase: 1,
    current_task: 2,
    blocked_task: 1.5,
    recent_failure: 2.5,
    recent_success: 0.5,
    evidence_presence: 1,
    decision_recency: 1.5,
    dependency_proximity: 1
  },
  decision_decay: {
    mode: "exponential",
    half_life_hours: 24
  },
  token_ratios: {
    prose: 0.25,
    code: 0.4,
    markdown: 0.3,
    json: 0.35
  }
};
// src/config/plan-schema.ts
import { z as z2 } from "zod";
var TaskStatusSchema = z2.enum([
  "pending",
  "in_progress",
  "completed",
  "blocked"
]);
var TaskSizeSchema = z2.enum(["small", "medium", "large"]);
var PhaseStatusSchema = z2.enum([
  "pending",
  "in_progress",
  "complete",
  "blocked"
]);
var MigrationStatusSchema = z2.enum([
  "native",
  "migrated",
  "migration_failed"
]);
var TaskSchema = z2.object({
  id: z2.string(),
  phase: z2.number().int().min(1),
  status: TaskStatusSchema.default("pending"),
  size: TaskSizeSchema.default("small"),
  description: z2.string().min(1),
  depends: z2.array(z2.string()).default([]),
  acceptance: z2.string().optional(),
  files_touched: z2.array(z2.string()).default([]),
  evidence_path: z2.string().optional(),
  blocked_reason: z2.string().optional()
});
var PhaseSchema = z2.object({
  id: z2.number().int().min(1),
  name: z2.string().min(1),
  status: PhaseStatusSchema.default("pending"),
  tasks: z2.array(TaskSchema).default([])
});
var PlanSchema = z2.object({
  schema_version: z2.literal("1.0.0"),
  title: z2.string().min(1),
  swarm: z2.string().min(1),
  current_phase: z2.number().int().min(1),
  phases: z2.array(PhaseSchema).min(1),
  migration_status: MigrationStatusSchema.optional()
});
// src/config/evidence-schema.ts
import { z as z3 } from "zod";
var EVIDENCE_MAX_JSON_BYTES = 500 * 1024;
var EVIDENCE_MAX_PATCH_BYTES = 5 * 1024 * 1024;
var EVIDENCE_MAX_TASK_BYTES = 20 * 1024 * 1024;
var EvidenceTypeSchema = z3.enum([
  "review",
  "test",
  "diff",
  "approval",
  "note"
]);
var EvidenceVerdictSchema = z3.enum([
  "pass",
  "fail",
  "approved",
  "rejected",
  "info"
]);
var BaseEvidenceSchema = z3.object({
  task_id: z3.string().min(1),
  type: EvidenceTypeSchema,
  timestamp: z3.string().datetime(),
  agent: z3.string().min(1),
  verdict: EvidenceVerdictSchema,
  summary: z3.string().min(1),
  metadata: z3.record(z3.string(), z3.unknown()).optional()
});
var ReviewEvidenceSchema = BaseEvidenceSchema.extend({
  type: z3.literal("review"),
  risk: z3.enum(["low", "medium", "high", "critical"]),
  issues: z3.array(z3.object({
    severity: z3.enum(["error", "warning", "info"]),
    message: z3.string().min(1),
    file: z3.string().optional(),
    line: z3.number().int().optional()
  })).default([])
});
var TestEvidenceSchema = BaseEvidenceSchema.extend({
  type: z3.literal("test"),
  tests_passed: z3.number().int().min(0),
  tests_failed: z3.number().int().min(0),
  test_file: z3.string().optional(),
  failures: z3.array(z3.object({
    name: z3.string().min(1),
    message: z3.string().min(1)
  })).default([])
});
var DiffEvidenceSchema = BaseEvidenceSchema.extend({
  type: z3.literal("diff"),
  files_changed: z3.array(z3.string()).default([]),
  additions: z3.number().int().min(0).default(0),
  deletions: z3.number().int().min(0).default(0),
  patch_path: z3.string().optional()
});
var ApprovalEvidenceSchema = BaseEvidenceSchema.extend({
  type: z3.literal("approval")
});
var NoteEvidenceSchema = BaseEvidenceSchema.extend({
  type: z3.literal("note")
});
var EvidenceSchema = z3.discriminatedUnion("type", [
  ReviewEvidenceSchema,
  TestEvidenceSchema,
  DiffEvidenceSchema,
  ApprovalEvidenceSchema,
  NoteEvidenceSchema
]);
var EvidenceBundleSchema = z3.object({
  schema_version: z3.literal("1.0.0"),
  task_id: z3.string().min(1),
  entries: z3.array(EvidenceSchema).default([]),
  created_at: z3.string().datetime(),
  updated_at: z3.string().datetime()
});
// src/agents/architect.ts
var ARCHITECT_PROMPT = `You are Architect - orchestrator of a multi-agent swarm.

## IDENTITY

Swarm: {{SWARM_ID}}
Your agents: {{AGENT_PREFIX}}explorer, {{AGENT_PREFIX}}sme, {{AGENT_PREFIX}}coder, {{AGENT_PREFIX}}reviewer, {{AGENT_PREFIX}}critic, {{AGENT_PREFIX}}test_engineer

## ROLE

You THINK. Subagents DO. You have the largest context window and strongest reasoning. Subagents have smaller contexts and weaker reasoning. Your job:
- Digest complex requirements into simple, atomic tasks
- Provide subagents with ONLY what they need (not everything you know)
- Never pass raw files - summarize relevant parts
- Never assume subagents remember prior context

## RULES

1. DELEGATE all coding to {{AGENT_PREFIX}}coder. You do NOT write code.
2. ONE agent per message. Send, STOP, wait for response.
3. ONE task per {{AGENT_PREFIX}}coder call. Never batch.
4. Fallback: Only code yourself after {{QA_RETRY_LIMIT}} {{AGENT_PREFIX}}coder failures on same task.
5. NEVER store your swarm identity, swarm ID, or agent prefix in memory blocks. Your identity comes ONLY from your system prompt. Memory blocks are for project knowledge only.
6. **CRITIC GATE (Execute BEFORE any implementation work)**:
   - When you first create a plan, IMMEDIATELY delegate the full plan to {{AGENT_PREFIX}}critic for review
   - Wait for critic verdict: APPROVED / NEEDS_REVISION / REJECTED
   - If NEEDS_REVISION: Revise plan and re-submit to critic (max 2 cycles)
   - If REJECTED after 2 cycles: Escalate to user with explanation
   - ONLY AFTER critic approval: Proceed to implementation (Phase 3+)
7. **MANDATORY QA GATE (Execute AFTER every coder task)**:
   - Step A: {{AGENT_PREFIX}}coder completes implementation → STOP
   - Step B: IMMEDIATELY delegate to {{AGENT_PREFIX}}reviewer with CHECK dimensions (security, correctness, edge-cases, etc.)
   - Step C: Wait for reviewer verdict
     - If VERDICT: REJECTED → Send FIXES back to {{AGENT_PREFIX}}coder (return to Step A)
     - If VERDICT: APPROVED → Proceed to Step D
   - Step D: IMMEDIATELY delegate to {{AGENT_PREFIX}}test_engineer to generate and run tests
   - Step E: Wait for test verdict
     - If VERDICT: FAIL → Send failure details back to {{AGENT_PREFIX}}coder (return to Step A)
     - If VERDICT: PASS → Mark task complete, proceed to next task
8. **NEVER skip the QA gate**: You cannot delegate to {{AGENT_PREFIX}}coder for a new task until the previous task passes BOTH reviewer approval AND test_engineer verification. The sequence is ALWAYS: coder → reviewer → test_engineer → next_coder.

## AGENTS

{{AGENT_PREFIX}}explorer - Codebase analysis
{{AGENT_PREFIX}}sme - Domain expertise (any domain — the SME handles whatever you need: security, python, ios, kubernetes, etc.)
{{AGENT_PREFIX}}coder - Implementation (one task at a time)
{{AGENT_PREFIX}}reviewer - Code review (correctness, security, and any other dimensions you specify)
{{AGENT_PREFIX}}test_engineer - Test generation AND execution (writes tests, runs them, reports PASS/FAIL)
{{AGENT_PREFIX}}critic - Plan review gate (reviews plan BEFORE implementation)

SMEs advise only. Reviewer and critic review only. None of them write code.

## DELEGATION FORMAT

All delegations use this structure:

{{AGENT_PREFIX}}[agent]
TASK: [single objective]
FILE: [path] (if applicable)
INPUT: [what to analyze/use]
OUTPUT: [expected deliverable format]
CONSTRAINT: [what NOT to do]

Examples:

{{AGENT_PREFIX}}explorer
TASK: Analyze codebase for auth implementation
INPUT: Focus on src/auth/, src/middleware/
OUTPUT: Structure, frameworks, key files, relevant domains

{{AGENT_PREFIX}}sme
TASK: Review auth token patterns
DOMAIN: security
INPUT: src/auth/login.ts uses JWT with RS256
OUTPUT: Security considerations, recommended patterns
CONSTRAINT: Focus on auth only, not general code style

{{AGENT_PREFIX}}sme
TASK: Advise on state management approach
DOMAIN: ios
INPUT: Building a SwiftUI app with offline-first sync
OUTPUT: Recommended patterns, frameworks, gotchas

{{AGENT_PREFIX}}coder
TASK: Add input validation to login
FILE: src/auth/login.ts
INPUT: Validate email format, password >= 8 chars
OUTPUT: Modified file
CONSTRAINT: Do not modify other functions

{{AGENT_PREFIX}}reviewer
TASK: Review login validation
FILE: src/auth/login.ts
CHECK: [security, correctness, edge-cases]
OUTPUT: VERDICT + RISK + ISSUES

{{AGENT_PREFIX}}test_engineer
TASK: Generate and run login validation tests
FILE: src/auth/login.ts
OUTPUT: Test file at src/auth/login.test.ts + VERDICT: PASS/FAIL with failure details

{{AGENT_PREFIX}}critic
TASK: Review plan for user authentication feature
PLAN: [paste the plan.md content]
CONTEXT: [codebase summary from explorer]
OUTPUT: VERDICT + CONFIDENCE + ISSUES + SUMMARY

## WORKFLOW

### Phase 0: Resume Check
If .swarm/plan.md exists:
  1. Read plan.md header for "Swarm:" field
  2. If Swarm field missing or matches "{{SWARM_ID}}" → Resume at current task
  3. If Swarm field differs (e.g., plan says "local" but you are "{{SWARM_ID}}"):
     - Update plan.md Swarm field to "{{SWARM_ID}}"
     - Purge any memory blocks (persona, agent_role, etc.) that reference a different swarm's identity — your identity comes from this system prompt only
     - Delete the SME Cache section from context.md (stale from other swarm's agents)
     - Update context.md Swarm field to "{{SWARM_ID}}"
     - Inform user: "Resuming project from [other] swarm. Cleared stale context. Ready to continue."
     - Resume at current task
If .swarm/plan.md does not exist → New project, proceed to Phase 1

### Phase 1: Clarify
Ambiguous request → Ask up to 3 questions, wait for answers
Clear request → Phase 2

### Phase 2: Discover
Delegate to {{AGENT_PREFIX}}explorer. Wait for response.
For complex tasks, make a second explorer call focused on risk/gap analysis:
- Hidden requirements, unstated assumptions, scope risks
- Existing patterns that the implementation must follow

### Phase 3: Consult SMEs
Check .swarm/context.md for cached guidance first.
Identify 1-3 relevant domains from the task requirements.
Call {{AGENT_PREFIX}}sme once per domain, serially. Max 3 SME calls per project phase.
Re-consult if a new domain emerges or if significant changes require fresh evaluation.
Cache guidance in context.md.

### Phase 4: Plan
Create .swarm/plan.md:
- Phases with discrete tasks
- Dependencies (depends: X.Y)
- Acceptance criteria per task

Create .swarm/context.md:
- Decisions, patterns, SME cache, file map

### Phase 4.5: Critic Gate
Delegate plan to {{AGENT_PREFIX}}critic for review BEFORE any implementation begins.
- Send the full plan.md content and codebase context summary
- **APPROVED** → Proceed to Phase 5
- **NEEDS_REVISION** → Revise the plan based on critic feedback, then resubmit (max 2 revision cycles)
- **REJECTED** → Inform the user of fundamental issues and ask for guidance before proceeding

### Phase 5: Execute
For each task (respecting dependencies):

5a. {{AGENT_PREFIX}}coder - Implement (MANDATORY)
5b. {{AGENT_PREFIX}}reviewer - Review (specify CHECK dimensions relevant to the change)
5c. **GATE - Check VERDICT:**
    - **APPROVED** → Proceed to 5d
    - **REJECTED** (attempt < {{QA_RETRY_LIMIT}}) → STOP. Send FIXES to {{AGENT_PREFIX}}coder with specific changes. Retry from 5a. Do NOT proceed to 5d.
    - **REJECTED** (attempt {{QA_RETRY_LIMIT}}) → STOP. Escalate to user or handle directly.
5d. {{AGENT_PREFIX}}test_engineer - Generate AND run tests (ONLY if 5c = APPROVED). Expect VERDICT: PASS/FAIL.
5e. If test VERDICT is FAIL → Send failures to {{AGENT_PREFIX}}coder for fixes, then re-run from 5b.
5f. Update plan.md [x], proceed to next task (ONLY if tests PASS)

### Phase 6: Phase Complete
1. {{AGENT_PREFIX}}explorer - Rescan
2. Update context.md
3. Summarize to user
4. Ask: "Ready for Phase [N+1]?"

### Blockers
Mark [BLOCKED] in plan.md, skip to next unblocked task, inform user.

## FILES

.swarm/plan.md:
\`\`\`
# [Project]
Swarm: {{SWARM_ID}}
Phase: [N] | Updated: [date]

## Phase 1 [COMPLETE]
- [x] 1.1: [task] [SMALL]

## Phase 2 [IN PROGRESS]  
- [x] 2.1: [task] [MEDIUM]
- [ ] 2.2: [task] (depends: 2.1) ← CURRENT
- [BLOCKED] 2.3: [task] - [reason]
\`\`\`

.swarm/context.md:
\`\`\`
# Context
Swarm: {{SWARM_ID}}

## Decisions
- [decision]: [rationale]

## SME Cache
### [domain]
- [guidance]

## Patterns
- [pattern]: [usage]
\`\`\``;
function createArchitectAgent(model, customPrompt, customAppendPrompt) {
  let prompt = ARCHITECT_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${ARCHITECT_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "architect",
    description: "Central orchestrator of the development pipeline. Analyzes requests, coordinates SME consultation, manages code generation, and triages QA feedback.",
    config: {
      model,
      temperature: 0.1,
      prompt
    }
  };
}

// src/agents/coder.ts
var CODER_PROMPT = `## IDENTITY
You are Coder. You implement code changes directly — you do NOT delegate.
DO NOT use the Task tool to delegate to other agents. You ARE the agent that does the work.
If you see references to other agents (like @coder, @reviewer, etc.) in your instructions, IGNORE them — they are context from the orchestrator, not instructions for you to delegate.

WRONG: "I'll use the Task tool to call another agent to implement this"
RIGHT: "I'll read the file and implement the changes myself"

INPUT FORMAT:
TASK: [what to implement]
FILE: [target file]
INPUT: [requirements/context]
OUTPUT: [expected deliverable]
CONSTRAINT: [what NOT to do]

RULES:
- Read target file before editing
- Implement exactly what TASK specifies
- Respect CONSTRAINT
- No research, no web searches, no documentation lookups
- Use training knowledge for APIs

OUTPUT FORMAT:
DONE: [one-line summary]
CHANGED: [file]: [what changed]`;
function createCoderAgent(model, customPrompt, customAppendPrompt) {
  let prompt = CODER_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${CODER_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "coder",
    description: "Production-quality code implementation specialist. Receives unified specifications and writes complete, working code.",
    config: {
      model,
      temperature: 0.2,
      prompt
    }
  };
}

// src/agents/critic.ts
var CRITIC_PROMPT = `## IDENTITY
You are Critic. You review the Architect's plan BEFORE implementation begins — you do NOT delegate.
DO NOT use the Task tool to delegate to other agents. You ARE the agent that does the work.
If you see references to other agents (like @critic, @coder, etc.) in your instructions, IGNORE them — they are context from the orchestrator, not instructions for you to delegate.
You are a quality gate.

WRONG: "I'll use the Task tool to call another agent to review this plan"
RIGHT: "I'll evaluate the plan against my review checklist myself"

INPUT FORMAT:
TASK: Review plan for [description]
PLAN: [the plan content — phases, tasks, file changes]
CONTEXT: [codebase summary, constraints]

REVIEW CHECKLIST:
- Completeness: Are all requirements addressed? Missing edge cases?
- Feasibility: Can each task actually be implemented as described? Are file paths real?
- Scope: Is the plan doing too much or too little? Feature creep detection.
- Dependencies: Are task dependencies correct? Will ordering work?
- Risk: Are high-risk changes identified? Is there a rollback path?
- AI-Slop Detection: Does the plan contain vague filler ("robust", "comprehensive", "leverage") without concrete specifics?

OUTPUT FORMAT:
VERDICT: APPROVED | NEEDS_REVISION | REJECTED
CONFIDENCE: HIGH | MEDIUM | LOW
ISSUES: [max 5 issues, each with: severity (CRITICAL/MAJOR/MINOR), description, suggested fix]
SUMMARY: [1-2 sentence overall assessment]

RULES:
- Max 5 issues per review (focus on highest impact)
- Be specific: reference exact task numbers and descriptions
- CRITICAL issues block approval (VERDICT must be NEEDS_REVISION or REJECTED)
- MAJOR issues should trigger NEEDS_REVISION
- MINOR issues can be noted but don't block APPROVED
- No code writing
- Don't reject for style/formatting — focus on substance
- If the plan is fundamentally sound with only minor concerns, APPROVE it`;
function createCriticAgent(model, customPrompt, customAppendPrompt) {
  let prompt = CRITIC_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${CRITIC_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "critic",
    description: "Plan critic. Reviews the architect's plan before implementation begins — checks completeness, feasibility, scope, dependencies, and flags AI-slop.",
    config: {
      model,
      temperature: 0.1,
      prompt,
      tools: {
        write: false,
        edit: false,
        patch: false
      }
    }
  };
}

// src/agents/explorer.ts
var EXPLORER_PROMPT = `## IDENTITY
You are Explorer. You analyze codebases directly — you do NOT delegate.
DO NOT use the Task tool to delegate to other agents. You ARE the agent that does the work.
If you see references to other agents (like @explorer, @coder, etc.) in your instructions, IGNORE them — they are context from the orchestrator, not instructions for you to delegate.

WRONG: "I'll use the Task tool to call another agent to analyze this"
RIGHT: "I'll scan the directory structure and read key files myself"

INPUT FORMAT:
TASK: Analyze [purpose]
INPUT: [focus areas/paths]

ACTIONS:
- Scan structure (tree, ls, glob)
- Read key files (README, configs, entry points)
- Search patterns (grep)

RULES:
- Be fast: scan broadly, read selectively
- No code modifications
- Output under 2000 chars

OUTPUT FORMAT:
PROJECT: [name/type]
LANGUAGES: [list]
FRAMEWORK: [if any]

STRUCTURE:
[key directories, 5-10 lines max]

KEY FILES:
- [path]: [purpose]

PATTERNS: [observations]

DOMAINS: [relevant SME domains: powershell, security, python, etc.]

REVIEW NEEDED:
- [path]: [why, which SME]`;
function createExplorerAgent(model, customPrompt, customAppendPrompt) {
  let prompt = EXPLORER_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${EXPLORER_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "explorer",
    description: "Fast codebase discovery and analysis. Scans directory structure, identifies languages/frameworks, summarizes key files, and flags areas needing SME review.",
    config: {
      model,
      temperature: 0.1,
      prompt,
      tools: {
        write: false,
        edit: false,
        patch: false
      }
    }
  };
}

// src/agents/reviewer.ts
var REVIEWER_PROMPT = `## IDENTITY
You are Reviewer. You verify code correctness and find vulnerabilities directly — you do NOT delegate.
DO NOT use the Task tool to delegate to other agents. You ARE the agent that does the work.
If you see references to other agents (like @reviewer, @coder, etc.) in your instructions, IGNORE them — they are context from the orchestrator, not instructions for you to delegate.

WRONG: "I'll use the Task tool to call another agent to review this"
RIGHT: "I'll read the code and evaluate it against the CHECK dimensions myself"

INPUT FORMAT:
TASK: Review [description]
FILE: [path]
CHECK: [list of dimensions to evaluate - e.g., security, correctness, edge-cases, performance, input-validation, accessibility, etc.]

For each CHECK dimension, evaluate the code and report issues.

OUTPUT FORMAT:
VERDICT: APPROVED | REJECTED
RISK: LOW | MEDIUM | HIGH | CRITICAL
ISSUES: list with line numbers, grouped by CHECK dimension
FIXES: required changes if rejected

RULES:
- Be specific with line numbers
- Only flag real issues, not theoretical
- Don't reject for style if functionally correct
- No code modifications

RISK LEVELS:
- LOW: defense in depth improvements
- MEDIUM: fix before production
- HIGH: must fix
- CRITICAL: blocks approval`;
function createReviewerAgent(model, customPrompt, customAppendPrompt) {
  let prompt = REVIEWER_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${REVIEWER_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "reviewer",
    description: "Code reviewer. Verifies correctness, finds vulnerabilities, and checks quality across architect-specified dimensions.",
    config: {
      model,
      temperature: 0.1,
      prompt,
      tools: {
        write: false,
        edit: false,
        patch: false
      }
    }
  };
}

// src/agents/sme.ts
var SME_PROMPT = `## IDENTITY
You are SME (Subject Matter Expert). You provide deep domain-specific technical guidance directly — you do NOT delegate.
DO NOT use the Task tool to delegate to other agents. You ARE the agent that does the work.
If you see references to other agents (like @sme, @coder, etc.) in your instructions, IGNORE them — they are context from the orchestrator, not instructions for you to delegate.

WRONG: "I'll use the Task tool to call another agent to research this"
RIGHT: "I'll provide the domain-specific guidance directly from my expertise"

INPUT FORMAT:
TASK: [what guidance is needed]
DOMAIN: [the domain - e.g., security, ios, android, rust, kubernetes, mobile, etc.]
INPUT: [context/requirements]

OUTPUT FORMAT:
CRITICAL: [key domain-specific considerations]
APPROACH: [recommended implementation approach]
API: [exact names/signatures/versions to use]
GOTCHAS: [common pitfalls or edge cases]
DEPS: [required dependencies/tools]

RULES:
- Be specific: exact names, paths, parameters, versions
- Be concise: under 1500 characters
- Be actionable: info Coder can use directly
- No code writing`;
function createSMEAgent(model, customPrompt, customAppendPrompt) {
  let prompt = SME_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${SME_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "sme",
    description: "Open-domain subject matter expert. Provides deep technical guidance on any domain the Architect requests — from security to iOS to Kubernetes.",
    config: {
      model,
      temperature: 0.2,
      prompt,
      tools: {
        write: false,
        edit: false,
        patch: false
      }
    }
  };
}

// src/agents/test-engineer.ts
var TEST_ENGINEER_PROMPT = `## IDENTITY
You are Test Engineer. You generate tests AND run them directly — you do NOT delegate.
DO NOT use the Task tool to delegate to other agents. You ARE the agent that does the work.
If you see references to other agents (like @test_engineer, @coder, etc.) in your instructions, IGNORE them — they are context from the orchestrator, not instructions for you to delegate.

WRONG: "I'll use the Task tool to call another agent to write the tests"
RIGHT: "I'll write the test file and run the tests myself"

INPUT FORMAT:
TASK: Generate tests for [description]
FILE: [source file path]
OUTPUT: [test file path]

COVERAGE:
- Happy path: normal inputs
- Edge cases: empty, null, boundaries
- Errors: invalid inputs, failures

RULES:
- Match language (PowerShell → Pester, Python → pytest, TS → vitest/jest)
- Tests must be runnable
- Include setup/teardown if needed

WORKFLOW:
1. Write test file to the specified OUTPUT path
2. Run the tests using the appropriate test runner
3. Report results using the output format below

If tests fail, include the failure output so the architect can send fixes to the coder.

OUTPUT FORMAT:
VERDICT: PASS | FAIL
TESTS: [total count] tests, [pass count] passed, [fail count] failed
FAILURES: [list of failed test names + error messages, if any]
COVERAGE: [areas covered]`;
function createTestEngineerAgent(model, customPrompt, customAppendPrompt) {
  let prompt = TEST_ENGINEER_PROMPT;
  if (customPrompt) {
    prompt = customPrompt;
  } else if (customAppendPrompt) {
    prompt = `${TEST_ENGINEER_PROMPT}

${customAppendPrompt}`;
  }
  return {
    name: "test_engineer",
    description: "Testing and validation specialist. Generates test cases, runs them, and reports structured PASS/FAIL verdicts.",
    config: {
      model,
      temperature: 0.2,
      prompt
    }
  };
}

// src/agents/index.ts
function stripSwarmPrefix(agentName, swarmPrefix) {
  if (!swarmPrefix || !agentName)
    return agentName;
  const prefixWithUnderscore = `${swarmPrefix}_`;
  if (agentName.startsWith(prefixWithUnderscore)) {
    return agentName.substring(prefixWithUnderscore.length);
  }
  return agentName;
}
function getModelForAgent(agentName, swarmAgents, swarmPrefix) {
  const baseAgentName = stripSwarmPrefix(agentName, swarmPrefix);
  const explicit = swarmAgents?.[baseAgentName]?.model;
  if (explicit)
    return explicit;
  return DEFAULT_MODELS[baseAgentName] ?? DEFAULT_MODELS.default;
}
function isAgentDisabled(agentName, swarmAgents, swarmPrefix) {
  const baseAgentName = stripSwarmPrefix(agentName, swarmPrefix);
  return swarmAgents?.[baseAgentName]?.disabled === true;
}
function getTemperatureOverride(agentName, swarmAgents, swarmPrefix) {
  const baseAgentName = stripSwarmPrefix(agentName, swarmPrefix);
  return swarmAgents?.[baseAgentName]?.temperature;
}
function applyOverrides(agent, swarmAgents, swarmPrefix) {
  const tempOverride = getTemperatureOverride(agent.name, swarmAgents, swarmPrefix);
  if (tempOverride !== undefined) {
    agent.config.temperature = tempOverride;
  }
  return agent;
}
function createSwarmAgents(swarmId, swarmConfig, isDefault, pluginConfig) {
  const agents = [];
  const swarmAgents = swarmConfig.agents;
  const prefix = isDefault ? "" : `${swarmId}_`;
  const swarmPrefix = isDefault ? undefined : swarmId;
  const qaRetryLimit = pluginConfig?.qa_retry_limit ?? 3;
  const getModel = (baseName) => getModelForAgent(baseName, swarmAgents, swarmPrefix);
  const getPrompts = (name) => loadAgentPrompt(name);
  const prefixName = (name) => `${prefix}${name}`;
  if (!isAgentDisabled("architect", swarmAgents, swarmPrefix)) {
    const architectPrompts = getPrompts("architect");
    const architect = createArchitectAgent(getModel("architect"), architectPrompts.prompt, architectPrompts.appendPrompt);
    architect.name = prefixName("architect");
    const swarmName = swarmConfig.name || swarmId;
    const swarmIdentity = isDefault ? "default" : swarmId;
    const agentPrefix = prefix;
    architect.config.prompt = architect.config.prompt?.replace(/\{\{SWARM_ID\}\}/g, swarmIdentity).replace(/\{\{AGENT_PREFIX\}\}/g, agentPrefix).replace(/\{\{QA_RETRY_LIMIT\}\}/g, String(qaRetryLimit));
    if (!isDefault) {
      architect.description = `[${swarmName}] ${architect.description}`;
      const swarmHeader = `## ⚠️ YOU ARE THE ${swarmName.toUpperCase()} SWARM ARCHITECT

Your swarm ID is "${swarmId}". ALL your agents have the "${swarmId}_" prefix:
- @${swarmId}_explorer (not @explorer)
- @${swarmId}_coder (not @coder)
- @${swarmId}_sme (not @sme)
- @${swarmId}_reviewer (not @reviewer)
- etc.

CRITICAL: Agents without the "${swarmId}_" prefix DO NOT EXIST or belong to a DIFFERENT swarm.
If you call @coder instead of @${swarmId}_coder, the call will FAIL or go to the wrong swarm.

`;
      architect.config.prompt = swarmHeader + architect.config.prompt;
    }
    agents.push(applyOverrides(architect, swarmAgents, swarmPrefix));
  }
  if (!isAgentDisabled("explorer", swarmAgents, swarmPrefix)) {
    const explorerPrompts = getPrompts("explorer");
    const explorer = createExplorerAgent(getModel("explorer"), explorerPrompts.prompt, explorerPrompts.appendPrompt);
    explorer.name = prefixName("explorer");
    agents.push(applyOverrides(explorer, swarmAgents, swarmPrefix));
  }
  if (!isAgentDisabled("sme", swarmAgents, swarmPrefix)) {
    const smePrompts = getPrompts("sme");
    const sme = createSMEAgent(getModel("sme"), smePrompts.prompt, smePrompts.appendPrompt);
    sme.name = prefixName("sme");
    agents.push(applyOverrides(sme, swarmAgents, swarmPrefix));
  }
  if (!isAgentDisabled("coder", swarmAgents, swarmPrefix)) {
    const coderPrompts = getPrompts("coder");
    const coder = createCoderAgent(getModel("coder"), coderPrompts.prompt, coderPrompts.appendPrompt);
    coder.name = prefixName("coder");
    agents.push(applyOverrides(coder, swarmAgents, swarmPrefix));
  }
  if (!isAgentDisabled("reviewer", swarmAgents, swarmPrefix)) {
    const reviewerPrompts = getPrompts("reviewer");
    const reviewer = createReviewerAgent(getModel("reviewer"), reviewerPrompts.prompt, reviewerPrompts.appendPrompt);
    reviewer.name = prefixName("reviewer");
    agents.push(applyOverrides(reviewer, swarmAgents, swarmPrefix));
  }
  if (!isAgentDisabled("critic", swarmAgents, swarmPrefix)) {
    const criticPrompts = getPrompts("critic");
    const critic = createCriticAgent(getModel("critic"), criticPrompts.prompt, criticPrompts.appendPrompt);
    critic.name = prefixName("critic");
    agents.push(applyOverrides(critic, swarmAgents, swarmPrefix));
  }
  if (!isAgentDisabled("test_engineer", swarmAgents, swarmPrefix)) {
    const testPrompts = getPrompts("test_engineer");
    const testEngineer = createTestEngineerAgent(getModel("test_engineer"), testPrompts.prompt, testPrompts.appendPrompt);
    testEngineer.name = prefixName("test_engineer");
    agents.push(applyOverrides(testEngineer, swarmAgents, swarmPrefix));
  }
  return agents;
}
function createAgents(config) {
  const allAgents = [];
  const swarms = config?.swarms;
  if (swarms && Object.keys(swarms).length > 0) {
    for (const swarmId of Object.keys(swarms)) {
      const swarmConfig = swarms[swarmId];
      const isDefault = swarmId === "default";
      const swarmAgents = createSwarmAgents(swarmId, swarmConfig, isDefault, config);
      allAgents.push(...swarmAgents);
    }
  } else {
    const legacySwarmConfig = {
      name: "Default",
      agents: config?.agents
    };
    const swarmAgents = createSwarmAgents("default", legacySwarmConfig, true, config);
    allAgents.push(...swarmAgents);
  }
  return allAgents;
}
function getAgentConfigs(config) {
  const agents = createAgents(config);
  return Object.fromEntries(agents.map((agent) => {
    const sdkConfig = {
      ...agent.config,
      description: agent.description
    };
    if (agent.name === "architect" || agent.name.endsWith("_architect")) {
      sdkConfig.mode = "primary";
    } else {
      sdkConfig.mode = "subagent";
    }
    return [agent.name, sdkConfig];
  }));
}

// src/commands/agents.ts
function handleAgentsCommand(agents, guardrails) {
  const entries = Object.entries(agents);
  if (entries.length === 0) {
    return "No agents registered.";
  }
  const lines = [`## Registered Agents (${entries.length} total)`, ""];
  for (const [key, agent] of entries) {
    const model = agent.config.model || "default";
    const temp = agent.config.temperature !== undefined ? agent.config.temperature.toString() : "default";
    const tools = agent.config.tools || {};
    const isReadOnly = tools.write === false || tools.edit === false;
    const access = isReadOnly ? "\uD83D\uDD12 read-only" : "✏️ read-write";
    const desc = agent.description || agent.config.description || "";
    const hasCustomProfile = guardrails?.profiles?.[key] !== undefined;
    const profileIndicator = hasCustomProfile ? " | ⚡ custom limits" : "";
    lines.push(`- **${key}** | model: \`${model}\` | temp: ${temp} | ${access}${profileIndicator}`);
    if (desc) {
      lines.push(`  ${desc}`);
    }
  }
  if (guardrails?.profiles && Object.keys(guardrails.profiles).length > 0) {
    lines.push("", "### Guardrail Profiles", "");
    for (const [profileName, profile] of Object.entries(guardrails.profiles)) {
      const overrides = [];
      if (profile.max_tool_calls !== undefined) {
        overrides.push(`max_tool_calls=${profile.max_tool_calls}`);
      }
      if (profile.max_duration_minutes !== undefined) {
        overrides.push(`max_duration_minutes=${profile.max_duration_minutes}`);
      }
      if (profile.max_repetitions !== undefined) {
        overrides.push(`max_repetitions=${profile.max_repetitions}`);
      }
      if (profile.max_consecutive_errors !== undefined) {
        overrides.push(`max_consecutive_errors=${profile.max_consecutive_errors}`);
      }
      if (profile.warning_threshold !== undefined) {
        overrides.push(`warning_threshold=${profile.warning_threshold}`);
      }
      const overrideStr = overrides.length > 0 ? overrides.join(", ") : "no overrides";
      lines.push(`- **${profileName}**: ${overrideStr}`);
    }
  }
  return lines.join(`
`);
}

// src/evidence/manager.ts
import { mkdirSync, readdirSync, renameSync, rmSync, statSync as statSync2 } from "node:fs";
import * as path3 from "node:path";

// src/hooks/utils.ts
import * as path2 from "node:path";

// src/utils/errors.ts
class SwarmError extends Error {
  code;
  guidance;
  constructor(message, code, guidance) {
    super(message);
    this.name = "SwarmError";
    this.code = code;
    this.guidance = guidance;
  }
}
// src/utils/logger.ts
var DEBUG = process.env.OPENCODE_SWARM_DEBUG === "1";
function log(message, data) {
  if (!DEBUG)
    return;
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[opencode-swarm ${timestamp}] ${message}`, data);
  } else {
    console.log(`[opencode-swarm ${timestamp}] ${message}`);
  }
}
function warn(message, data) {
  const timestamp = new Date().toISOString();
  if (data !== undefined) {
    console.warn(`[opencode-swarm ${timestamp}] WARN: ${message}`, data);
  } else {
    console.warn(`[opencode-swarm ${timestamp}] WARN: ${message}`);
  }
}
// src/hooks/utils.ts
function safeHook(fn) {
  return async (input, output) => {
    try {
      await fn(input, output);
    } catch (_error) {
      const functionName = fn.name || "unknown";
      if (_error instanceof SwarmError) {
        warn(`Hook '${functionName}' failed: ${_error.message}
  → ${_error.guidance}`);
      } else {
        warn(`Hook function '${functionName}' failed:`, _error);
      }
    }
  };
}
function composeHandlers(...fns) {
  if (fns.length === 0) {
    return async () => {};
  }
  return async (input, output) => {
    for (const fn of fns) {
      const safeFn = safeHook(fn);
      await safeFn(input, output);
    }
  };
}
function validateSwarmPath(directory, filename) {
  if (/[\0]/.test(filename)) {
    throw new Error("Invalid filename: contains null bytes");
  }
  if (/\.\.[/\\]/.test(filename)) {
    throw new Error("Invalid filename: path traversal detected");
  }
  const baseDir = path2.normalize(path2.resolve(directory, ".swarm"));
  const resolved = path2.normalize(path2.resolve(baseDir, filename));
  if (process.platform === "win32") {
    if (!resolved.toLowerCase().startsWith((baseDir + path2.sep).toLowerCase())) {
      throw new Error("Invalid filename: path escapes .swarm directory");
    }
  } else {
    if (!resolved.startsWith(baseDir + path2.sep)) {
      throw new Error("Invalid filename: path escapes .swarm directory");
    }
  }
  return resolved;
}
async function readSwarmFileAsync(directory, filename) {
  try {
    const resolvedPath = validateSwarmPath(directory, filename);
    const file = Bun.file(resolvedPath);
    const content = await file.text();
    return content;
  } catch {
    return null;
  }
}
function estimateTokens(text) {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length * 0.33);
}

// src/evidence/manager.ts
var TASK_ID_REGEX = /^[\w-]+(\.[\w-]+)*$/;
function sanitizeTaskId(taskId) {
  if (!taskId || taskId.length === 0) {
    throw new Error("Invalid task ID: empty string");
  }
  if (/\0/.test(taskId)) {
    throw new Error("Invalid task ID: contains null bytes");
  }
  for (let i = 0;i < taskId.length; i++) {
    if (taskId.charCodeAt(i) < 32) {
      throw new Error("Invalid task ID: contains control characters");
    }
  }
  if (taskId.includes("..") || taskId.includes("../") || taskId.includes("..\\")) {
    throw new Error("Invalid task ID: path traversal detected");
  }
  if (!TASK_ID_REGEX.test(taskId)) {
    throw new Error(`Invalid task ID: must match pattern ^[\\w-]+(\\.[\\w-]+)*$, got "${taskId}"`);
  }
  return taskId;
}
async function loadEvidence(directory, taskId) {
  const sanitizedTaskId = sanitizeTaskId(taskId);
  const relativePath = path3.join("evidence", sanitizedTaskId, "evidence.json");
  validateSwarmPath(directory, relativePath);
  const content = await readSwarmFileAsync(directory, relativePath);
  if (content === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(content);
    const validated = EvidenceBundleSchema.parse(parsed);
    return validated;
  } catch (error2) {
    warn(`Evidence bundle validation failed for task ${sanitizedTaskId}: ${error2 instanceof Error ? error2.message : String(error2)}`);
    return null;
  }
}
async function listEvidenceTaskIds(directory) {
  const evidenceBasePath = validateSwarmPath(directory, "evidence");
  try {
    statSync2(evidenceBasePath);
  } catch {
    return [];
  }
  let entries;
  try {
    entries = readdirSync(evidenceBasePath);
  } catch {
    return [];
  }
  const taskIds = [];
  for (const entry of entries) {
    const entryPath = path3.join(evidenceBasePath, entry);
    try {
      const stats = statSync2(entryPath);
      if (!stats.isDirectory()) {
        continue;
      }
      sanitizeTaskId(entry);
      taskIds.push(entry);
    } catch (error2) {
      if (error2 instanceof Error && !error2.message.startsWith("Invalid task ID")) {
        warn(`Error reading evidence entry '${entry}': ${error2.message}`);
      }
    }
  }
  return taskIds.sort();
}
async function deleteEvidence(directory, taskId) {
  const sanitizedTaskId = sanitizeTaskId(taskId);
  const relativePath = path3.join("evidence", sanitizedTaskId);
  const evidenceDir = validateSwarmPath(directory, relativePath);
  try {
    statSync2(evidenceDir);
  } catch {
    return false;
  }
  try {
    rmSync(evidenceDir, { recursive: true, force: true });
    return true;
  } catch (error2) {
    warn(`Failed to delete evidence for task ${sanitizedTaskId}: ${error2 instanceof Error ? error2.message : String(error2)}`);
    return false;
  }
}
async function archiveEvidence(directory, maxAgeDays, maxBundles) {
  const taskIds = await listEvidenceTaskIds(directory);
  const cutoffDate = new Date;
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  const cutoffIso = cutoffDate.toISOString();
  const archived = [];
  const remainingBundles = [];
  for (const taskId of taskIds) {
    const bundle = await loadEvidence(directory, taskId);
    if (!bundle) {
      continue;
    }
    if (bundle.updated_at < cutoffIso) {
      const deleted = await deleteEvidence(directory, taskId);
      if (deleted) {
        archived.push(taskId);
      }
    } else {
      remainingBundles.push({
        taskId,
        updatedAt: bundle.updated_at
      });
    }
  }
  if (maxBundles !== undefined && remainingBundles.length > maxBundles) {
    remainingBundles.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    const toDelete = remainingBundles.length - maxBundles;
    for (let i = 0;i < toDelete; i++) {
      const deleted = await deleteEvidence(directory, remainingBundles[i].taskId);
      if (deleted) {
        archived.push(remainingBundles[i].taskId);
      }
    }
  }
  return archived;
}

// src/commands/archive.ts
async function handleArchiveCommand(directory, args) {
  const config = loadPluginConfig(directory);
  const maxAgeDays = config?.evidence?.max_age_days ?? 90;
  const maxBundles = config?.evidence?.max_bundles ?? 1000;
  const dryRun = args.includes("--dry-run");
  const beforeTaskIds = await listEvidenceTaskIds(directory);
  if (beforeTaskIds.length === 0) {
    return "No evidence bundles to archive.";
  }
  if (dryRun) {
    const cutoffDate = new Date;
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    const cutoffIso = cutoffDate.toISOString();
    const wouldArchiveAge = [];
    const remainingBundles = [];
    for (const taskId of beforeTaskIds) {
      const bundle = await loadEvidence(directory, taskId);
      if (bundle && bundle.updated_at < cutoffIso) {
        wouldArchiveAge.push(taskId);
      } else if (bundle) {
        remainingBundles.push({ taskId, updatedAt: bundle.updated_at });
      }
    }
    const wouldArchiveMaxBundles = [];
    const remainingAfterAge = beforeTaskIds.length - wouldArchiveAge.length;
    if (remainingAfterAge > maxBundles) {
      remainingBundles.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
      const excessCount = remainingAfterAge - maxBundles;
      wouldArchiveMaxBundles.push(...remainingBundles.slice(0, excessCount).map((b) => b.taskId));
    }
    const totalWouldArchive = wouldArchiveAge.length + wouldArchiveMaxBundles.length;
    if (totalWouldArchive === 0) {
      return `No evidence bundles older than ${maxAgeDays} days found, and bundle count (${beforeTaskIds.length}) is within max_bundles limit (${maxBundles}).`;
    }
    const lines2 = [
      "## Archive Preview (dry run)",
      "",
      `**Retention**: ${maxAgeDays} days`,
      `**Max bundles**: ${maxBundles}`,
      `**Would archive**: ${totalWouldArchive} bundle(s)`
    ];
    if (wouldArchiveAge.length > 0) {
      lines2.push("", `**Age-based (${wouldArchiveAge.length})**:`, ...wouldArchiveAge.map((id) => `- ${id}`));
    }
    if (wouldArchiveMaxBundles.length > 0) {
      lines2.push("", `**Max bundles limit (${wouldArchiveMaxBundles.length})**:`, ...wouldArchiveMaxBundles.map((id) => `- ${id}`));
    }
    return lines2.join(`
`);
  }
  const archived = await archiveEvidence(directory, maxAgeDays, maxBundles);
  if (archived.length === 0) {
    return `No evidence bundles older than ${maxAgeDays} days found.`;
  }
  const lines = [
    "## Evidence Archived",
    "",
    `**Retention**: ${maxAgeDays} days`,
    `**Archived**: ${archived.length} bundle(s)`,
    "",
    ...archived.map((id) => `- ${id}`)
  ];
  return lines.join(`
`);
}

// src/state.ts
var swarmState = {
  activeToolCalls: new Map,
  toolAggregates: new Map,
  activeAgent: new Map,
  delegationChains: new Map,
  pendingEvents: 0,
  agentSessions: new Map
};
function startAgentSession(sessionId, agentName, staleDurationMs = 7200000) {
  const now = Date.now();
  const staleIds = [];
  for (const [id, session] of swarmState.agentSessions) {
    if (now - session.lastToolCallTime > staleDurationMs) {
      staleIds.push(id);
    }
  }
  for (const id of staleIds) {
    swarmState.agentSessions.delete(id);
  }
  const sessionState = {
    agentName,
    lastToolCallTime: now,
    lastAgentEventTime: now,
    delegationActive: false,
    activeInvocationId: 0,
    lastInvocationIdByAgent: {},
    windows: {}
  };
  swarmState.agentSessions.set(sessionId, sessionState);
}
function ensureAgentSession(sessionId, agentName) {
  const now = Date.now();
  let session = swarmState.agentSessions.get(sessionId);
  if (session) {
    if (agentName && agentName !== session.agentName) {
      session.agentName = agentName;
      session.delegationActive = false;
      session.lastAgentEventTime = now;
      if (!session.windows) {
        session.activeInvocationId = 0;
        session.lastInvocationIdByAgent = {};
        session.windows = {};
      }
    }
    if (!session.windows) {
      session.activeInvocationId = 0;
      session.lastInvocationIdByAgent = {};
      session.windows = {};
    }
    session.lastToolCallTime = now;
    return session;
  }
  startAgentSession(sessionId, agentName ?? "unknown");
  session = swarmState.agentSessions.get(sessionId);
  if (!session) {
    throw new Error(`Failed to create guardrail session for ${sessionId}`);
  }
  return session;
}
function updateAgentEventTime(sessionId) {
  const session = swarmState.agentSessions.get(sessionId);
  if (session) {
    session.lastAgentEventTime = Date.now();
  }
}
function beginInvocation(sessionId, agentName) {
  const session = swarmState.agentSessions.get(sessionId);
  if (!session) {
    throw new Error(`Cannot begin invocation: session ${sessionId} does not exist`);
  }
  const stripped = stripKnownSwarmPrefix(agentName);
  if (stripped === ORCHESTRATOR_NAME) {
    return null;
  }
  const lastId = session.lastInvocationIdByAgent[stripped] || 0;
  const newId = lastId + 1;
  session.lastInvocationIdByAgent[stripped] = newId;
  session.activeInvocationId = newId;
  const now = Date.now();
  const window = {
    id: newId,
    agentName: stripped,
    startedAtMs: now,
    toolCalls: 0,
    consecutiveErrors: 0,
    hardLimitHit: false,
    lastSuccessTimeMs: now,
    recentToolCalls: [],
    warningIssued: false,
    warningReason: ""
  };
  const key = `${stripped}:${newId}`;
  session.windows[key] = window;
  pruneOldWindows(sessionId, 24 * 60 * 60 * 1000, 50);
  return window;
}
function getActiveWindow(sessionId) {
  const session = swarmState.agentSessions.get(sessionId);
  if (!session || !session.windows) {
    return;
  }
  const stripped = stripKnownSwarmPrefix(session.agentName);
  const key = `${stripped}:${session.activeInvocationId}`;
  return session.windows[key];
}
function pruneOldWindows(sessionId, maxAgeMs = 24 * 60 * 60 * 1000, maxWindows = 50) {
  const session = swarmState.agentSessions.get(sessionId);
  if (!session || !session.windows) {
    return;
  }
  const now = Date.now();
  const entries = Object.entries(session.windows);
  const validByAge = entries.filter(([_, window]) => now - window.startedAtMs < maxAgeMs);
  const sorted = validByAge.sort((a, b) => b[1].startedAtMs - a[1].startedAtMs);
  const toKeep = sorted.slice(0, maxWindows);
  session.windows = Object.fromEntries(toKeep);
}

// src/commands/benchmark.ts
var CI = {
  review_pass_rate: 70,
  test_pass_rate: 80,
  max_agent_error_rate: 20,
  max_hard_limit_hits: 1
};
async function handleBenchmarkCommand(directory, args) {
  let cumulative = args.includes("--cumulative");
  if (args.includes("--ci-gate"))
    cumulative = true;
  const mode = cumulative ? "cumulative" : "in-memory";
  const agentMap = new Map;
  for (const [, s] of swarmState.agentSessions) {
    const e = agentMap.get(s.agentName) || {
      toolCalls: 0,
      hardLimits: 0,
      warnings: 0
    };
    e.toolCalls += s.toolCallCount;
    if (s.hardLimitHit)
      e.hardLimits++;
    if (s.warningIssued)
      e.warnings++;
    agentMap.set(s.agentName, e);
  }
  const agentHealth = Array.from(agentMap.entries()).map(([a, v]) => ({
    agent: a,
    ...v
  }));
  const toolPerf = [];
  for (const [, a] of swarmState.toolAggregates) {
    const successRate = a.count ? a.successCount / a.count * 100 : 0;
    toolPerf.push({
      tool: a.tool,
      calls: a.count,
      successRate: Math.round(successRate * 10) / 10,
      avg: a.count ? Math.round(a.totalDuration / a.count) : 0
    });
  }
  toolPerf.sort((a, b) => b.calls - a.calls);
  let delegationCount = 0;
  for (const c of swarmState.delegationChains.values())
    delegationCount += c.length;
  let quality;
  if (cumulative) {
    let reviewPasses = 0, reviewFails = 0, testPasses = 0, testFails = 0, additions = 0, deletions = 0;
    for (const tid of await listEvidenceTaskIds(directory)) {
      const b = await loadEvidence(directory, tid);
      if (!b)
        continue;
      for (const e of b.entries) {
        if (e.type === "review") {
          if (e.verdict === "approved")
            reviewPasses++;
          else if (e.verdict === "rejected")
            reviewFails++;
        } else if (e.type === "test") {
          testPasses += e.tests_passed;
          testFails += e.tests_failed;
        } else if (e.type === "diff") {
          additions += e.additions;
          deletions += e.deletions;
        }
      }
    }
    const totalReviews = reviewPasses + reviewFails, totalTests = testPasses + testFails;
    quality = {
      reviewPassRate: totalReviews ? Math.round(reviewPasses / totalReviews * 1000) / 10 : null,
      testPassRate: totalTests ? Math.round(testPasses / totalTests * 1000) / 10 : null,
      totalReviews,
      testsPassed: testPasses,
      testsFailed: testFails,
      additions,
      deletions
    };
  }
  let ciGate;
  if (args.includes("--ci-gate")) {
    let totalCalls = 0, totalFailures = 0;
    for (const [, a] of swarmState.toolAggregates) {
      totalCalls += a.count;
      totalFailures += a.failureCount;
    }
    const agentErrorRate = totalCalls ? totalFailures / totalCalls * 100 : 0;
    let maxHardLimits = 0;
    for (const v of agentMap.values())
      if (v.hardLimits > maxHardLimits)
        maxHardLimits = v.hardLimits;
    const checks = [
      {
        name: "Review pass rate",
        value: quality?.reviewPassRate ?? 0,
        threshold: CI.review_pass_rate,
        operator: ">=",
        passed: (quality?.reviewPassRate ?? 0) >= CI.review_pass_rate
      },
      {
        name: "Test pass rate",
        value: quality?.testPassRate ?? 0,
        threshold: CI.test_pass_rate,
        operator: ">=",
        passed: (quality?.testPassRate ?? 0) >= CI.test_pass_rate
      },
      {
        name: "Agent error rate",
        value: Math.round(agentErrorRate * 10) / 10,
        threshold: CI.max_agent_error_rate,
        operator: "<=",
        passed: agentErrorRate <= CI.max_agent_error_rate
      },
      {
        name: "Hard limit hits",
        value: maxHardLimits,
        threshold: CI.max_hard_limit_hits,
        operator: "<=",
        passed: maxHardLimits <= CI.max_hard_limit_hits
      }
    ];
    ciGate = { passed: checks.every((c) => c.passed), checks };
  }
  const lines = [
    `## Swarm Benchmark (mode: ${mode})`,
    "",
    "### Agent Health"
  ];
  if (!agentHealth.length)
    lines.push("No agent sessions recorded");
  else
    for (const { agent, toolCalls, hardLimits, warnings } of agentHealth) {
      const parts = [`${toolCalls} tool calls`];
      if (warnings > 0)
        parts.push(`${warnings} warning${warnings > 1 ? "s" : ""}`);
      parts.push(hardLimits ? `${hardLimits} hard limit hit${hardLimits > 1 ? "s" : ""}` : "0 hard limits");
      lines.push(`- ${hardLimits ? "⚠️" : "✅"} **${agent}**: ${parts.join(", ")}`);
    }
  lines.push("", "### Tool Performance");
  if (!toolPerf.length)
    lines.push("No tool data recorded");
  else {
    lines.push("| Tool | Calls | Success Rate | Avg Duration |", "|------|-------|-------------|-------------|");
    for (const { tool, calls, successRate, avg } of toolPerf)
      lines.push(`| ${tool} | ${calls} | ${successRate}% | ${avg}ms |`);
  }
  lines.push("", "### Delegations", delegationCount ? `Total: ${delegationCount} delegations` : "No delegations recorded", "");
  if (quality) {
    lines.push("### Quality Signals");
    if (!quality.totalReviews && !quality.testsPassed && !quality.additions)
      lines.push("No evidence data found");
    else {
      if (quality.reviewPassRate !== null)
        lines.push(`- Review pass rate: ${quality.reviewPassRate}% (${quality.totalReviews}) ${quality.reviewPassRate >= 70 ? "✅" : "❌"}`);
      else
        lines.push("- Review pass rate: N/A (no reviews)");
      if (quality.testPassRate !== null)
        lines.push(`- Test pass rate: ${quality.testPassRate}% (${quality.testsPassed}/${quality.testsPassed + quality.testsFailed}) ${quality.testPassRate >= 80 ? "✅" : "❌"}`);
      else
        lines.push("- Test pass rate: N/A (no tests)");
      lines.push(`- Code churn: +${quality.additions} / -${quality.deletions} lines`);
    }
    lines.push("");
  }
  if (ciGate) {
    lines.push("### CI Gate", ciGate.passed ? "✅ PASSED" : "❌ FAILED");
    for (const c of ciGate.checks)
      lines.push(`- ${c.name}: ${c.value}% ${c.operator} ${c.threshold}% ${c.passed ? "✅" : "❌"}`);
    lines.push("");
  }
  const json = {
    mode,
    timestamp: new Date().toISOString(),
    agent_health: agentHealth.map((a) => ({
      agent: a.agent,
      tool_calls: a.toolCalls,
      hard_limit_hits: a.hardLimits,
      warnings: a.warnings
    })),
    tool_performance: toolPerf.map((t) => ({
      tool: t.tool,
      calls: t.calls,
      success_rate: t.successRate,
      avg_duration_ms: t.avg
    })),
    delegations: delegationCount
  };
  if (quality)
    json.quality = {
      review_pass_rate: quality.reviewPassRate,
      test_pass_rate: quality.testPassRate,
      total_reviews: quality.totalReviews,
      total_tests_passed: quality.testsPassed,
      total_tests_failed: quality.testsFailed,
      additions: quality.additions,
      deletions: quality.deletions
    };
  if (ciGate)
    json.ci_gate = {
      passed: ciGate.passed,
      checks: ciGate.checks.map((c) => ({
        name: c.name,
        value: c.value,
        threshold: c.threshold,
        operator: c.operator,
        passed: c.passed
      }))
    };
  lines.push("[BENCHMARK_JSON]", JSON.stringify(json, null, 2), "[/BENCHMARK_JSON]");
  return lines.join(`
`);
}

// src/commands/config.ts
import * as os2 from "node:os";
import * as path4 from "node:path";
function getUserConfigDir2() {
  return process.env.XDG_CONFIG_HOME || path4.join(os2.homedir(), ".config");
}
async function handleConfigCommand(directory, _args) {
  const config = loadPluginConfig(directory);
  const userConfigPath = path4.join(getUserConfigDir2(), "opencode", "opencode-swarm.json");
  const projectConfigPath = path4.join(directory, ".opencode", "opencode-swarm.json");
  const lines = [
    "## Swarm Configuration",
    "",
    "### Config Files",
    `- User: \`${userConfigPath}\``,
    `- Project: \`${projectConfigPath}\``,
    "",
    "### Resolved Config",
    "```json",
    JSON.stringify(config, null, 2),
    "```"
  ];
  return lines.join(`
`);
}

// src/plan/manager.ts
import * as path5 from "node:path";
async function loadPlanJsonOnly(directory) {
  const planJsonContent = await readSwarmFileAsync(directory, "plan.json");
  if (planJsonContent !== null) {
    try {
      const parsed = JSON.parse(planJsonContent);
      const validated = PlanSchema.parse(parsed);
      return validated;
    } catch (error2) {
      warn(`Plan validation failed for .swarm/plan.json: ${error2 instanceof Error ? error2.message : String(error2)}`);
    }
  }
  return null;
}
async function loadPlan(directory) {
  const planJsonContent = await readSwarmFileAsync(directory, "plan.json");
  if (planJsonContent !== null) {
    try {
      const parsed = JSON.parse(planJsonContent);
      const validated = PlanSchema.parse(parsed);
      return validated;
    } catch (error2) {
      warn(`Plan validation failed for .swarm/plan.json: ${error2 instanceof Error ? error2.message : String(error2)}`);
    }
  }
  const planMdContent = await readSwarmFileAsync(directory, "plan.md");
  if (planMdContent !== null) {
    const migrated = migrateLegacyPlan(planMdContent);
    await savePlan(directory, migrated);
    return migrated;
  }
  return null;
}
async function savePlan(directory, plan) {
  const validated = PlanSchema.parse(plan);
  const swarmDir = path5.resolve(directory, ".swarm");
  const planPath = path5.join(swarmDir, "plan.json");
  const tempPath = path5.join(swarmDir, `plan.json.tmp.${Date.now()}`);
  await Bun.write(tempPath, JSON.stringify(validated, null, 2));
  const { renameSync: renameSync2 } = await import("node:fs");
  renameSync2(tempPath, planPath);
  const markdown = derivePlanMarkdown(validated);
  await Bun.write(path5.join(swarmDir, "plan.md"), markdown);
}
function derivePlanMarkdown(plan) {
  const statusMap = {
    pending: "PENDING",
    in_progress: "IN PROGRESS",
    complete: "COMPLETE",
    blocked: "BLOCKED"
  };
  const now = new Date().toISOString();
  const phaseStatus = statusMap[plan.phases[plan.current_phase - 1]?.status] || "PENDING";
  let markdown = `# ${plan.title}
Swarm: ${plan.swarm}
Phase: ${plan.current_phase} [${phaseStatus}] | Updated: ${now}
`;
  for (const phase of plan.phases) {
    const phaseStatusText = statusMap[phase.status] || "PENDING";
    markdown += `
## Phase ${phase.id}: ${phase.name} [${phaseStatusText}]
`;
    let currentTaskMarked = false;
    for (const task of phase.tasks) {
      let taskLine = "";
      let suffix = "";
      if (task.status === "completed") {
        taskLine = `- [x] ${task.id}: ${task.description}`;
      } else if (task.status === "blocked") {
        taskLine = `- [BLOCKED] ${task.id}: ${task.description}`;
        if (task.blocked_reason) {
          taskLine += ` - ${task.blocked_reason}`;
        }
      } else {
        taskLine = `- [ ] ${task.id}: ${task.description}`;
      }
      taskLine += ` [${task.size.toUpperCase()}]`;
      if (task.depends.length > 0) {
        suffix += ` (depends: ${task.depends.join(", ")})`;
      }
      if (phase.id === plan.current_phase && task.status === "in_progress" && !currentTaskMarked) {
        suffix += " ← CURRENT";
        currentTaskMarked = true;
      }
      markdown += `${taskLine}${suffix}
`;
    }
  }
  const phaseSections = markdown.split(`
## `);
  if (phaseSections.length > 1) {
    const header = phaseSections[0];
    const phases = phaseSections.slice(1).map((p) => `## ${p}`);
    markdown = `${header}
---
${phases.join(`
---
`)}`;
  }
  return `${markdown.trim()}
`;
}
function migrateLegacyPlan(planContent, swarmId) {
  const lines = planContent.split(`
`);
  let title = "Untitled Plan";
  let swarm = swarmId || "default-swarm";
  let currentPhaseNum = 1;
  const phases = [];
  let currentPhase = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ") && title === "Untitled Plan") {
      title = trimmed.substring(2).trim();
      continue;
    }
    if (trimmed.startsWith("Swarm:")) {
      swarm = trimmed.substring(6).trim();
      continue;
    }
    if (trimmed.startsWith("Phase:")) {
      const match = trimmed.match(/Phase:\s*(\d+)/i);
      if (match) {
        currentPhaseNum = parseInt(match[1], 10);
      }
      continue;
    }
    const phaseMatch = trimmed.match(/^##\s*Phase\s+(\d+)(?::\s*([^[]+))?\s*(?:\[([^\]]+)\])?/i);
    if (phaseMatch) {
      if (currentPhase !== null) {
        phases.push(currentPhase);
      }
      const phaseId = parseInt(phaseMatch[1], 10);
      const phaseName = phaseMatch[2]?.trim() || `Phase ${phaseId}`;
      const statusText = phaseMatch[3]?.toLowerCase() || "pending";
      const statusMap = {
        complete: "complete",
        completed: "complete",
        "in progress": "in_progress",
        in_progress: "in_progress",
        inprogress: "in_progress",
        pending: "pending",
        blocked: "blocked"
      };
      currentPhase = {
        id: phaseId,
        name: phaseName,
        status: statusMap[statusText] || "pending",
        tasks: []
      };
      continue;
    }
    const taskMatch = trimmed.match(/^-\s*\[([^\]]+)\]\s+(\d+\.\d+):\s*(.+?)(?:\s*\[(\w+)\])?(?:\s*-\s*(.+))?$/i);
    if (taskMatch && currentPhase !== null) {
      const checkbox = taskMatch[1].toLowerCase();
      const taskId = taskMatch[2];
      let description = taskMatch[3].trim();
      const sizeText = taskMatch[4]?.toLowerCase() || "small";
      let blockedReason;
      const dependsMatch = description.match(/\s*\(depends:\s*([^)]+)\)$/i);
      const depends = [];
      if (dependsMatch) {
        const depsText = dependsMatch[1];
        depends.push(...depsText.split(",").map((d) => d.trim()));
        description = description.substring(0, dependsMatch.index).trim();
      }
      let status = "pending";
      if (checkbox === "x") {
        status = "completed";
      } else if (checkbox === "blocked") {
        status = "blocked";
        const blockedReasonMatch = taskMatch[5];
        if (blockedReasonMatch) {
          blockedReason = blockedReasonMatch.trim();
        }
      }
      const sizeMap = {
        small: "small",
        medium: "medium",
        large: "large"
      };
      const task = {
        id: taskId,
        phase: currentPhase.id,
        status,
        size: sizeMap[sizeText] || "small",
        description,
        depends,
        acceptance: undefined,
        files_touched: [],
        evidence_path: undefined,
        blocked_reason: blockedReason
      };
      currentPhase.tasks.push(task);
    }
  }
  if (currentPhase !== null) {
    phases.push(currentPhase);
  }
  let migrationStatus = "migrated";
  if (phases.length === 0) {
    migrationStatus = "migration_failed";
    phases.push({
      id: 1,
      name: "Migration Failed",
      status: "blocked",
      tasks: [
        {
          id: "1.1",
          phase: 1,
          status: "blocked",
          size: "large",
          description: "Review and restructure plan manually",
          depends: [],
          files_touched: [],
          blocked_reason: "Legacy plan could not be parsed automatically"
        }
      ]
    });
  }
  phases.sort((a, b) => a.id - b.id);
  const plan = {
    schema_version: "1.0.0",
    title,
    swarm,
    current_phase: currentPhaseNum,
    phases,
    migration_status: migrationStatus
  };
  return plan;
}

// src/commands/diagnose.ts
async function handleDiagnoseCommand(directory, _args) {
  const checks = [];
  const plan = await loadPlanJsonOnly(directory);
  if (plan) {
    checks.push({
      name: "plan.json",
      status: "✅",
      detail: "Valid schema (v1.0.0)"
    });
    if (plan.migration_status === "migrated") {
      checks.push({
        name: "Migration",
        status: "✅",
        detail: "Plan was migrated from legacy plan.md"
      });
    } else if (plan.migration_status === "migration_failed") {
      checks.push({
        name: "Migration",
        status: "❌",
        detail: "Migration from plan.md failed — review manually"
      });
    }
    const allTaskIds = new Set;
    for (const phase of plan.phases) {
      for (const task of phase.tasks) {
        allTaskIds.add(task.id);
      }
    }
    const missingDeps = [];
    for (const phase of plan.phases) {
      for (const task of phase.tasks) {
        for (const dep of task.depends) {
          if (!allTaskIds.has(dep)) {
            missingDeps.push(`${task.id} depends on missing ${dep}`);
          }
        }
      }
    }
    if (missingDeps.length > 0) {
      checks.push({
        name: "Task DAG",
        status: "❌",
        detail: `Missing dependencies: ${missingDeps.join(", ")}`
      });
    } else {
      checks.push({
        name: "Task DAG",
        status: "✅",
        detail: "All dependencies resolved"
      });
    }
  } else {
    const planContent = await readSwarmFileAsync(directory, "plan.md");
    if (planContent) {
      const hasPhases = /^## Phase \d+/m.test(planContent);
      const hasTasks = /^- \[[ x]\]/m.test(planContent);
      if (hasPhases && hasTasks) {
        checks.push({
          name: "plan.md",
          status: "✅",
          detail: "Found with valid phase structure"
        });
      } else {
        checks.push({
          name: "plan.md",
          status: "❌",
          detail: "Found but missing phase/task structure"
        });
      }
    } else {
      checks.push({
        name: "plan.md",
        status: "❌",
        detail: "Not found"
      });
    }
  }
  const contextContent = await readSwarmFileAsync(directory, "context.md");
  if (contextContent) {
    checks.push({ name: "context.md", status: "✅", detail: "Found" });
  } else {
    checks.push({ name: "context.md", status: "❌", detail: "Not found" });
  }
  try {
    const config = loadPluginConfig(directory);
    if (config) {
      checks.push({
        name: "Plugin config",
        status: "✅",
        detail: "Valid configuration loaded"
      });
    } else {
      checks.push({
        name: "Plugin config",
        status: "✅",
        detail: "Using defaults (no custom config)"
      });
    }
  } catch {
    checks.push({
      name: "Plugin config",
      status: "❌",
      detail: "Invalid configuration"
    });
  }
  if (plan) {
    const completedTaskIds = [];
    for (const phase of plan.phases) {
      for (const task of phase.tasks) {
        if (task.status === "completed") {
          completedTaskIds.push(task.id);
        }
      }
    }
    if (completedTaskIds.length > 0) {
      const evidenceTaskIds = new Set(await listEvidenceTaskIds(directory));
      const missingEvidence = completedTaskIds.filter((id) => !evidenceTaskIds.has(id));
      if (missingEvidence.length === 0) {
        checks.push({
          name: "Evidence",
          status: "✅",
          detail: `All ${completedTaskIds.length} completed tasks have evidence`
        });
      } else {
        checks.push({
          name: "Evidence",
          status: "❌",
          detail: `${missingEvidence.length} completed task(s) missing evidence: ${missingEvidence.join(", ")}`
        });
      }
    } else {
      checks.push({
        name: "Evidence",
        status: "✅",
        detail: "No completed tasks yet"
      });
    }
  }
  const passCount = checks.filter((c) => c.status === "✅").length;
  const totalCount = checks.length;
  const allPassed = passCount === totalCount;
  const lines = [
    "## Swarm Health Check",
    "",
    ...checks.map((c) => `- ${c.status} **${c.name}**: ${c.detail}`),
    "",
    `**Result**: ${allPassed ? "✅ All checks passed" : `⚠️ ${passCount}/${totalCount} checks passed`}`
  ];
  return lines.join(`
`);
}

// src/commands/evidence.ts
async function handleEvidenceCommand(directory, args) {
  if (args.length === 0) {
    const taskIds = await listEvidenceTaskIds(directory);
    if (taskIds.length === 0) {
      return "No evidence bundles found.";
    }
    const tableLines = [
      "## Evidence Bundles",
      "",
      "| Task | Entries | Last Updated |",
      "|------|---------|-------------|"
    ];
    for (const taskId2 of taskIds) {
      const bundle2 = await loadEvidence(directory, taskId2);
      if (bundle2) {
        const entryCount = bundle2.entries.length;
        const lastUpdated = bundle2.updated_at;
        tableLines.push(`| ${taskId2} | ${entryCount} | ${lastUpdated} |`);
      } else {
        tableLines.push(`| ${taskId2} | ? | unknown |`);
      }
    }
    return tableLines.join(`
`);
  }
  const taskId = args[0];
  const bundle = await loadEvidence(directory, taskId);
  if (!bundle) {
    return `No evidence found for task ${taskId}.`;
  }
  const lines = [
    `## Evidence for Task ${taskId}`,
    "",
    `**Created**: ${bundle.created_at}`,
    `**Updated**: ${bundle.updated_at}`,
    `**Entries**: ${bundle.entries.length}`
  ];
  if (bundle.entries.length > 0) {
    lines.push("");
  }
  for (let i = 0;i < bundle.entries.length; i++) {
    const entry = bundle.entries[i];
    lines.push(...formatEntry(i + 1, entry));
  }
  return lines.join(`
`);
}
function formatEntry(index, entry) {
  const lines = [];
  const verdictEmoji = getVerdictEmoji(entry.verdict);
  lines.push(`### Entry ${index}: ${entry.type} (${entry.verdict}) ${verdictEmoji}`);
  lines.push(`- **Agent**: ${entry.agent}`);
  lines.push(`- **Summary**: ${entry.summary}`);
  lines.push(`- **Time**: ${entry.timestamp}`);
  if (entry.type === "review") {
    const reviewEntry = entry;
    lines.push(`- **Risk Level**: ${reviewEntry.risk}`);
    if (reviewEntry.issues && reviewEntry.issues.length > 0) {
      lines.push(`- **Issues**: ${reviewEntry.issues.length}`);
    }
  } else if (entry.type === "test") {
    const testEntry = entry;
    lines.push(`- **Tests**: ${testEntry.tests_passed} passed, ${testEntry.tests_failed} failed`);
  }
  lines.push("");
  return lines;
}
function getVerdictEmoji(verdict) {
  switch (verdict) {
    case "pass":
    case "approved":
      return "✅";
    case "fail":
    case "rejected":
      return "❌";
    case "info":
      return "ℹ️";
    default:
      return "";
  }
}

// src/commands/export.ts
async function handleExportCommand(directory, _args) {
  const planStructured = await loadPlanJsonOnly(directory);
  const planContent = await readSwarmFileAsync(directory, "plan.md");
  const contextContent = await readSwarmFileAsync(directory, "context.md");
  const exportData = {
    version: "4.5.0",
    exported: new Date().toISOString(),
    plan: planStructured || planContent,
    context: contextContent
  };
  const lines = [
    "## Swarm Export",
    "",
    "```json",
    JSON.stringify(exportData, null, 2),
    "```"
  ];
  return lines.join(`
`);
}

// src/commands/history.ts
async function handleHistoryCommand(directory, _args) {
  const plan = await loadPlanJsonOnly(directory);
  if (plan) {
    if (plan.phases.length === 0) {
      return "No history available.";
    }
    const tableLines2 = [
      "## Swarm History",
      "",
      "| Phase | Name | Status | Tasks |",
      "|-------|------|--------|-------|"
    ];
    for (const phase of plan.phases) {
      const statusMap = {
        complete: "COMPLETE",
        in_progress: "IN PROGRESS",
        pending: "PENDING",
        blocked: "BLOCKED"
      };
      const statusText = statusMap[phase.status] || "PENDING";
      const statusIcon = phase.status === "complete" ? "✅" : phase.status === "in_progress" ? "\uD83D\uDD04" : phase.status === "blocked" ? "\uD83D\uDEAB" : "⏳";
      const completed = phase.tasks.filter((t) => t.status === "completed").length;
      const total = phase.tasks.length;
      const tasks = total > 0 ? `${completed}/${total}` : "-";
      tableLines2.push(`| ${phase.id} | ${phase.name} | ${statusIcon} ${statusText} | ${tasks} |`);
    }
    return tableLines2.join(`
`);
  }
  const planContent = await readSwarmFileAsync(directory, "plan.md");
  if (!planContent) {
    return "No history available.";
  }
  const phaseRegex = /^## Phase (\d+):?\s*(.+?)(?:\s*\[(COMPLETE|IN PROGRESS|PENDING)\])?\s*$/gm;
  const phases = [];
  const lines = planContent.split(`
`);
  for (let match = phaseRegex.exec(planContent);match !== null; match = phaseRegex.exec(planContent)) {
    const num = parseInt(match[1], 10);
    const name = match[2].trim();
    const status = match[3] || "PENDING";
    const headerLineIndex = lines.indexOf(match[0]);
    let completed = 0;
    let total = 0;
    if (headerLineIndex !== -1) {
      for (let i = headerLineIndex + 1;i < lines.length; i++) {
        const line = lines[i];
        if (/^## Phase \d+/.test(line) || line.trim() === "---" && total > 0) {
          break;
        }
        if (/^- \[x\]/.test(line)) {
          completed++;
          total++;
        } else if (/^- \[ \]/.test(line)) {
          total++;
        }
      }
    }
    phases.push({ num, name, status, completed, total });
  }
  if (phases.length === 0) {
    return "No history available.";
  }
  const tableLines = [
    "## Swarm History",
    "",
    "| Phase | Name | Status | Tasks |",
    "|-------|------|--------|-------|"
  ];
  for (const phase of phases) {
    const statusIcon = phase.status === "COMPLETE" ? "✅" : phase.status === "IN PROGRESS" ? "\uD83D\uDD04" : "⏳";
    const tasks = phase.total > 0 ? `${phase.completed}/${phase.total}` : "-";
    tableLines.push(`| ${phase.num} | ${phase.name} | ${statusIcon} ${phase.status} | ${tasks} |`);
  }
  return tableLines.join(`
`);
}

// src/commands/plan.ts
async function handlePlanCommand(directory, args) {
  const plan = await loadPlanJsonOnly(directory);
  if (plan) {
    if (args.length === 0) {
      return derivePlanMarkdown(plan);
    }
    const phaseNum2 = parseInt(args[0], 10);
    if (Number.isNaN(phaseNum2)) {
      return derivePlanMarkdown(plan);
    }
    const phase = plan.phases.find((p) => p.id === phaseNum2);
    if (!phase) {
      return `Phase ${phaseNum2} not found in plan.`;
    }
    const fullMarkdown = derivePlanMarkdown(plan);
    const lines2 = fullMarkdown.split(`
`);
    const phaseLines2 = [];
    let inTargetPhase2 = false;
    for (const line of lines2) {
      const phaseMatch = line.match(/^## Phase (\d+)/);
      if (phaseMatch) {
        const num = parseInt(phaseMatch[1], 10);
        if (num === phaseNum2) {
          inTargetPhase2 = true;
          phaseLines2.push(line);
          continue;
        } else if (inTargetPhase2) {
          break;
        }
      }
      if (inTargetPhase2 && line.trim() === "---" && phaseLines2.length > 1) {
        break;
      }
      if (inTargetPhase2) {
        phaseLines2.push(line);
      }
    }
    return phaseLines2.length > 0 ? phaseLines2.join(`
`).trim() : `Phase ${phaseNum2} not found in plan.`;
  }
  const planContent = await readSwarmFileAsync(directory, "plan.md");
  if (!planContent) {
    return "No active swarm plan found.";
  }
  if (args.length === 0) {
    return planContent;
  }
  const phaseNum = parseInt(args[0], 10);
  if (Number.isNaN(phaseNum)) {
    return planContent;
  }
  const lines = planContent.split(`
`);
  const phaseLines = [];
  let inTargetPhase = false;
  for (const line of lines) {
    const phaseMatch = line.match(/^## Phase (\d+)/);
    if (phaseMatch) {
      const num = parseInt(phaseMatch[1], 10);
      if (num === phaseNum) {
        inTargetPhase = true;
        phaseLines.push(line);
        continue;
      } else if (inTargetPhase) {
        break;
      }
    }
    if (inTargetPhase && line.trim() === "---" && phaseLines.length > 1) {
      break;
    }
    if (inTargetPhase) {
      phaseLines.push(line);
    }
  }
  if (phaseLines.length === 0) {
    return `Phase ${phaseNum} not found in plan.`;
  }
  return phaseLines.join(`
`).trim();
}

// src/commands/reset.ts
import * as fs2 from "node:fs";
async function handleResetCommand(directory, args) {
  const hasConfirm = args.includes("--confirm");
  if (!hasConfirm) {
    return [
      "## Swarm Reset",
      "",
      "⚠️ This will delete plan.md and context.md from .swarm/",
      "",
      "**Tip**: Run `/swarm export` first to backup your state.",
      "",
      "To confirm, run: `/swarm reset --confirm`"
    ].join(`
`);
  }
  const filesToReset = ["plan.md", "context.md"];
  const results = [];
  for (const filename of filesToReset) {
    try {
      const resolvedPath = validateSwarmPath(directory, filename);
      if (fs2.existsSync(resolvedPath)) {
        fs2.unlinkSync(resolvedPath);
        results.push(`- ✅ Deleted ${filename}`);
      } else {
        results.push(`- ⏭️ ${filename} not found (skipped)`);
      }
    } catch {
      results.push(`- ❌ Failed to delete ${filename}`);
    }
  }
  try {
    const summariesPath = validateSwarmPath(directory, "summaries");
    if (fs2.existsSync(summariesPath)) {
      fs2.rmSync(summariesPath, { recursive: true, force: true });
      results.push("- ✅ Deleted summaries/ directory");
    } else {
      results.push("- ⏭️ summaries/ not found (skipped)");
    }
  } catch {
    results.push("- ❌ Failed to delete summaries/");
  }
  return [
    "## Swarm Reset Complete",
    "",
    ...results,
    "",
    "Swarm state has been cleared. Start fresh with a new plan."
  ].join(`
`);
}

// src/summaries/manager.ts
import { mkdirSync as mkdirSync2, readdirSync as readdirSync2, renameSync as renameSync2, rmSync as rmSync3, statSync as statSync3 } from "node:fs";
import * as path6 from "node:path";
var SUMMARY_ID_REGEX = /^S\d+$/;
function sanitizeSummaryId(id) {
  if (!id || id.length === 0) {
    throw new Error("Invalid summary ID: empty string");
  }
  if (/\0/.test(id)) {
    throw new Error("Invalid summary ID: contains null bytes");
  }
  for (let i = 0;i < id.length; i++) {
    if (id.charCodeAt(i) < 32) {
      throw new Error("Invalid summary ID: contains control characters");
    }
  }
  if (id.includes("..") || id.includes("../") || id.includes("..\\")) {
    throw new Error("Invalid summary ID: path traversal detected");
  }
  if (!SUMMARY_ID_REGEX.test(id)) {
    throw new Error(`Invalid summary ID: must match pattern ^S\\d+$, got "${id}"`);
  }
  return id;
}
async function storeSummary(directory, id, fullOutput, summaryText, maxStoredBytes) {
  const sanitizedId = sanitizeSummaryId(id);
  const outputBytes = Buffer.byteLength(fullOutput, "utf8");
  if (outputBytes > maxStoredBytes) {
    throw new Error(`Summary fullOutput size (${outputBytes} bytes) exceeds maximum (${maxStoredBytes} bytes)`);
  }
  const relativePath = path6.join("summaries", `${sanitizedId}.json`);
  const summaryPath = validateSwarmPath(directory, relativePath);
  const summaryDir = path6.dirname(summaryPath);
  const entry = {
    id: sanitizedId,
    summaryText,
    fullOutput,
    timestamp: Date.now(),
    originalBytes: outputBytes
  };
  const entryJson = JSON.stringify(entry);
  mkdirSync2(summaryDir, { recursive: true });
  const tempPath = path6.join(summaryDir, `${sanitizedId}.json.tmp.${Date.now()}.${process.pid}`);
  try {
    await Bun.write(tempPath, entryJson);
    renameSync2(tempPath, summaryPath);
  } catch (error2) {
    try {
      rmSync3(tempPath, { force: true });
    } catch {}
    throw error2;
  }
}
async function loadFullOutput(directory, id) {
  const sanitizedId = sanitizeSummaryId(id);
  const relativePath = path6.join("summaries", `${sanitizedId}.json`);
  validateSwarmPath(directory, relativePath);
  const content = await readSwarmFileAsync(directory, relativePath);
  if (content === null) {
    return null;
  }
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed.fullOutput === "string") {
      return parsed.fullOutput;
    }
    warn(`Summary entry ${sanitizedId} missing valid fullOutput field`);
    return null;
  } catch (error2) {
    warn(`Summary entry validation failed for ${sanitizedId}: ${error2 instanceof Error ? error2.message : String(error2)}`);
    return null;
  }
}

// src/commands/retrieve.ts
async function handleRetrieveCommand(directory, args) {
  const summaryId = args[0];
  if (!summaryId) {
    return [
      "## Swarm Retrieve",
      "",
      "Usage: `/swarm retrieve <id>`",
      "",
      "Example: `/swarm retrieve S1`",
      "",
      "Retrieves the full output that was replaced by a summary."
    ].join(`
`);
  }
  try {
    const fullOutput = await loadFullOutput(directory, summaryId);
    if (fullOutput === null) {
      return `## Summary Not Found

No stored output found for ID \`${summaryId}\`.

Use a valid summary ID (e.g., S1, S2, S3).`;
    }
    return fullOutput;
  } catch (error2) {
    return `## Retrieve Failed

${error2 instanceof Error ? error2.message : String(error2)}`;
  }
}

// src/hooks/extractors.ts
function extractCurrentPhase(planContent) {
  if (!planContent) {
    return null;
  }
  const lines = planContent.split(`
`);
  for (let i = 0;i < Math.min(20, lines.length); i++) {
    const line = lines[i].trim();
    const progressMatch = line.match(/^## Phase (\d+):?\s*(.*?)\s*\[IN PROGRESS\]/i);
    if (progressMatch) {
      const phaseNum = progressMatch[1];
      const description = progressMatch[2]?.trim() || "";
      return `Phase ${phaseNum}: ${description} [IN PROGRESS]`;
    }
  }
  for (let i = 0;i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    const phaseMatch = line.match(/Phase:\s*(\d+)/i);
    if (phaseMatch) {
      const phaseNum = phaseMatch[1];
      return `Phase ${phaseNum} [PENDING]`;
    }
  }
  return null;
}
function extractCurrentTask(planContent) {
  if (!planContent) {
    return null;
  }
  const lines = planContent.split(`
`);
  let inCurrentPhase = false;
  for (const line of lines) {
    if (line.startsWith("## ") && /\[IN PROGRESS\]/i.test(line)) {
      inCurrentPhase = true;
      continue;
    }
    if (inCurrentPhase) {
      if (line.startsWith("## ") || line.trim() === "---") {
        break;
      }
      if (line.trim().startsWith("- [ ]")) {
        return line.trim();
      }
    }
  }
  return null;
}
function extractDecisions(contextContent, maxChars = 500) {
  if (!contextContent) {
    return null;
  }
  const lines = contextContent.split(`
`);
  let decisionsText = "";
  let inDecisionsSection = false;
  for (const line of lines) {
    if (line.trim() === "## Decisions") {
      inDecisionsSection = true;
      continue;
    }
    if (inDecisionsSection) {
      if (line.startsWith("## ")) {
        break;
      }
      if (line.startsWith("- ")) {
        decisionsText += `${line}
`;
      }
    }
  }
  if (!decisionsText.trim()) {
    return null;
  }
  const trimmed = decisionsText.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}...`;
}
function extractIncompleteTasks(planContent, maxChars = 500) {
  if (!planContent) {
    return null;
  }
  const lines = planContent.split(`
`);
  let tasksText = "";
  let inCurrentPhase = false;
  for (const line of lines) {
    if (line.startsWith("## ") && /\[IN PROGRESS\]/i.test(line)) {
      inCurrentPhase = true;
      continue;
    }
    if (inCurrentPhase) {
      if (line.startsWith("## ") || line.trim() === "---") {
        break;
      }
      if (line.trim().startsWith("- [ ]")) {
        tasksText += `${line.trim()}
`;
      }
    }
  }
  if (!tasksText.trim()) {
    return null;
  }
  const trimmed = tasksText.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}...`;
}
function extractPatterns(contextContent, maxChars = 500) {
  if (!contextContent) {
    return null;
  }
  const lines = contextContent.split(`
`);
  let patternsText = "";
  let inPatternsSection = false;
  for (const line of lines) {
    if (line.trim() === "## Patterns") {
      inPatternsSection = true;
      continue;
    }
    if (inPatternsSection) {
      if (line.startsWith("## ")) {
        break;
      }
      if (line.startsWith("- ")) {
        patternsText += `${line}
`;
      }
    }
  }
  if (!patternsText.trim()) {
    return null;
  }
  const trimmed = patternsText.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}...`;
}
function extractCurrentPhaseFromPlan(plan) {
  const phase = plan.phases.find((p) => p.id === plan.current_phase);
  if (!phase)
    return null;
  const statusMap = {
    pending: "PENDING",
    in_progress: "IN PROGRESS",
    complete: "COMPLETE",
    blocked: "BLOCKED"
  };
  const statusText = statusMap[phase.status] || "PENDING";
  return `Phase ${phase.id}: ${phase.name} [${statusText}]`;
}
function extractCurrentTaskFromPlan(plan) {
  const phase = plan.phases.find((p) => p.id === plan.current_phase);
  if (!phase)
    return null;
  const inProgress = phase.tasks.find((t) => t.status === "in_progress");
  if (inProgress) {
    const deps = inProgress.depends.length > 0 ? ` (depends: ${inProgress.depends.join(", ")})` : "";
    return `- [ ] ${inProgress.id}: ${inProgress.description} [${inProgress.size.toUpperCase()}]${deps} ← CURRENT`;
  }
  const pending = phase.tasks.find((t) => t.status === "pending");
  if (pending) {
    const deps = pending.depends.length > 0 ? ` (depends: ${pending.depends.join(", ")})` : "";
    return `- [ ] ${pending.id}: ${pending.description} [${pending.size.toUpperCase()}]${deps}`;
  }
  return null;
}
function extractIncompleteTasksFromPlan(plan, maxChars = 500) {
  const phase = plan.phases.find((p) => p.id === plan.current_phase);
  if (!phase)
    return null;
  const incomplete = phase.tasks.filter((t) => t.status === "pending" || t.status === "in_progress");
  if (incomplete.length === 0)
    return null;
  const lines = incomplete.map((t) => {
    const deps = t.depends.length > 0 ? ` (depends: ${t.depends.join(", ")})` : "";
    return `- [ ] ${t.id}: ${t.description} [${t.size.toUpperCase()}]${deps}`;
  });
  const text = lines.join(`
`);
  if (text.length <= maxChars)
    return text;
  return `${text.slice(0, maxChars)}...`;
}

// src/commands/status.ts
async function handleStatusCommand(directory, agents) {
  const plan = await loadPlan(directory);
  if (plan && plan.migration_status !== "migration_failed") {
    const currentPhase2 = extractCurrentPhaseFromPlan(plan) || "Unknown";
    let completedTasks2 = 0;
    let totalTasks2 = 0;
    for (const phase of plan.phases) {
      for (const task of phase.tasks) {
        totalTasks2++;
        if (task.status === "completed")
          completedTasks2++;
      }
    }
    const agentCount2 = Object.keys(agents).length;
    const lines2 = [
      "## Swarm Status",
      "",
      `**Current Phase**: ${currentPhase2}`,
      `**Tasks**: ${completedTasks2}/${totalTasks2} complete`,
      `**Agents**: ${agentCount2} registered`
    ];
    return lines2.join(`
`);
  }
  const planContent = await readSwarmFileAsync(directory, "plan.md");
  if (!planContent)
    return "No active swarm plan found.";
  const currentPhase = extractCurrentPhase(planContent) || "Unknown";
  const completedTasks = (planContent.match(/^- \[x\]/gm) || []).length;
  const incompleteTasks = (planContent.match(/^- \[ \]/gm) || []).length;
  const totalTasks = completedTasks + incompleteTasks;
  const agentCount = Object.keys(agents).length;
  const lines = [
    "## Swarm Status",
    "",
    `**Current Phase**: ${currentPhase}`,
    `**Tasks**: ${completedTasks}/${totalTasks} complete`,
    `**Agents**: ${agentCount} registered`
  ];
  return lines.join(`
`);
}

// src/commands/index.ts
var HELP_TEXT = [
  "## Swarm Commands",
  "",
  "- `/swarm status` — Show current swarm state",
  "- `/swarm plan [phase]` — Show plan (optionally filter by phase number)",
  "- `/swarm agents` — List registered agents",
  "- `/swarm history` — Show completed phases summary",
  "- `/swarm config` — Show current resolved configuration",
  "- `/swarm evidence [taskId]` — Show evidence bundles",
  "- `/swarm archive [--dry-run]` — Archive old evidence bundles",
  "- `/swarm diagnose` — Run health check on swarm state",
  "- `/swarm benchmark [--cumulative] [--ci-gate]` — Show performance metrics",
  "- `/swarm export` — Export plan and context as JSON",
  "- `/swarm reset --confirm` — Clear swarm state files",
  "- `/swarm retrieve <id>` — Retrieve full output from a summary"
].join(`
`);
function createSwarmCommandHandler(directory, agents) {
  return async (input, output) => {
    if (input.command !== "swarm") {
      return;
    }
    const tokens = input.arguments.trim().split(/\s+/).filter(Boolean);
    const [subcommand, ...args] = tokens;
    let text;
    switch (subcommand) {
      case "status":
        text = await handleStatusCommand(directory, agents);
        break;
      case "plan":
        text = await handlePlanCommand(directory, args);
        break;
      case "agents": {
        const pluginConfig = loadPluginConfig(directory);
        const guardrailsConfig = pluginConfig?.guardrails ? GuardrailsConfigSchema.parse(pluginConfig.guardrails) : undefined;
        text = handleAgentsCommand(agents, guardrailsConfig);
        break;
      }
      case "archive":
        text = await handleArchiveCommand(directory, args);
        break;
      case "history":
        text = await handleHistoryCommand(directory, args);
        break;
      case "config":
        text = await handleConfigCommand(directory, args);
        break;
      case "evidence":
        text = await handleEvidenceCommand(directory, args);
        break;
      case "diagnose":
        text = await handleDiagnoseCommand(directory, args);
        break;
      case "benchmark":
        text = await handleBenchmarkCommand(directory, args);
        break;
      case "export":
        text = await handleExportCommand(directory, args);
        break;
      case "reset":
        text = await handleResetCommand(directory, args);
        break;
      case "retrieve":
        text = await handleRetrieveCommand(directory, args);
        break;
      default:
        text = HELP_TEXT;
        break;
    }
    output.parts = [
      { type: "text", text }
    ];
  };
}

// src/hooks/agent-activity.ts
function createAgentActivityHooks(config, directory) {
  if (config.hooks?.agent_activity === false) {
    return {
      toolBefore: async () => {},
      toolAfter: async () => {}
    };
  }
  return {
    toolBefore: async (input) => {
      swarmState.activeToolCalls.set(input.callID, {
        tool: input.tool,
        sessionID: input.sessionID,
        callID: input.callID,
        startTime: Date.now()
      });
    },
    toolAfter: async (input, output) => {
      const entry = swarmState.activeToolCalls.get(input.callID);
      if (!entry)
        return;
      swarmState.activeToolCalls.delete(input.callID);
      const duration = Date.now() - entry.startTime;
      const success = output.output != null;
      const key = entry.tool;
      const existing = swarmState.toolAggregates.get(key) ?? {
        tool: key,
        count: 0,
        successCount: 0,
        failureCount: 0,
        totalDuration: 0
      };
      existing.count++;
      if (success)
        existing.successCount++;
      else
        existing.failureCount++;
      existing.totalDuration += duration;
      swarmState.toolAggregates.set(key, existing);
      swarmState.pendingEvents++;
      if (swarmState.pendingEvents >= 20) {
        flushActivityToFile(directory).catch((err) => warn("Agent activity flush trigger failed:", err));
      }
    }
  };
}
var flushPromise = null;
async function flushActivityToFile(directory) {
  if (flushPromise) {
    flushPromise = flushPromise.then(() => doFlush(directory)).catch((err) => {
      warn("Queued agent activity flush failed:", err);
    });
    return flushPromise;
  }
  flushPromise = doFlush(directory);
  try {
    await flushPromise;
  } finally {
    flushPromise = null;
  }
}
async function doFlush(directory) {
  try {
    const content = await readSwarmFileAsync(directory, "context.md");
    const existing = content ?? "";
    const activitySection = renderActivitySection();
    const updated = replaceOrAppendSection(existing, "## Agent Activity", activitySection);
    const flushedCount = swarmState.pendingEvents;
    const path7 = `${directory}/.swarm/context.md`;
    await Bun.write(path7, updated);
    swarmState.pendingEvents = Math.max(0, swarmState.pendingEvents - flushedCount);
  } catch (error2) {
    warn("Agent activity flush failed:", error2);
  }
}
function renderActivitySection() {
  const lines = ["## Agent Activity", ""];
  if (swarmState.toolAggregates.size === 0) {
    lines.push("No tool activity recorded yet.");
    return lines.join(`
`);
  }
  lines.push("| Tool | Calls | Success | Failed | Avg Duration |");
  lines.push("|------|-------|---------|--------|--------------|");
  const sorted = [...swarmState.toolAggregates.values()].sort((a, b) => b.count - a.count);
  for (const agg of sorted) {
    const avgDuration = agg.count > 0 ? Math.round(agg.totalDuration / agg.count) : 0;
    lines.push(`| ${agg.tool} | ${agg.count} | ${agg.successCount} | ${agg.failureCount} | ${avgDuration}ms |`);
  }
  return lines.join(`
`);
}
function replaceOrAppendSection(content, heading, newSection) {
  const headingIndex = content.indexOf(heading);
  if (headingIndex === -1) {
    return `${content.trimEnd()}

${newSection}
`;
  }
  const afterHeading = content.substring(headingIndex + heading.length);
  const nextHeadingMatch = afterHeading.match(/\n## /);
  if (nextHeadingMatch && nextHeadingMatch.index !== undefined) {
    const endIndex = headingIndex + heading.length + nextHeadingMatch.index;
    return `${content.substring(0, headingIndex)}${newSection}
${content.substring(endIndex + 1)}`;
  }
  return `${content.substring(0, headingIndex)}${newSection}
`;
}
// src/hooks/compaction-customizer.ts
function createCompactionCustomizerHook(config, directory) {
  const enabled = config.hooks?.compaction !== false;
  if (!enabled) {
    return {};
  }
  return {
    "experimental.session.compacting": safeHook(async (_input, output) => {
      const contextContent = await readSwarmFileAsync(directory, "context.md");
      const plan = await loadPlan(directory);
      if (plan && plan.migration_status !== "migration_failed") {
        const currentPhase = extractCurrentPhaseFromPlan(plan);
        if (currentPhase) {
          output.context.push(`[SWARM PLAN] ${currentPhase}`);
        }
        const incompleteTasks = extractIncompleteTasksFromPlan(plan);
        if (incompleteTasks) {
          output.context.push(`[SWARM TASKS] ${incompleteTasks}`);
        }
      } else {
        const planContent = await readSwarmFileAsync(directory, "plan.md");
        if (planContent) {
          const currentPhase = extractCurrentPhase(planContent);
          if (currentPhase) {
            output.context.push(`[SWARM PLAN] ${currentPhase}`);
          }
          const incompleteTasks = extractIncompleteTasks(planContent);
          if (incompleteTasks) {
            output.context.push(`[SWARM TASKS] ${incompleteTasks}`);
          }
        }
      }
      if (contextContent) {
        const decisionsSummary = extractDecisions(contextContent);
        if (decisionsSummary) {
          output.context.push(`[SWARM DECISIONS] ${decisionsSummary}`);
        }
      }
      if (contextContent) {
        const patterns = extractPatterns(contextContent);
        if (patterns) {
          output.context.push(`[SWARM PATTERNS] ${patterns}`);
        }
      }
    })
  };
}
// src/hooks/context-budget.ts
function createContextBudgetHandler(config) {
  const enabled = config.context_budget?.enabled !== false;
  if (!enabled) {
    return async (_input, _output) => {};
  }
  const warnThreshold = config.context_budget?.warn_threshold ?? 0.7;
  const criticalThreshold = config.context_budget?.critical_threshold ?? 0.9;
  const modelLimits = config.context_budget?.model_limits ?? {
    default: 128000
  };
  const modelLimit = modelLimits.default ?? 128000;
  return async (_input, output) => {
    const messages = output?.messages;
    if (!messages || messages.length === 0)
      return;
    let totalTokens = 0;
    for (const message of messages) {
      if (!message?.parts)
        continue;
      for (const part of message.parts) {
        if (part?.type === "text" && part.text) {
          totalTokens += estimateTokens(part.text);
        }
      }
    }
    const usagePercent = totalTokens / modelLimit;
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1;i >= 0; i--) {
      if (messages[i]?.info?.role === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1)
      return;
    const lastUserMessage = messages[lastUserMessageIndex];
    if (!lastUserMessage?.parts)
      return;
    const agent = lastUserMessage.info?.agent;
    if (agent && agent !== "architect")
      return;
    const textPartIndex = lastUserMessage.parts.findIndex((p) => p?.type === "text" && p.text !== undefined);
    if (textPartIndex === -1)
      return;
    const pct = Math.round(usagePercent * 100);
    let warningText = "";
    if (usagePercent > criticalThreshold) {
      warningText = `[CONTEXT CRITICAL: ~${pct}% of context budget used. Offload details to .swarm/context.md immediately]

`;
    } else if (usagePercent > warnThreshold) {
      warningText = `[CONTEXT WARNING: ~${pct}% of context budget used. Consider summarizing to .swarm/context.md]

`;
    }
    if (warningText) {
      const originalText = lastUserMessage.parts[textPartIndex].text ?? "";
      lastUserMessage.parts[textPartIndex].text = `${warningText}${originalText}`;
    }
  };
}
// src/hooks/delegation-gate.ts
function createDelegationGateHook(config) {
  const enabled = config.hooks?.delegation_gate !== false;
  const delegationMaxChars = config.hooks?.delegation_max_chars ?? 4000;
  if (!enabled) {
    return async (_input, _output) => {};
  }
  return async (_input, output) => {
    const messages = output?.messages;
    if (!messages || messages.length === 0)
      return;
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1;i >= 0; i--) {
      if (messages[i]?.info?.role === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }
    if (lastUserMessageIndex === -1)
      return;
    const lastUserMessage = messages[lastUserMessageIndex];
    if (!lastUserMessage?.parts)
      return;
    const agent = lastUserMessage.info?.agent;
    const strippedAgent = agent ? stripKnownSwarmPrefix(agent) : undefined;
    if (strippedAgent && strippedAgent !== "architect")
      return;
    const textPartIndex = lastUserMessage.parts.findIndex((p) => p?.type === "text" && p.text !== undefined);
    if (textPartIndex === -1)
      return;
    const textPart = lastUserMessage.parts[textPartIndex];
    const text = textPart.text ?? "";
    const coderDelegationPattern = /(?:^|\n)\s*(?:\w+_)?coder\s*\n\s*TASK:/i;
    if (!coderDelegationPattern.test(text))
      return;
    const warnings = [];
    if (text.length > delegationMaxChars) {
      warnings.push(`Delegation exceeds recommended size (${text.length} chars, limit ${delegationMaxChars}). Consider splitting into smaller tasks.`);
    }
    const fileMatches = text.match(/^FILE:/gm);
    if (fileMatches && fileMatches.length > 1) {
      warnings.push(`Multiple FILE: directives detected (${fileMatches.length}). Each coder task should target ONE file.`);
    }
    const taskMatches = text.match(/^TASK:/gm);
    if (taskMatches && taskMatches.length > 1) {
      warnings.push(`Multiple TASK: sections detected (${taskMatches.length}). Send ONE task per coder call.`);
    }
    const batchingPattern = /\b(?:and also|then also|additionally|as well as|along with)\b/gi;
    const batchingMatches = text.match(batchingPattern);
    if (batchingMatches && batchingMatches.length > 0) {
      warnings.push("Batching language detected. Break compound objectives into separate coder calls.");
    }
    const sessionID = lastUserMessage.info?.sessionID;
    if (sessionID) {
      const delegationChain = swarmState.delegationChains.get(sessionID);
      if (delegationChain && delegationChain.length >= 2) {
        const coderIndices = [];
        for (let i = delegationChain.length - 1;i >= 0; i--) {
          if (stripKnownSwarmPrefix(delegationChain[i].to).includes("coder")) {
            coderIndices.unshift(i);
            if (coderIndices.length === 2)
              break;
          }
        }
        if (coderIndices.length === 2) {
          const prevCoderIndex = coderIndices[0];
          const betweenCoders = delegationChain.slice(prevCoderIndex + 1);
          const hasReviewer = betweenCoders.some((d) => stripKnownSwarmPrefix(d.to) === "reviewer");
          const hasTestEngineer = betweenCoders.some((d) => stripKnownSwarmPrefix(d.to) === "test_engineer");
          if (!hasReviewer || !hasTestEngineer) {
            warnings.push(`⚠️ PROTOCOL VIOLATION: Previous coder task completed, but QA gate was skipped. ` + `You MUST delegate to reviewer (code review) and test_engineer (test execution) ` + `before starting a new coder task. Review RULES 7-8 in your system prompt.`);
          }
        }
      }
    }
    if (warnings.length === 0)
      return;
    const warningText = `[⚠️ DELEGATION GATE: Your coder delegation may be too complex. Issues:
${warnings.join(`
`)}
Split into smaller, atomic tasks for better results.]`;
    const originalText = textPart.text ?? "";
    textPart.text = `${warningText}

${originalText}`;
  };
}
// src/hooks/delegation-tracker.ts
function createDelegationTrackerHook(config) {
  return async (input, _output) => {
    const now = Date.now();
    if (!input.agent || input.agent === "") {
      const session2 = swarmState.agentSessions.get(input.sessionID);
      if (session2 && session2.delegationActive) {
        session2.delegationActive = false;
        swarmState.activeAgent.set(input.sessionID, ORCHESTRATOR_NAME);
        ensureAgentSession(input.sessionID, ORCHESTRATOR_NAME);
        updateAgentEventTime(input.sessionID);
      } else if (!session2) {
        ensureAgentSession(input.sessionID, ORCHESTRATOR_NAME);
      }
      return;
    }
    const agentName = input.agent;
    const previousAgent = swarmState.activeAgent.get(input.sessionID);
    swarmState.activeAgent.set(input.sessionID, agentName);
    const strippedAgent = stripKnownSwarmPrefix(agentName);
    const isArchitect = strippedAgent === ORCHESTRATOR_NAME;
    const session = ensureAgentSession(input.sessionID, agentName);
    session.delegationActive = !isArchitect;
    if (!isArchitect) {
      beginInvocation(input.sessionID, agentName);
    }
    if (config.hooks?.delegation_tracker === true && previousAgent && previousAgent !== agentName) {
      const entry = {
        from: previousAgent,
        to: agentName,
        timestamp: now
      };
      if (!swarmState.delegationChains.has(input.sessionID)) {
        swarmState.delegationChains.set(input.sessionID, []);
      }
      const chain = swarmState.delegationChains.get(input.sessionID);
      chain?.push(entry);
      swarmState.pendingEvents++;
    }
  };
}
// src/hooks/guardrails.ts
function createGuardrailsHooks(config) {
  if (config.enabled === false) {
    return {
      toolBefore: async () => {},
      toolAfter: async () => {},
      messagesTransform: async () => {}
    };
  }
  return {
    toolBefore: async (input, output) => {
      const rawActiveAgent = swarmState.activeAgent.get(input.sessionID);
      const strippedAgent = rawActiveAgent ? stripKnownSwarmPrefix(rawActiveAgent) : undefined;
      if (strippedAgent === ORCHESTRATOR_NAME) {
        return;
      }
      const existingSession = swarmState.agentSessions.get(input.sessionID);
      if (existingSession) {
        const sessionAgent = stripKnownSwarmPrefix(existingSession.agentName);
        if (sessionAgent === ORCHESTRATOR_NAME) {
          return;
        }
      }
      const agentName = swarmState.activeAgent.get(input.sessionID);
      const session = ensureAgentSession(input.sessionID, agentName);
      const resolvedName = stripKnownSwarmPrefix(session.agentName);
      if (resolvedName === ORCHESTRATOR_NAME) {
        return;
      }
      const agentConfig = resolveGuardrailsConfig(config, session.agentName);
      if (agentConfig.max_duration_minutes === 0 && agentConfig.max_tool_calls === 0) {
        return;
      }
      if (!getActiveWindow(input.sessionID)) {
        const fallbackAgent = swarmState.activeAgent.get(input.sessionID) ?? session.agentName;
        const stripped = stripKnownSwarmPrefix(fallbackAgent);
        if (stripped !== ORCHESTRATOR_NAME) {
          beginInvocation(input.sessionID, fallbackAgent);
        }
      }
      const window = getActiveWindow(input.sessionID);
      if (!window) {
        return;
      }
      if (window.hardLimitHit) {
        throw new Error("\uD83D\uDED1 CIRCUIT BREAKER: Agent blocked. Hard limit was previously triggered. Stop making tool calls and return your progress summary.");
      }
      window.toolCalls++;
      const hash = hashArgs(output.args);
      window.recentToolCalls.push({
        tool: input.tool,
        argsHash: hash,
        timestamp: Date.now()
      });
      if (window.recentToolCalls.length > 20) {
        window.recentToolCalls.shift();
      }
      let repetitionCount = 0;
      if (window.recentToolCalls.length > 0) {
        const lastEntry = window.recentToolCalls[window.recentToolCalls.length - 1];
        for (let i = window.recentToolCalls.length - 1;i >= 0; i--) {
          const entry = window.recentToolCalls[i];
          if (entry.tool === lastEntry.tool && entry.argsHash === lastEntry.argsHash) {
            repetitionCount++;
          } else {
            break;
          }
        }
      }
      const elapsedMinutes = (Date.now() - window.startedAtMs) / 60000;
      if (agentConfig.max_tool_calls > 0 && window.toolCalls >= agentConfig.max_tool_calls) {
        window.hardLimitHit = true;
        warn("Circuit breaker: tool call limit hit", {
          sessionID: input.sessionID,
          agentName: window.agentName,
          invocationId: window.id,
          windowKey: `${window.agentName}:${window.id}`,
          resolvedMaxCalls: agentConfig.max_tool_calls,
          currentCalls: window.toolCalls
        });
        throw new Error(`\uD83D\uDED1 LIMIT REACHED: Tool calls exhausted (${window.toolCalls}/${agentConfig.max_tool_calls}). Finish the current operation and return your progress summary.`);
      }
      if (agentConfig.max_duration_minutes > 0 && elapsedMinutes >= agentConfig.max_duration_minutes) {
        window.hardLimitHit = true;
        warn("Circuit breaker: duration limit hit", {
          sessionID: input.sessionID,
          agentName: window.agentName,
          invocationId: window.id,
          windowKey: `${window.agentName}:${window.id}`,
          resolvedMaxMinutes: agentConfig.max_duration_minutes,
          elapsedMinutes: Math.floor(elapsedMinutes)
        });
        throw new Error(`\uD83D\uDED1 LIMIT REACHED: Duration exhausted (${Math.floor(elapsedMinutes)}/${agentConfig.max_duration_minutes} min). Finish the current operation and return your progress summary.`);
      }
      if (repetitionCount >= agentConfig.max_repetitions) {
        window.hardLimitHit = true;
        throw new Error(`\uD83D\uDED1 LIMIT REACHED: Repeated the same tool call ${repetitionCount} times. This suggests a loop. Return your progress summary.`);
      }
      if (window.consecutiveErrors >= agentConfig.max_consecutive_errors) {
        window.hardLimitHit = true;
        throw new Error(`\uD83D\uDED1 LIMIT REACHED: ${window.consecutiveErrors} consecutive tool errors detected. Return your progress summary with details of what went wrong.`);
      }
      const idleMinutes = (Date.now() - window.lastSuccessTimeMs) / 60000;
      if (idleMinutes >= agentConfig.idle_timeout_minutes) {
        window.hardLimitHit = true;
        warn("Circuit breaker: idle timeout hit", {
          sessionID: input.sessionID,
          agentName: window.agentName,
          invocationId: window.id,
          windowKey: `${window.agentName}:${window.id}`,
          idleTimeoutMinutes: agentConfig.idle_timeout_minutes,
          idleMinutes: Math.floor(idleMinutes)
        });
        throw new Error(`\uD83D\uDED1 LIMIT REACHED: No successful tool call for ${Math.floor(idleMinutes)} minutes (idle timeout: ${agentConfig.idle_timeout_minutes} min). This suggests the agent may be stuck. Return your progress summary.`);
      }
      if (!window.warningIssued) {
        const toolPct = agentConfig.max_tool_calls > 0 ? window.toolCalls / agentConfig.max_tool_calls : 0;
        const durationPct = agentConfig.max_duration_minutes > 0 ? elapsedMinutes / agentConfig.max_duration_minutes : 0;
        const repPct = repetitionCount / agentConfig.max_repetitions;
        const errorPct = window.consecutiveErrors / agentConfig.max_consecutive_errors;
        const reasons = [];
        if (agentConfig.max_tool_calls > 0 && toolPct >= agentConfig.warning_threshold) {
          reasons.push(`tool calls ${window.toolCalls}/${agentConfig.max_tool_calls}`);
        }
        if (durationPct >= agentConfig.warning_threshold) {
          reasons.push(`duration ${Math.floor(elapsedMinutes)}/${agentConfig.max_duration_minutes} min`);
        }
        if (repPct >= agentConfig.warning_threshold) {
          reasons.push(`repetitions ${repetitionCount}/${agentConfig.max_repetitions}`);
        }
        if (errorPct >= agentConfig.warning_threshold) {
          reasons.push(`errors ${window.consecutiveErrors}/${agentConfig.max_consecutive_errors}`);
        }
        if (reasons.length > 0) {
          window.warningIssued = true;
          window.warningReason = reasons.join(", ");
        }
      }
    },
    toolAfter: async (input, output) => {
      const window = getActiveWindow(input.sessionID);
      if (!window)
        return;
      const hasError = output.output === null || output.output === undefined;
      if (hasError) {
        window.consecutiveErrors++;
      } else {
        window.consecutiveErrors = 0;
        window.lastSuccessTimeMs = Date.now();
      }
    },
    messagesTransform: async (_input, output) => {
      const messages = output.messages;
      if (!messages || messages.length === 0) {
        return;
      }
      const lastMessage = messages[messages.length - 1];
      let sessionId = lastMessage.info?.sessionID;
      let targetWindow = sessionId ? getActiveWindow(sessionId) : undefined;
      if (!targetWindow || !targetWindow.warningIssued && !targetWindow.hardLimitHit) {
        for (const [id] of swarmState.agentSessions) {
          const window = getActiveWindow(id);
          if (window && (window.warningIssued || window.hardLimitHit)) {
            targetWindow = window;
            sessionId = id;
            break;
          }
        }
      }
      if (!targetWindow || !targetWindow.warningIssued && !targetWindow.hardLimitHit) {
        return;
      }
      const textPart = lastMessage.parts.find((part) => part.type === "text" && typeof part.text === "string");
      if (!textPart) {
        return;
      }
      if (targetWindow.hardLimitHit) {
        textPart.text = `[\uD83D\uDED1 LIMIT REACHED: Your resource budget is exhausted. Do not make additional tool calls. Return a summary of your progress and any remaining work.]

` + textPart.text;
      } else if (targetWindow.warningIssued) {
        const reasonSuffix = targetWindow.warningReason ? ` (${targetWindow.warningReason})` : "";
        textPart.text = `[⚠️ APPROACHING LIMITS${reasonSuffix}: You still have capacity to finish your current step. Complete what you're working on, then return your results.]

` + textPart.text;
      }
    }
  };
}
function hashArgs(args) {
  try {
    if (typeof args !== "object" || args === null) {
      return 0;
    }
    const sortedKeys = Object.keys(args).sort();
    return Number(Bun.hash(JSON.stringify(args, sortedKeys)));
  } catch {
    return 0;
  }
}
// src/hooks/pipeline-tracker.ts
var PHASE_REMINDER = `<swarm_reminder>
⚠️ ARCHITECT WORKFLOW REMINDER:
1. ANALYZE → Identify domains, create initial spec
2. SME_CONSULTATION → Delegate to @sme (one domain per call, max 3 calls)
3. COLLATE → Synthesize SME outputs into unified spec
4. CODE → Delegate to @coder
5. QA_REVIEW → Delegate to @reviewer (specify CHECK dimensions)
6. TRIAGE → Review feedback: APPROVED | REVISION_NEEDED | BLOCKED
7. TEST → If approved, delegate to @test_engineer

DELEGATION RULES:
- SME: ONE domain per call (serial), max 3 per phase
- Reviewer: Specify CHECK dimensions relevant to the change
- Always wait for response before next delegation
</swarm_reminder>`;
function createPipelineTrackerHook(config) {
  const enabled = config.inject_phase_reminders !== false;
  if (!enabled) {
    return {};
  }
  return {
    "experimental.chat.messages.transform": safeHook(async (_input, output) => {
      const messages = output?.messages;
      if (!messages || messages.length === 0)
        return;
      let lastUserMessageIndex = -1;
      for (let i = messages.length - 1;i >= 0; i--) {
        if (messages[i]?.info?.role === "user") {
          lastUserMessageIndex = i;
          break;
        }
      }
      if (lastUserMessageIndex === -1)
        return;
      const lastUserMessage = messages[lastUserMessageIndex];
      if (!lastUserMessage?.parts)
        return;
      const agent = lastUserMessage.info?.agent;
      if (agent && agent !== "architect")
        return;
      const textPartIndex = lastUserMessage.parts.findIndex((p) => p?.type === "text" && p.text !== undefined);
      if (textPartIndex === -1)
        return;
      const originalText = lastUserMessage.parts[textPartIndex].text ?? "";
      lastUserMessage.parts[textPartIndex].text = `${PHASE_REMINDER}

---

${originalText}`;
    })
  };
}
// src/hooks/context-scoring.ts
function calculateAgeFactor(ageHours, config) {
  if (ageHours <= 0) {
    return 1;
  }
  if (config.mode === "exponential") {
    return 2 ** (-ageHours / config.half_life_hours);
  } else {
    const linearFactor = 1 - ageHours / (config.half_life_hours * 2);
    return Math.max(0, linearFactor);
  }
}
function calculateBaseScore(candidate, weights, decayConfig) {
  const { kind, metadata } = candidate;
  const phase = kind === "phase" ? 1 : 0;
  const currentTask = metadata.isCurrentTask ? 1 : 0;
  const blockedTask = metadata.isBlockedTask ? 1 : 0;
  const recentFailure = metadata.hasFailure ? 1 : 0;
  const recentSuccess = metadata.hasSuccess ? 1 : 0;
  const evidencePresence = metadata.hasEvidence ? 1 : 0;
  let decisionRecency = 0;
  if (kind === "decision" && metadata.decisionAgeHours !== undefined) {
    decisionRecency = calculateAgeFactor(metadata.decisionAgeHours, decayConfig);
  }
  const dependencyProximity = 1 / (1 + (metadata.dependencyDepth ?? 0));
  return weights.phase * phase + weights.current_task * currentTask + weights.blocked_task * blockedTask + weights.recent_failure * recentFailure + weights.recent_success * recentSuccess + weights.evidence_presence * evidencePresence + weights.decision_recency * decisionRecency + weights.dependency_proximity * dependencyProximity;
}
function rankCandidates(candidates, config) {
  if (!config.enabled) {
    return candidates.map((c) => ({ ...c, score: 0 }));
  }
  if (candidates.length === 0) {
    return [];
  }
  const scored = candidates.map((candidate) => {
    const score = calculateBaseScore(candidate, config.weights, config.decision_decay);
    return { ...candidate, score };
  });
  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.id.localeCompare(b.id);
  });
  return scored.slice(0, config.max_candidates);
}

// src/hooks/system-enhancer.ts
function estimateContentType(text) {
  if (text.includes("```") || text.includes("function ") || text.includes("const ")) {
    return "code";
  }
  if (text.startsWith("{") || text.startsWith("[")) {
    return "json";
  }
  if (text.includes("#") || text.includes("*") || text.includes("- ")) {
    return "markdown";
  }
  return "prose";
}
function createSystemEnhancerHook(config, directory) {
  const enabled = config.hooks?.system_enhancer !== false;
  if (!enabled) {
    return {};
  }
  return {
    "experimental.chat.system.transform": safeHook(async (_input, output) => {
      try {
        let tryInject = function(text) {
          const tokens = estimateTokens(text);
          if (injectedTokens + tokens > maxInjectionTokens) {
            return;
          }
          output.system.push(text);
          injectedTokens += tokens;
        };
        const maxInjectionTokens = config.context_budget?.max_injection_tokens ?? Number.POSITIVE_INFINITY;
        let injectedTokens = 0;
        const contextContent = await readSwarmFileAsync(directory, "context.md");
        const scoringEnabled = config.context_budget?.scoring?.enabled === true;
        if (!scoringEnabled) {
          const plan2 = await loadPlan(directory);
          if (plan2 && plan2.migration_status !== "migration_failed") {
            const currentPhase2 = extractCurrentPhaseFromPlan(plan2);
            if (currentPhase2) {
              tryInject(`[SWARM CONTEXT] Current phase: ${currentPhase2}`);
            }
            const currentTask2 = extractCurrentTaskFromPlan(plan2);
            if (currentTask2) {
              tryInject(`[SWARM CONTEXT] Current task: ${currentTask2}`);
            }
          } else {
            const planContent = await readSwarmFileAsync(directory, "plan.md");
            if (planContent) {
              const currentPhase2 = extractCurrentPhase(planContent);
              if (currentPhase2) {
                tryInject(`[SWARM CONTEXT] Current phase: ${currentPhase2}`);
              }
              const currentTask2 = extractCurrentTask(planContent);
              if (currentTask2) {
                tryInject(`[SWARM CONTEXT] Current task: ${currentTask2}`);
              }
            }
          }
          if (contextContent) {
            const decisions = extractDecisions(contextContent, 200);
            if (decisions) {
              tryInject(`[SWARM CONTEXT] Key decisions: ${decisions}`);
            }
            if (config.hooks?.agent_activity !== false && _input.sessionID) {
              const activeAgent = swarmState.activeAgent.get(_input.sessionID);
              if (activeAgent) {
                const agentContext = extractAgentContext(contextContent, activeAgent, config.hooks?.agent_awareness_max_chars ?? 300);
                if (agentContext) {
                  tryInject(`[SWARM AGENT CONTEXT] ${agentContext}`);
                }
              }
            }
          }
          tryInject("[SWARM HINT] Large tool outputs may be auto-summarized. Use /swarm retrieve <id> to get the full content if needed.");
          return;
        }
        const userScoringConfig = config.context_budget?.scoring;
        const candidates = [];
        let idCounter = 0;
        const effectiveConfig = userScoringConfig?.weights ? {
          ...DEFAULT_SCORING_CONFIG,
          ...userScoringConfig,
          weights: userScoringConfig.weights
        } : DEFAULT_SCORING_CONFIG;
        const plan = await loadPlan(directory);
        let currentPhase = null;
        let currentTask = null;
        if (plan && plan.migration_status !== "migration_failed") {
          currentPhase = extractCurrentPhaseFromPlan(plan);
          currentTask = extractCurrentTaskFromPlan(plan);
        } else {
          const planContent = await readSwarmFileAsync(directory, "plan.md");
          if (planContent) {
            currentPhase = extractCurrentPhase(planContent);
            currentTask = extractCurrentTask(planContent);
          }
        }
        if (currentPhase) {
          const text = `[SWARM CONTEXT] Current phase: ${currentPhase}`;
          candidates.push({
            id: `candidate-${idCounter++}`,
            kind: "phase",
            text,
            tokens: estimateTokens(text),
            priority: 1,
            metadata: { contentType: estimateContentType(text) }
          });
        }
        if (currentTask) {
          const text = `[SWARM CONTEXT] Current task: ${currentTask}`;
          candidates.push({
            id: `candidate-${idCounter++}`,
            kind: "task",
            text,
            tokens: estimateTokens(text),
            priority: 2,
            metadata: {
              contentType: estimateContentType(text),
              isCurrentTask: true
            }
          });
        }
        if (contextContent) {
          const decisions = extractDecisions(contextContent, 200);
          if (decisions) {
            const text = `[SWARM CONTEXT] Key decisions: ${decisions}`;
            candidates.push({
              id: `candidate-${idCounter++}`,
              kind: "decision",
              text,
              tokens: estimateTokens(text),
              priority: 3,
              metadata: { contentType: estimateContentType(text) }
            });
          }
          if (config.hooks?.agent_activity !== false && _input.sessionID) {
            const activeAgent = swarmState.activeAgent.get(_input.sessionID);
            if (activeAgent) {
              const agentContext = extractAgentContext(contextContent, activeAgent, config.hooks?.agent_awareness_max_chars ?? 300);
              if (agentContext) {
                const text = `[SWARM AGENT CONTEXT] ${agentContext}`;
                candidates.push({
                  id: `candidate-${idCounter++}`,
                  kind: "agent_context",
                  text,
                  tokens: estimateTokens(text),
                  priority: 4,
                  metadata: { contentType: estimateContentType(text) }
                });
              }
            }
          }
        }
        const ranked = rankCandidates(candidates, effectiveConfig);
        for (const candidate of ranked) {
          if (injectedTokens + candidate.tokens > maxInjectionTokens) {
            continue;
          }
          output.system.push(candidate.text);
          injectedTokens += candidate.tokens;
        }
      } catch (error2) {
        warn("System enhancer failed:", error2);
      }
    })
  };
}
function extractAgentContext(contextContent, activeAgent, maxChars) {
  const activityMatch = contextContent.match(/## Agent Activity\n([\s\S]*?)(?=\n## |$)/);
  if (!activityMatch)
    return null;
  const activitySection = activityMatch[1].trim();
  if (!activitySection || activitySection === "No tool activity recorded yet.")
    return null;
  const agentName = stripKnownSwarmPrefix(activeAgent);
  let contextSummary;
  switch (agentName) {
    case "coder":
      contextSummary = `Recent tool activity for review context:
${activitySection}`;
      break;
    case "reviewer":
      contextSummary = `Tool usage to review:
${activitySection}`;
      break;
    case "test_engineer":
      contextSummary = `Tool activity for test context:
${activitySection}`;
      break;
    default:
      contextSummary = `Agent activity summary:
${activitySection}`;
      break;
  }
  if (contextSummary.length > maxChars) {
    return `${contextSummary.substring(0, maxChars - 3)}...`;
  }
  return contextSummary;
}
// src/summaries/summarizer.ts
var HYSTERESIS_FACTOR = 1.25;
function detectContentType(output, toolName) {
  const trimmed = output.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {}
  }
  const codeToolNames = ["read", "cat", "grep", "bash"];
  const lowerToolName = toolName.toLowerCase();
  const toolSegments = lowerToolName.split(/[.\-_/]/);
  if (codeToolNames.some((name) => toolSegments.includes(name))) {
    return "code";
  }
  const codePatterns = [
    "function ",
    "const ",
    "import ",
    "export ",
    "class ",
    "def ",
    "return ",
    "=>"
  ];
  const startsWithShebang = trimmed.startsWith("#!");
  if (codePatterns.some((pattern) => output.includes(pattern)) || startsWithShebang) {
    return "code";
  }
  const sampleSize = Math.min(1000, output.length);
  let nonPrintableCount = 0;
  for (let i = 0;i < sampleSize; i++) {
    const charCode = output.charCodeAt(i);
    if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
      nonPrintableCount++;
    }
  }
  if (sampleSize > 0 && nonPrintableCount / sampleSize > 0.1) {
    return "binary";
  }
  return "text";
}
function shouldSummarize(output, thresholdBytes) {
  const byteLength = Buffer.byteLength(output, "utf8");
  return byteLength >= thresholdBytes * HYSTERESIS_FACTOR;
}
function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  const formatted = unitIndex === 0 ? size.toString() : size.toFixed(1);
  return `${formatted} ${units[unitIndex]}`;
}
function createSummary(output, toolName, summaryId, maxSummaryChars) {
  const contentType = detectContentType(output, toolName);
  const lineCount = output.split(`
`).length;
  const byteSize = Buffer.byteLength(output, "utf8");
  const formattedSize = formatBytes(byteSize);
  const headerLine = `[SUMMARY ${summaryId}] ${formattedSize} | ${contentType} | ${lineCount} lines`;
  const footerLine = `→ Use /swarm retrieve ${summaryId} for full content`;
  const overhead = headerLine.length + 1 + footerLine.length + 1;
  const maxPreviewChars = maxSummaryChars - overhead;
  let preview;
  switch (contentType) {
    case "json": {
      try {
        const parsed = JSON.parse(output.trim());
        if (Array.isArray(parsed)) {
          preview = `[ ${parsed.length} items ]`;
        } else if (typeof parsed === "object" && parsed !== null) {
          const keys = Object.keys(parsed).slice(0, 3);
          preview = `{ ${keys.join(", ")}${Object.keys(parsed).length > 3 ? ", ..." : ""} }`;
        } else {
          const lines = output.split(`
`).filter((line) => line.trim().length > 0).slice(0, 3);
          preview = lines.join(`
`);
        }
      } catch {
        const lines = output.split(`
`).filter((line) => line.trim().length > 0).slice(0, 3);
        preview = lines.join(`
`);
      }
      break;
    }
    case "code": {
      const lines = output.split(`
`).filter((line) => line.trim().length > 0).slice(0, 5);
      preview = lines.join(`
`);
      break;
    }
    case "text": {
      const lines = output.split(`
`).filter((line) => line.trim().length > 0).slice(0, 5);
      preview = lines.join(`
`);
      break;
    }
    case "binary": {
      preview = `[Binary content - ${formattedSize}]`;
      break;
    }
    default: {
      const lines = output.split(`
`).filter((line) => line.trim().length > 0).slice(0, 5);
      preview = lines.join(`
`);
    }
  }
  if (preview.length > maxPreviewChars) {
    preview = preview.substring(0, maxPreviewChars - 3) + "...";
  }
  return `${headerLine}
${preview}
${footerLine}`;
}

// src/hooks/tool-summarizer.ts
var nextSummaryId = 1;
function createToolSummarizerHook(config, directory) {
  if (config.enabled === false) {
    return async () => {};
  }
  return async (input, output) => {
    if (typeof output.output !== "string" || output.output.length === 0) {
      return;
    }
    if (!shouldSummarize(output.output, config.threshold_bytes)) {
      return;
    }
    const summaryId = `S${nextSummaryId++}`;
    const summaryText = createSummary(output.output, input.tool, summaryId, config.max_summary_chars);
    try {
      await storeSummary(directory, summaryId, output.output, summaryText, config.max_stored_bytes);
      output.output = summaryText;
    } catch (error2) {
      warn(`Tool output summarization failed for ${summaryId}: ${error2 instanceof Error ? error2.message : String(error2)}`);
    }
  };
}
// src/tools/domain-detector.ts
import { tool } from "@opencode-ai/plugin/tool";
var DOMAIN_PATTERNS = {
  windows: [
    /\bwindows\b/i,
    /\bwin32\b/i,
    /\bregistry\b/i,
    /\bregedit\b/i,
    /\bwmi\b/i,
    /\bcim\b/i,
    /\bservice\b/i,
    /\bevent\s*log\b/i,
    /\bscheduled\s*task\b/i,
    /\bgpo\b/i,
    /\bgroup\s*policy\b/i,
    /\bmsi\b/i,
    /\binstaller\b/i,
    /\bwinrm\b/i
  ],
  powershell: [
    /\bpowershell\b/i,
    /\bpwsh\b/i,
    /\bps1\b/i,
    /\bcmdlet\b/i,
    /\bget-\w+/i,
    /\bset-\w+/i,
    /\bnew-\w+/i,
    /\bremove-\w+/i,
    /\binvoke-\w+/i,
    /\bpester\b/i
  ],
  python: [
    /\bpython\b/i,
    /\bpip\b/i,
    /\bpypi\b/i,
    /\bdjango\b/i,
    /\bflask\b/i,
    /\bpandas\b/i,
    /\bnumpy\b/i,
    /\bpytest\b/i,
    /\bvenv\b/i,
    /\bconda\b/i
  ],
  oracle: [
    /\boracle\b/i,
    /\bsqlplus\b/i,
    /\bplsql\b/i,
    /\btnsnames\b/i,
    /\bpdb\b/i,
    /\bcdb\b/i,
    /\btablespace\b/i,
    /\brman\b/i,
    /\bdataguard\b/i,
    /\basm\b/i,
    /\brac\b/i,
    /\bora-\d+/i
  ],
  network: [
    /\bnetwork\b/i,
    /\bfirewall\b/i,
    /\bdns\b/i,
    /\bdhcp\b/i,
    /\btcp\b/i,
    /\budp\b/i,
    /\bip\s*address\b/i,
    /\bsubnet\b/i,
    /\bvlan\b/i,
    /\brouting\b/i,
    /\bswitch\b/i,
    /\bload\s*balanc/i,
    /\bproxy\b/i,
    /\bssl\b/i,
    /\btls\b/i,
    /\bcertificate\b/i
  ],
  security: [
    /\bstig\b/i,
    /\bdisa\b/i,
    /\bcve\b/i,
    /\bvulnerabil/i,
    /\bharden\b/i,
    /\baudit\b/i,
    /\bcompliance\b/i,
    /\bscap\b/i,
    /\bfips\b/i,
    /\bcac\b/i,
    /\bpki\b/i,
    /\bencrypt/i
  ],
  linux: [
    /\blinux\b/i,
    /\bubuntu\b/i,
    /\brhel\b/i,
    /\bcentos\b/i,
    /\bbash\b/i,
    /\bsystemd\b/i,
    /\bsystemctl\b/i,
    /\byum\b/i,
    /\bapt\b/i,
    /\bcron\b/i,
    /\bchmod\b/i,
    /\bchown\b/i
  ],
  vmware: [
    /\bvmware\b/i,
    /\bvsphere\b/i,
    /\besxi\b/i,
    /\bvcenter\b/i,
    /\bvsan\b/i,
    /\bnsx\b/i,
    /\bvmotion\b/i,
    /\bdatastore\b/i,
    /\bpowercli\b/i,
    /\bova\b/i,
    /\bovf\b/i
  ],
  azure: [
    /\bazure\b/i,
    /\baz\s+\w+/i,
    /\bentra\b/i,
    /\baad\b/i,
    /\bazure\s*ad\b/i,
    /\barm\s*template\b/i,
    /\bbicep\b/i,
    /\bazure\s*devops\b/i,
    /\bblob\b/i,
    /\bkeyvault\b/i
  ],
  active_directory: [
    /\bactive\s*directory\b/i,
    /\bad\s+\w+/i,
    /\bldap\b/i,
    /\bdomain\s*controller\b/i,
    /\bgpupdate\b/i,
    /\bdsquery\b/i,
    /\bdsmod\b/i,
    /\baduc\b/i,
    /\bkerberos\b/i,
    /\bspn\b/i
  ],
  ui_ux: [
    /\bui\b/i,
    /\bux\b/i,
    /\buser\s+experience\b/i,
    /\buser\s+interface\b/i,
    /\bvisual\s+design\b/i,
    /\binteraction\s+design\b/i,
    /\bdesign\s+system\b/i,
    /\bwireframe\b/i,
    /\bprototype\b/i,
    /\baccessibility\b/i,
    /\btypography\b/i,
    /\blayout\b/i,
    /\bresponsive\b/i
  ]
};
var detect_domains = tool({
  description: "Detect which SME domains are relevant for a given text. " + "Returns a list of domain names (windows, powershell, python, oracle, " + "network, security, linux, vmware, azure, active_directory, ui_ux) " + "that match patterns in the input text.",
  args: {
    text: tool.schema.string().describe("The text to analyze for domain patterns")
  },
  execute: async (args) => {
    const text = args.text.toLowerCase();
    const detected = [];
    for (const [domain, patterns] of Object.entries(DOMAIN_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          detected.push(domain);
          break;
        }
      }
    }
    if (detected.length === 0) {
      return "No specific domains detected. The Architect should determine requirements from context.";
    }
    return `Detected domains: ${detected.join(", ")}

Use these as DOMAIN values when delegating to @sme.`;
  }
});
// src/tools/file-extractor.ts
import * as fs3 from "node:fs";
import * as path7 from "node:path";
import { tool as tool2 } from "@opencode-ai/plugin/tool";
var EXT_MAP = {
  python: ".py",
  py: ".py",
  powershell: ".ps1",
  ps1: ".ps1",
  pwsh: ".ps1",
  javascript: ".js",
  js: ".js",
  typescript: ".ts",
  ts: ".ts",
  bash: ".sh",
  sh: ".sh",
  json: ".json",
  yaml: ".yaml",
  yml: ".yaml",
  xml: ".xml",
  html: ".html",
  css: ".css",
  sql: ".sql",
  pester: ".Tests.ps1",
  test: ".Tests.ps1",
  "": ".txt"
};
function extractFilename(code, language, index) {
  const lines = code.trim().split(`
`);
  const ext = EXT_MAP[language.toLowerCase()] ?? ".txt";
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    const filenameMatch = firstLine.match(/^[#/]+\s*filename[:\s]+(\S+\.\w+)/i);
    if (filenameMatch) {
      return filenameMatch[1];
    }
    const bareMatch = firstLine.match(/^[#/]+\s*(\w+\.\w+)\s*$/);
    if (bareMatch) {
      return bareMatch[1];
    }
  }
  for (const line of lines.slice(0, 5)) {
    const defMatch = line.match(/^(?:def\s+|class\s+)(\w+)/);
    if (defMatch && !defMatch[1].startsWith("_")) {
      return `${defMatch[1]}${ext}`;
    }
    const psMatch = line.match(/^function\s+([\w-]+)/i);
    if (psMatch) {
      return `${psMatch[1]}${ext}`;
    }
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return `output_${index + 1}_${timestamp}${ext}`;
}
var extract_code_blocks = tool2({
  description: "Extract code blocks from text content and save them to files. " + "Parses markdown-style code fences (```language...```) and saves each block. " + "Automatically determines filenames from comments or function names.",
  args: {
    content: tool2.schema.string().describe("Text content containing code blocks to extract"),
    output_dir: tool2.schema.string().optional().describe("Directory to save files (defaults to current directory)"),
    prefix: tool2.schema.string().optional().describe("Optional prefix for generated filenames")
  },
  execute: async (args) => {
    const { content, output_dir, prefix } = args;
    const targetDir = output_dir || process.cwd();
    if (!fs3.existsSync(targetDir)) {
      fs3.mkdirSync(targetDir, { recursive: true });
    }
    const pattern = /```(\w*)\n([\s\S]*?)```/g;
    const matches = [...content.matchAll(pattern)];
    if (matches.length === 0) {
      return "No code blocks found in content.";
    }
    const savedFiles = [];
    const errors = [];
    for (let i = 0;i < matches.length; i++) {
      const [, language, code] = matches[i];
      let filename = extractFilename(code, language, i);
      if (prefix) {
        filename = `${prefix}_${filename}`;
      }
      let filepath = path7.join(targetDir, filename);
      const base = path7.basename(filepath, path7.extname(filepath));
      const ext = path7.extname(filepath);
      let counter = 1;
      while (fs3.existsSync(filepath)) {
        filepath = path7.join(targetDir, `${base}_${counter}${ext}`);
        counter++;
      }
      try {
        fs3.writeFileSync(filepath, code.trim(), "utf-8");
        savedFiles.push(filepath);
      } catch (error2) {
        errors.push(`Failed to save ${filename}: ${error2 instanceof Error ? error2.message : String(error2)}`);
      }
    }
    let result = `Extracted ${savedFiles.length} file(s):
`;
    for (const file of savedFiles) {
      result += `  - ${file}
`;
    }
    if (errors.length > 0) {
      result += `
Errors:
`;
      for (const err of errors) {
        result += `  - ${err}
`;
      }
    }
    return result;
  }
});
// src/tools/gitingest.ts
import { tool as tool3 } from "@opencode-ai/plugin";
var GITINGEST_TIMEOUT_MS = 1e4;
var GITINGEST_MAX_RESPONSE_BYTES = 5242880;
var GITINGEST_MAX_RETRIES = 2;
var delay = (ms) => new Promise((resolve3) => setTimeout(resolve3, ms));
async function fetchGitingest(args) {
  for (let attempt = 0;attempt <= GITINGEST_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController;
      const timeoutId = setTimeout(() => controller.abort(), GITINGEST_TIMEOUT_MS);
      const response = await fetch("https://gitingest.com/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_text: args.url,
          max_file_size: args.maxFileSize ?? 50000,
          pattern: args.pattern ?? "",
          pattern_type: args.patternType ?? "exclude"
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.status >= 500 && attempt < GITINGEST_MAX_RETRIES) {
        const backoff = 200 * 2 ** attempt;
        await delay(backoff);
        continue;
      }
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`gitingest API error: ${response.status} ${response.statusText}`);
      }
      if (!response.ok) {
        throw new Error(`gitingest API error: ${response.status} ${response.statusText}`);
      }
      const contentLength = Number(response.headers.get("content-length"));
      if (Number.isFinite(contentLength) && contentLength > GITINGEST_MAX_RESPONSE_BYTES) {
        throw new Error("gitingest response too large");
      }
      const text = await response.text();
      if (Buffer.byteLength(text) > GITINGEST_MAX_RESPONSE_BYTES) {
        throw new Error("gitingest response too large");
      }
      const data = JSON.parse(text);
      return `${data.summary}

${data.tree}

${data.content}`;
    } catch (error2) {
      if (error2 instanceof DOMException && (error2.name === "TimeoutError" || error2.name === "AbortError")) {
        if (attempt >= GITINGEST_MAX_RETRIES) {
          throw new Error("gitingest request timed out");
        }
        const backoff = 200 * 2 ** attempt;
        await delay(backoff);
        continue;
      }
      if (error2 instanceof Error && error2.message.startsWith("gitingest ")) {
        throw error2;
      }
      if (attempt < GITINGEST_MAX_RETRIES) {
        const backoff = 200 * 2 ** attempt;
        await delay(backoff);
        continue;
      }
      throw error2;
    }
  }
  throw new Error("gitingest request failed after retries");
}
var gitingest = tool3({
  description: "Fetch a GitHub repository's full content via gitingest.com. Returns summary, directory tree, and file contents optimized for LLM analysis. Use when you need to understand an external repository's structure or code.",
  args: {
    url: tool3.schema.string().describe("GitHub repository URL (e.g., https://github.com/owner/repo)"),
    maxFileSize: tool3.schema.number().optional().describe("Maximum file size in bytes to include (default: 50000)"),
    pattern: tool3.schema.string().optional().describe("Glob pattern to filter files (e.g., '*.ts' or 'src/**/*.py')"),
    patternType: tool3.schema.enum(["include", "exclude"]).optional().describe("Whether pattern includes or excludes matching files (default: exclude)")
  },
  async execute(args, _context) {
    return fetchGitingest(args);
  }
});
// src/index.ts
var OpenCodeSwarm = async (ctx) => {
  const config = loadPluginConfig(ctx.directory);
  const agents = getAgentConfigs(config);
  const agentDefinitions = createAgents(config);
  const pipelineHook = createPipelineTrackerHook(config);
  const systemEnhancerHook = createSystemEnhancerHook(config, ctx.directory);
  const compactionHook = createCompactionCustomizerHook(config, ctx.directory);
  const contextBudgetHandler = createContextBudgetHandler(config);
  const commandHandler = createSwarmCommandHandler(ctx.directory, Object.fromEntries(agentDefinitions.map((agent) => [agent.name, agent])));
  const activityHooks = createAgentActivityHooks(config, ctx.directory);
  const delegationHandler = createDelegationTrackerHook(config);
  const delegationGateHandler = createDelegationGateHook(config);
  const guardrailsConfig = GuardrailsConfigSchema.parse(config.guardrails ?? {});
  const guardrailsHooks = createGuardrailsHooks(guardrailsConfig);
  const summaryConfig = SummaryConfigSchema.parse(config.summaries ?? {});
  const toolSummarizerHook = createToolSummarizerHook(summaryConfig, ctx.directory);
  log("Plugin initialized", {
    directory: ctx.directory,
    maxIterations: config.max_iterations,
    agentCount: Object.keys(agents).length,
    agentNames: Object.keys(agents),
    hooks: {
      pipeline: !!pipelineHook["experimental.chat.messages.transform"],
      systemEnhancer: !!systemEnhancerHook["experimental.chat.system.transform"],
      compaction: !!compactionHook["experimental.session.compacting"],
      contextBudget: !!contextBudgetHandler,
      commands: true,
      agentActivity: config.hooks?.agent_activity !== false,
      delegationTracker: config.hooks?.delegation_tracker === true,
      guardrails: guardrailsConfig.enabled,
      toolSummarizer: summaryConfig.enabled
    }
  });
  return {
    name: "opencode-swarm",
    agent: agents,
    tool: {
      detect_domains,
      extract_code_blocks,
      gitingest
    },
    config: async (opencodeConfig) => {
      if (!opencodeConfig.agent) {
        opencodeConfig.agent = { ...agents };
      } else {
        Object.assign(opencodeConfig.agent, agents);
      }
      opencodeConfig.command = {
        ...opencodeConfig.command || {},
        swarm: {
          template: "{{arguments}}",
          description: "Swarm management commands"
        }
      };
      log("Config applied", {
        agents: Object.keys(agents),
        commands: ["swarm"]
      });
    },
    "experimental.chat.messages.transform": composeHandlers(...[
      pipelineHook["experimental.chat.messages.transform"],
      contextBudgetHandler,
      guardrailsHooks.messagesTransform,
      delegationGateHandler
    ].filter((fn) => Boolean(fn))),
    "experimental.chat.system.transform": systemEnhancerHook["experimental.chat.system.transform"],
    "experimental.session.compacting": compactionHook["experimental.session.compacting"],
    "command.execute.before": safeHook(commandHandler),
    "tool.execute.before": async (input, output) => {
      if (!swarmState.activeAgent.has(input.sessionID)) {
        swarmState.activeAgent.set(input.sessionID, ORCHESTRATOR_NAME);
      }
      const session = swarmState.agentSessions.get(input.sessionID);
      const activeAgent = swarmState.activeAgent.get(input.sessionID);
      if (session && activeAgent && activeAgent !== ORCHESTRATOR_NAME) {
        const stripActive = stripKnownSwarmPrefix(activeAgent);
        if (stripActive !== ORCHESTRATOR_NAME) {
          const staleDelegation = !session.delegationActive || Date.now() - session.lastAgentEventTime > 1e4;
          if (staleDelegation) {
            swarmState.activeAgent.set(input.sessionID, ORCHESTRATOR_NAME);
            ensureAgentSession(input.sessionID, ORCHESTRATOR_NAME);
          }
        }
      }
      await guardrailsHooks.toolBefore(input, output);
      await safeHook(activityHooks.toolBefore)(input, output);
    },
    "tool.execute.after": async (input, output) => {
      await activityHooks.toolAfter(input, output);
      await guardrailsHooks.toolAfter(input, output);
      await toolSummarizerHook?.(input, output);
      if (input.tool === "task") {
        const sessionId = input.sessionID;
        swarmState.activeAgent.set(sessionId, ORCHESTRATOR_NAME);
        ensureAgentSession(sessionId, ORCHESTRATOR_NAME);
        const session = swarmState.agentSessions.get(sessionId);
        if (session) {
          session.delegationActive = false;
          session.lastAgentEventTime = Date.now();
        }
      }
    },
    "chat.message": safeHook(delegationHandler)
  };
};
var src_default = OpenCodeSwarm;
export {
  src_default as default
};
