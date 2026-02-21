/**
 * Default plugin configuration - Single Source of Truth
 *
 * This file contains the complete default configuration for the opencode-swarm plugin.
 * Any changes to default values should be made here and will automatically
 * propagate to the init script and other consumers.
 */

import type { PluginConfig } from './schema';

/**
 * Complete default plugin configuration
 */
export const DEFAULT_PLUGIN_CONFIG: PluginConfig = {
	// Agent model assignments
	agents: {
		architect: { model: 'anthropic/claude-sonnet-4.5' },
		coder: { model: 'openai/gpt-5.2-codex' },
		critic: { model: 'google/gemini-3-flash' },
		docs: { model: 'google/gemini-3-flash' },
		explorer: { model: 'google/gemini-3-flash' },
		reviewer: { model: 'google/gemini-3-flash' },
		sme: { model: 'google/gemini-3-flash' },
		test_engineer: { model: 'google/gemini-3-flash' },
	},

	// Pipeline settings
	max_iterations: 5,

	// QA workflow settings
	qa_retry_limit: 3,

	// Feature flags
	inject_phase_reminders: true,

	// Hook configuration
	hooks: {
		system_enhancer: true,
		compaction: true,
		agent_activity: true,
		delegation_tracker: false,
		agent_awareness_max_chars: 300,
		delegation_gate: true,
		delegation_max_chars: 4000,
	},

	// Context budget configuration
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

	// Guardrails configuration
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

	// Evidence configuration
	evidence: {
		enabled: true,
		max_age_days: 90,
		max_bundles: 1000,
		auto_archive: false,
	},

	// Summary configuration
	summaries: {
		enabled: true,
		threshold_bytes: 20480,
		max_summary_chars: 1000,
		max_stored_bytes: 10485760,
		retention_days: 7,
	},

	// Review passes configuration
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

	// Integration analysis configuration
	integration_analysis: { enabled: true },

	// Documentation synthesizer configuration
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

	// UI/UX review configuration
	ui_review: { enabled: false },

	// Compaction advisory configuration
	compaction_advisory: {
		enabled: true,
		thresholds: [50, 75, 100, 125, 150],
		message:
			// biome-ignore lint/suspicious/noTemplateCurlyInString: Intentional placeholder for runtime interpolation
			'[SWARM HINT] Session has ${totalToolCalls} tool calls. Consider compacting at next phase boundary to maintain context quality.',
	},

	// Lint configuration
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

	// Secretscan configuration
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

	// Checkpoint configuration
	checkpoint: {
		enabled: true,
		auto_checkpoint_threshold: 3,
	},
};
