#!/usr/bin/env bun
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { DEFAULT_PLUGIN_CONFIG } from '../config/defaults';

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

/**
 * Deep merge two objects. Keeps existing values, adds missing fields from source.
 * For arrays: prefers target if present, otherwise uses source
 * For primitives: keeps target value if present
 * For nested objects: recurses
 */
function deepMerge(target: unknown, source: unknown): unknown {
	// If target is undefined/null, use source
	if (target === undefined || target === null) {
		return source;
	}

	// If source is undefined/null, keep target
	if (source === undefined || source === null) {
		return target;
	}

	// If either is not an object, keep target
	if (typeof target !== 'object' || typeof source !== 'object') {
		return target;
	}

	// Handle arrays: keep target array if it exists
	if (Array.isArray(target)) {
		return target;
	}
	if (Array.isArray(source)) {
		return target;
	}

	// Both are objects, merge recursively
	const result: Record<string, unknown> = {
		...(target as Record<string, unknown>),
	};
	const sourceObj = source as Record<string, unknown>;

	for (const key of Object.keys(sourceObj)) {
		if (!(key in result)) {
			// Key doesn't exist in target, add from source
			result[key] = sourceObj[key];
		} else {
			// Key exists in both, recurse for objects
			const targetVal = result[key];
			const sourceVal = sourceObj[key];
			if (
				typeof targetVal === 'object' &&
				targetVal !== null &&
				typeof sourceVal === 'object' &&
				sourceVal !== null &&
				!Array.isArray(targetVal) &&
				!Array.isArray(sourceVal)
			) {
				result[key] = deepMerge(targetVal, sourceVal);
			}
			// Otherwise keep target value (primitives, arrays)
		}
	}

	return result;
}

/**
 * Collect paths of all fields that were added (exist in source but not target)
 */
function collectAddedFields(
	target: unknown,
	source: unknown,
	prefix = '',
): string[] {
	const added: string[] = [];

	if (
		typeof target !== 'object' ||
		target === null ||
		typeof source !== 'object' ||
		source === null
	) {
		return added;
	}

	const targetObj = target as Record<string, unknown>;
	const sourceObj = source as Record<string, unknown>;

	for (const key of Object.keys(sourceObj)) {
		const currentPath = prefix ? `${prefix}.${key}` : key;
		if (!(key in targetObj)) {
			added.push(currentPath);
		} else if (
			typeof targetObj[key] === 'object' &&
			targetObj[key] !== null &&
			typeof sourceObj[key] === 'object' &&
			sourceObj[key] !== null &&
			!Array.isArray(targetObj[key]) &&
			!Array.isArray(sourceObj[key])
		) {
			// Recurse into nested objects
			added.push(
				...collectAddedFields(targetObj[key], sourceObj[key], currentPath),
			);
		}
	}

	return added;
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

	// Create or merge plugin config
	if (!fs.existsSync(PLUGIN_CONFIG_PATH)) {
		saveJson(PLUGIN_CONFIG_PATH, DEFAULT_PLUGIN_CONFIG);
		console.log('✓ Created default plugin config at:', PLUGIN_CONFIG_PATH);
	} else {
		// Load existing config and merge with defaults
		const existingConfig =
			loadJson<Record<string, unknown>>(PLUGIN_CONFIG_PATH);
		if (existingConfig) {
			const addedFields = collectAddedFields(
				existingConfig,
				DEFAULT_PLUGIN_CONFIG,
			);
			const mergedConfig = deepMerge(
				existingConfig,
				DEFAULT_PLUGIN_CONFIG,
			) as Record<string, unknown>;
			saveJson(PLUGIN_CONFIG_PATH, mergedConfig);

			if (addedFields.length > 0) {
				console.log(
					'✓ Merged missing fields into plugin config:',
					addedFields.join(', '),
				);
			} else {
				console.log('✓ Plugin config is up to date');
			}
		} else {
			// Config exists but couldn't be parsed, create fresh
			console.log(
				'⚠ Existing config is malformed, creating fresh config at:',
				PLUGIN_CONFIG_PATH,
			);
			saveJson(PLUGIN_CONFIG_PATH, DEFAULT_PLUGIN_CONFIG);
		}
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
