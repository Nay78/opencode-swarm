#!/usr/bin/env bun
// @bun

// src/cli/index.ts
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// src/config/defaults.ts
var DEFAULT_PLUGIN_CONFIG = {
  agents: {
    architect: { model: "anthropic/claude-sonnet-4.5" },
    coder: { model: "openai/gpt-5.2-codex" },
    critic: { model: "google/gemini-3-flash" },
    docs: { model: "google/gemini-3-flash" },
    explorer: { model: "google/gemini-3-flash" },
    reviewer: { model: "google/gemini-3-flash" },
    sme: { model: "google/gemini-3-flash" },
    test_engineer: { model: "google/gemini-3-flash" }
  },
  max_iterations: 5,
  qa_retry_limit: 3,
  inject_phase_reminders: true,
  hooks: {
    system_enhancer: true,
    compaction: true,
    agent_activity: true,
    delegation_tracker: false,
    agent_awareness_max_chars: 300,
    delegation_gate: true,
    delegation_max_chars: 4000
  },
  context_budget: {
    enabled: true,
    warn_threshold: 0.7,
    critical_threshold: 0.9,
    model_limits: { default: 128000 },
    max_injection_tokens: 4000,
    scoring: {
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
    }
  },
  guardrails: {
    enabled: true,
    max_tool_calls: 200,
    max_duration_minutes: 30,
    max_repetitions: 10,
    max_consecutive_errors: 5,
    warning_threshold: 0.75,
    idle_timeout_minutes: 60,
    profiles: {}
  },
  evidence: {
    enabled: true,
    max_age_days: 90,
    max_bundles: 1000,
    auto_archive: false
  },
  summaries: {
    enabled: true,
    threshold_bytes: 20480,
    max_summary_chars: 1000,
    max_stored_bytes: 10485760,
    retention_days: 7
  },
  review_passes: {
    always_security_review: false,
    security_globs: [
      "**/auth/**",
      "**/api/**",
      "**/crypto/**",
      "**/security/**",
      "**/middleware/**",
      "**/session/**",
      "**/token/**"
    ]
  },
  integration_analysis: { enabled: true },
  docs: {
    enabled: true,
    doc_patterns: [
      "README.md",
      "CONTRIBUTING.md",
      "docs/**/*.md",
      "docs/**/*.rst",
      "**/CHANGELOG.md"
    ]
  },
  ui_review: { enabled: false },
  compaction_advisory: {
    enabled: true,
    thresholds: [50, 75, 100, 125, 150],
    message: "[SWARM HINT] Session has ${totalToolCalls} tool calls. Consider compacting at next phase boundary to maintain context quality."
  },
  lint: {
    enabled: true,
    mode: "check",
    linter: "auto",
    patterns: [
      "**/*.{ts,tsx,js,jsx,mjs,cjs}",
      "**/biome.json",
      "**/biome.jsonc"
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/coverage/**",
      "**/*.min.js"
    ]
  },
  secretscan: {
    enabled: true,
    patterns: [
      "**/*.{env,properties,yml,yaml,json,js,ts}",
      "**/.env*",
      "**/secrets/**",
      "**/credentials/**",
      "**/config/**/*.ts",
      "**/config/**/*.js"
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/coverage/**",
      "**/test/**",
      "**/tests/**",
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.js",
      "**/*.spec.ts",
      "**/*.spec.js"
    ],
    extensions: [
      ".env",
      ".properties",
      ".yml",
      ".yaml",
      ".json",
      ".js",
      ".ts",
      ".py",
      ".rb",
      ".go",
      ".java",
      ".cs",
      ".php"
    ]
  },
  checkpoint: {
    enabled: true,
    auto_checkpoint_threshold: 3
  }
};

// src/cli/index.ts
var CONFIG_DIR = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "opencode");
var OPENCODE_CONFIG_PATH = path.join(CONFIG_DIR, "opencode.json");
var PLUGIN_CONFIG_PATH = path.join(CONFIG_DIR, "opencode-swarm.json");
var PROMPTS_DIR = path.join(CONFIG_DIR, "opencode-swarm");
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
function loadJson(filepath) {
  try {
    const content = fs.readFileSync(filepath, "utf-8");
    const stripped = content.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (match, comment) => comment ? "" : match).replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}
function saveJson(filepath, data) {
  fs.writeFileSync(filepath, `${JSON.stringify(data, null, 2)}
`, "utf-8");
}
function deepMerge(target, source) {
  if (target === undefined || target === null) {
    return source;
  }
  if (source === undefined || source === null) {
    return target;
  }
  if (typeof target !== "object" || typeof source !== "object") {
    return target;
  }
  if (Array.isArray(target)) {
    return target;
  }
  if (Array.isArray(source)) {
    return target;
  }
  const result = {
    ...target
  };
  const sourceObj = source;
  for (const key of Object.keys(sourceObj)) {
    if (!(key in result)) {
      result[key] = sourceObj[key];
    } else {
      const targetVal = result[key];
      const sourceVal = sourceObj[key];
      if (typeof targetVal === "object" && targetVal !== null && typeof sourceVal === "object" && sourceVal !== null && !Array.isArray(targetVal) && !Array.isArray(sourceVal)) {
        result[key] = deepMerge(targetVal, sourceVal);
      }
    }
  }
  return result;
}
function collectAddedFields(target, source, prefix = "") {
  const added = [];
  if (typeof target !== "object" || target === null || typeof source !== "object" || source === null) {
    return added;
  }
  const targetObj = target;
  const sourceObj = source;
  for (const key of Object.keys(sourceObj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (!(key in targetObj)) {
      added.push(currentPath);
    } else if (typeof targetObj[key] === "object" && targetObj[key] !== null && typeof sourceObj[key] === "object" && sourceObj[key] !== null && !Array.isArray(targetObj[key]) && !Array.isArray(sourceObj[key])) {
      added.push(...collectAddedFields(targetObj[key], sourceObj[key], currentPath));
    }
  }
  return added;
}
async function install() {
  console.log(`\uD83D\uDC1D Installing OpenCode Swarm...
`);
  ensureDir(CONFIG_DIR);
  ensureDir(PROMPTS_DIR);
  let opencodeConfig = loadJson(OPENCODE_CONFIG_PATH);
  if (!opencodeConfig) {
    opencodeConfig = {};
  }
  if (!opencodeConfig.plugin) {
    opencodeConfig.plugin = [];
  }
  const pluginName = "opencode-swarm";
  opencodeConfig.plugin = opencodeConfig.plugin.filter((p) => p !== pluginName && !p.startsWith(`${pluginName}@`));
  opencodeConfig.plugin.push(pluginName);
  if (!opencodeConfig.agent) {
    opencodeConfig.agent = {};
  }
  opencodeConfig.agent.explore = { disable: true };
  opencodeConfig.agent.general = { disable: true };
  saveJson(OPENCODE_CONFIG_PATH, opencodeConfig);
  console.log("\u2713 Added opencode-swarm to OpenCode plugins");
  console.log("\u2713 Disabled default OpenCode agents (explore, general)");
  if (!fs.existsSync(PLUGIN_CONFIG_PATH)) {
    saveJson(PLUGIN_CONFIG_PATH, DEFAULT_PLUGIN_CONFIG);
    console.log("\u2713 Created default plugin config at:", PLUGIN_CONFIG_PATH);
  } else {
    const existingConfig = loadJson(PLUGIN_CONFIG_PATH);
    if (existingConfig) {
      const addedFields = collectAddedFields(existingConfig, DEFAULT_PLUGIN_CONFIG);
      const mergedConfig = deepMerge(existingConfig, DEFAULT_PLUGIN_CONFIG);
      saveJson(PLUGIN_CONFIG_PATH, mergedConfig);
      if (addedFields.length > 0) {
        console.log("\u2713 Merged missing fields into plugin config:", addedFields.join(", "));
      } else {
        console.log("\u2713 Plugin config is up to date");
      }
    } else {
      console.log("\u26A0 Existing config is malformed, creating fresh config at:", PLUGIN_CONFIG_PATH);
      saveJson(PLUGIN_CONFIG_PATH, DEFAULT_PLUGIN_CONFIG);
    }
  }
  console.log(`
\uD83D\uDCC1 Configuration files:`);
  console.log(`   OpenCode config: ${OPENCODE_CONFIG_PATH}`);
  console.log(`   Plugin config:   ${PLUGIN_CONFIG_PATH}`);
  console.log(`   Custom prompts:  ${PROMPTS_DIR}/`);
  console.log(`
\uD83D\uDE80 Installation complete!`);
  console.log(`
Next steps:`);
  console.log("1. Edit the plugin config to customize models and settings");
  console.log('2. Run "opencode" to start using the swarm');
  console.log("3. The Architect agent will orchestrate your requests");
  console.log(`
\uD83D\uDCD6 SME agent:`);
  console.log("   The SME agent supports any domain \u2014 the Architect determines");
  console.log("   what expertise is needed and requests it dynamically.");
  return 0;
}
async function uninstall() {
  try {
    console.log(`\uD83D\uDC1D Uninstalling OpenCode Swarm...
`);
    const opencodeConfig = loadJson(OPENCODE_CONFIG_PATH);
    if (!opencodeConfig) {
      if (fs.existsSync(OPENCODE_CONFIG_PATH)) {
        console.log(`\u2717 Could not parse opencode config at: ${OPENCODE_CONFIG_PATH}`);
        return 1;
      } else {
        console.log(`\u26A0 No opencode config found at: ${OPENCODE_CONFIG_PATH}`);
        console.log("Nothing to uninstall.");
        return 0;
      }
    }
    if (!opencodeConfig.plugin || opencodeConfig.plugin.length === 0) {
      console.log("\u26A0 opencode-swarm is not installed (no plugins configured).");
      return 0;
    }
    const pluginName = "opencode-swarm";
    const filteredPlugins = opencodeConfig.plugin.filter((p) => p !== pluginName && !p.startsWith(`${pluginName}@`));
    if (filteredPlugins.length === opencodeConfig.plugin.length) {
      console.log("\u26A0 opencode-swarm is not installed.");
      return 0;
    }
    opencodeConfig.plugin = filteredPlugins;
    if (opencodeConfig.agent) {
      delete opencodeConfig.agent.explore;
      delete opencodeConfig.agent.general;
      if (Object.keys(opencodeConfig.agent).length === 0) {
        delete opencodeConfig.agent;
      }
    }
    saveJson(OPENCODE_CONFIG_PATH, opencodeConfig);
    console.log("\u2713 Removed opencode-swarm from OpenCode plugins");
    console.log("\u2713 Re-enabled default OpenCode agents (explore, general)");
    if (process.argv.includes("--clean")) {
      let cleaned = false;
      if (fs.existsSync(PLUGIN_CONFIG_PATH)) {
        fs.unlinkSync(PLUGIN_CONFIG_PATH);
        console.log(`\u2713 Removed plugin config: ${PLUGIN_CONFIG_PATH}`);
        cleaned = true;
      }
      if (fs.existsSync(PROMPTS_DIR)) {
        fs.rmSync(PROMPTS_DIR, { recursive: true });
        console.log(`\u2713 Removed custom prompts: ${PROMPTS_DIR}`);
        cleaned = true;
      }
      if (!cleaned) {
        console.log("\u2713 No config files to clean up");
      }
    }
    console.log(`
\u2705 Uninstall complete!`);
    return 0;
  } catch (error) {
    console.log("\u2717 Uninstall failed: " + (error instanceof Error ? error.message : String(error)));
    return 1;
  }
}
function printHelp() {
  console.log(`
opencode-swarm - Architect-centric agentic swarm plugin for OpenCode

Usage: bunx opencode-swarm [command] [OPTIONS]

Commands:
  install     Install and configure the plugin (default)
  uninstall   Remove the plugin from OpenCode config

Options:
  --clean     Also remove config files and custom prompts (with uninstall)
  -h, --help  Show this help message

Configuration:
  Edit ~/.config/opencode/opencode-swarm.json to customize:
  - Model assignments per agent or category
  - Preset configurations (remote, hybrid)
  - Local inference endpoints (GPU/NPU URLs)
  - Max iterations and other settings

Custom Prompts:
  Place custom prompts in ~/.config/opencode/opencode-swarm/
  - {agent}.md       - Replace default prompt
  - {agent}_append.md - Append to default prompt

Examples:
  bunx opencode-swarm install
  bunx opencode-swarm uninstall
  bunx opencode-swarm uninstall --clean
  bunx opencode-swarm --help
`);
}
async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }
  const command = args[0] || "install";
  if (command === "install") {
    const exitCode = await install();
    process.exit(exitCode);
  } else if (command === "uninstall") {
    const exitCode = await uninstall();
    process.exit(exitCode);
  } else {
    console.error(`Unknown command: ${command}`);
    console.error("Run with --help for usage information");
    process.exit(1);
  }
}
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
