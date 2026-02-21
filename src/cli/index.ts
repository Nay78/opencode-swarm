#!/usr/bin/env bun
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const CONFIG_DIR = path.join(
	process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
	'opencode',
);

const OPENCODE_CONFIG_PATH = path.join(CONFIG_DIR, 'opencode.json');
const PLUGIN_CONFIG_PATH = path.join(CONFIG_DIR, 'opencode-swarm.json');
const PROMPTS_DIR = path.join(CONFIG_DIR, 'opencode-swarm');

interface OpenCodeConfig {
	plugin?: string[];
	agent?: Record<string, unknown>;
	[key: string]: unknown;
}

function ensureDir(dir: string): void {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function loadJson<T>(filepath: string): T | null {
	try {
		const content = fs.readFileSync(filepath, 'utf-8');
		// Strip comments for JSONC support
		const stripped = content
			.replace(
				/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
				(match, comment) => (comment ? '' : match),
			)
			.replace(/,(\s*[}\]])/g, '$1');
		return JSON.parse(stripped) as T;
	} catch {
		return null;
	}
}

function saveJson(filepath: string, data: unknown): void {
	fs.writeFileSync(filepath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
}

async function install(): Promise<number> {
	console.log('🐝 Installing OpenCode Swarm...\n');

	// Ensure config directory exists
	ensureDir(CONFIG_DIR);
	ensureDir(PROMPTS_DIR);

	// Load or create OpenCode config
	let opencodeConfig = loadJson<OpenCodeConfig>(OPENCODE_CONFIG_PATH);
	if (!opencodeConfig) {
		opencodeConfig = {};
	}

	// Add plugin to OpenCode config (note: 'plugin' not 'plugins')
	if (!opencodeConfig.plugin) {
		opencodeConfig.plugin = [];
	}

	const pluginName = 'opencode-swarm';

	// Remove any existing entries for this plugin
	opencodeConfig.plugin = opencodeConfig.plugin.filter(
		(p) => p !== pluginName && !p.startsWith(`${pluginName}@`),
	);

	// Add fresh entry
	opencodeConfig.plugin.push(pluginName);

	// Disable OpenCode's default agents to avoid conflicts
	if (!opencodeConfig.agent) {
		opencodeConfig.agent = {};
	}
	opencodeConfig.agent.explore = { disable: true };
	opencodeConfig.agent.general = { disable: true };

	saveJson(OPENCODE_CONFIG_PATH, opencodeConfig);
	console.log('✓ Added opencode-swarm to OpenCode plugins');
	console.log('✓ Disabled default OpenCode agents (explore, general)');

	// Create default plugin config if not exists
	if (!fs.existsSync(PLUGIN_CONFIG_PATH)) {
		const defaultConfig = {
			agents: {
				architect: { model: 'anthropic/claude-sonnet-4.5' },
				coder: { model: 'openai/gpt-5.2-codex' },
				sme: { model: 'google/gemini-3-flash' },
				reviewer: { model: 'google/gemini-3-flash' },
				test_engineer: { model: 'google/gemini-3-flash' },
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
				delegation_max_chars: 4000,
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
						phase: 1.0,
						current_task: 2.0,
						blocked_task: 1.5,
						recent_failure: 2.5,
						recent_success: 0.5,
						evidence_presence: 1.0,
						decision_recency: 1.5,
						dependency_proximity: 1.0,
					},
					decision_decay: {
						mode: 'exponential',
						half_life_hours: 24,
					},
					token_ratios: {
						prose: 0.25,
						code: 0.4,
						markdown: 0.3,
						json: 0.35,
					},
				},
			},
			guardrails: {
				enabled: true,
				max_tool_calls: 200,
				max_duration_minutes: 30,
				max_repetitions: 10,
				max_consecutive_errors: 5,
				warning_threshold: 0.75,
				idle_timeout_minutes: 60,
				profiles: {},
			},
			evidence: {
				enabled: true,
				max_age_days: 90,
				max_bundles: 1000,
				auto_archive: false,
			},
			summaries: {
				enabled: true,
				threshold_bytes: 20480,
				max_summary_chars: 1000,
				max_stored_bytes: 10485760,
				retention_days: 7,
			},
			review_passes: {
				always_security_review: false,
				security_globs: [
					'**/auth/**',
					'**/api/**',
					'**/crypto/**',
					'**/security/**',
					'**/middleware/**',
					'**/session/**',
					'**/token/**',
				],
			},
			integration_analysis: { enabled: true },
			docs: {
				enabled: true,
				doc_patterns: [
					'README.md',
					'CONTRIBUTING.md',
					'docs/**/*.md',
					'docs/**/*.rst',
					'**/CHANGELOG.md',
				],
			},
			ui_review: { enabled: false },
			compaction_advisory: {
				enabled: true,
				thresholds: [50, 75, 100, 125, 150],
				message:
					// biome-ignore lint/suspicious/noTemplateCurlyInString: Intentional placeholder for runtime interpolation
					'[SWARM HINT] Session has ${totalToolCalls} tool calls. Consider compacting at next phase boundary to maintain context quality.',
			},
			lint: {
				enabled: true,
				mode: 'check',
				linter: 'auto',
				patterns: [
					'**/*.{ts,tsx,js,jsx,mjs,cjs}',
					'**/biome.json',
					'**/biome.jsonc',
				],
				exclude: [
					'**/node_modules/**',
					'**/dist/**',
					'**/.git/**',
					'**/coverage/**',
					'**/*.min.js',
				],
			},
			secretscan: {
				enabled: true,
				patterns: [
					'**/*.{env,properties,yml,yaml,json,js,ts}',
					'**/.env*',
					'**/secrets/**',
					'**/credentials/**',
					'**/config/**/*.ts',
					'**/config/**/*.js',
				],
				exclude: [
					'**/node_modules/**',
					'**/dist/**',
					'**/.git/**',
					'**/coverage/**',
					'**/test/**',
					'**/tests/**',
					'**/__tests__/**',
					'**/*.test.ts',
					'**/*.test.js',
					'**/*.spec.ts',
					'**/*.spec.js',
				],
				extensions: [
					'.env',
					'.properties',
					'.yml',
					'.yaml',
					'.json',
					'.js',
					'.ts',
					'.py',
					'.rb',
					'.go',
					'.java',
					'.cs',
					'.php',
				],
			},
			checkpoint: {
				enabled: true,
				auto_checkpoint_threshold: 3,
			},
		};
		saveJson(PLUGIN_CONFIG_PATH, defaultConfig);
		console.log('✓ Created default plugin config at:', PLUGIN_CONFIG_PATH);
	} else {
		console.log('✓ Plugin config already exists at:', PLUGIN_CONFIG_PATH);
	}

	console.log('\n📁 Configuration files:');
	console.log(`   OpenCode config: ${OPENCODE_CONFIG_PATH}`);
	console.log(`   Plugin config:   ${PLUGIN_CONFIG_PATH}`);
	console.log(`   Custom prompts:  ${PROMPTS_DIR}/`);

	console.log('\n🚀 Installation complete!');
	console.log('\nNext steps:');
	console.log('1. Edit the plugin config to customize models and settings');
	console.log('2. Run "opencode" to start using the swarm');
	console.log('3. The Architect agent will orchestrate your requests');

	console.log('\n📖 SME agent:');
	console.log(
		'   The SME agent supports any domain — the Architect determines',
	);
	console.log('   what expertise is needed and requests it dynamically.');

	return 0;
}

async function uninstall(): Promise<number> {
	try {
		console.log('🐝 Uninstalling OpenCode Swarm...\n');

		// Load opencode config
		const opencodeConfig = loadJson<OpenCodeConfig>(OPENCODE_CONFIG_PATH);

		// If config is null
		if (!opencodeConfig) {
			// Check if the file exists
			if (fs.existsSync(OPENCODE_CONFIG_PATH)) {
				// It's malformed JSON
				console.log(
					`✗ Could not parse opencode config at: ${OPENCODE_CONFIG_PATH}`,
				);
				return 1;
			} else {
				// File doesn't exist
				console.log(`⚠ No opencode config found at: ${OPENCODE_CONFIG_PATH}`);
				console.log('Nothing to uninstall.');
				return 0;
			}
		}

		// If config has no plugin array or it's empty
		if (!opencodeConfig.plugin || opencodeConfig.plugin.length === 0) {
			console.log('⚠ opencode-swarm is not installed (no plugins configured).');
			return 0;
		}

		// Filter out 'opencode-swarm' and entries starting with 'opencode-swarm@'
		const pluginName = 'opencode-swarm';
		const filteredPlugins = opencodeConfig.plugin.filter(
			(p) => p !== pluginName && !p.startsWith(`${pluginName}@`),
		);

		// If array length didn't change (plugin wasn't found)
		if (filteredPlugins.length === opencodeConfig.plugin.length) {
			console.log('⚠ opencode-swarm is not installed.');
			return 0;
		}

		// Update config and save
		opencodeConfig.plugin = filteredPlugins;

		// Remove the disabled agent overrides
		if (opencodeConfig.agent) {
			delete opencodeConfig.agent.explore;
			delete opencodeConfig.agent.general;

			// If agent is now empty, delete it too
			if (Object.keys(opencodeConfig.agent).length === 0) {
				delete opencodeConfig.agent;
			}
		}

		// Save the updated config
		saveJson(OPENCODE_CONFIG_PATH, opencodeConfig);
		console.log('✓ Removed opencode-swarm from OpenCode plugins');
		console.log('✓ Re-enabled default OpenCode agents (explore, general)');

		// Check for --clean flag
		if (process.argv.includes('--clean')) {
			let cleaned = false;

			// If PLUGIN_CONFIG_PATH exists: delete it
			if (fs.existsSync(PLUGIN_CONFIG_PATH)) {
				fs.unlinkSync(PLUGIN_CONFIG_PATH);
				console.log(`✓ Removed plugin config: ${PLUGIN_CONFIG_PATH}`);
				cleaned = true;
			}

			// If PROMPTS_DIR exists: delete it recursively
			if (fs.existsSync(PROMPTS_DIR)) {
				fs.rmSync(PROMPTS_DIR, { recursive: true });
				console.log(`✓ Removed custom prompts: ${PROMPTS_DIR}`);
				cleaned = true;
			}

			// If neither exists
			if (!cleaned) {
				console.log('✓ No config files to clean up');
			}
		}

		console.log('\n✅ Uninstall complete!');
		return 0;
	} catch (error) {
		console.log(
			'✗ Uninstall failed: ' +
				(error instanceof Error ? error.message : String(error)),
		);
		return 1;
	}
}

function printHelp(): void {
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

async function main(): Promise<void> {
	const args = process.argv.slice(2);

	if (args.includes('-h') || args.includes('--help')) {
		printHelp();
		process.exit(0);
	}

	// Default command is install
	const command = args[0] || 'install';

	if (command === 'install') {
		const exitCode = await install();
		process.exit(exitCode);
	} else if (command === 'uninstall') {
		const exitCode = await uninstall();
		process.exit(exitCode);
	} else {
		console.error(`Unknown command: ${command}`);
		console.error('Run with --help for usage information');
		process.exit(1);
	}
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
