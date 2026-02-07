import { z } from 'zod';

// Agent override configuration
export const AgentOverrideConfigSchema = z.object({
	model: z.string().optional(),
	temperature: z.number().min(0).max(2).optional(),
	disabled: z.boolean().optional(),
});

export type AgentOverrideConfig = z.infer<typeof AgentOverrideConfigSchema>;

// Swarm configuration (a complete set of agent overrides)
export const SwarmConfigSchema = z.object({
	name: z.string().optional(), // Display name (e.g., "Cloud", "Local")
	agents: z.record(z.string(), AgentOverrideConfigSchema).optional(),
});

export type SwarmConfig = z.infer<typeof SwarmConfigSchema>;

// Hook feature flags
export const HooksConfigSchema = z.object({
	system_enhancer: z.boolean().default(true),
	compaction: z.boolean().default(true),
	agent_activity: z.boolean().default(true),
	delegation_tracker: z.boolean().default(false),
	agent_awareness_max_chars: z.number().min(50).max(2000).default(300),
});

export type HooksConfig = z.infer<typeof HooksConfigSchema>;

// Context budget configuration
export const ContextBudgetConfigSchema = z.object({
	enabled: z.boolean().default(true),
	warn_threshold: z.number().min(0).max(1).default(0.7),
	critical_threshold: z.number().min(0).max(1).default(0.9),
	model_limits: z
		.record(z.string(), z.number().min(1000))
		.default({ default: 128000 }),
});

export type ContextBudgetConfig = z.infer<typeof ContextBudgetConfigSchema>;

// Main plugin configuration
export const PluginConfigSchema = z.object({
	// Legacy: Per-agent overrides (default swarm)
	agents: z.record(z.string(), AgentOverrideConfigSchema).optional(),

	// Multiple swarms support
	// Keys are swarm IDs (e.g., "cloud", "local", "fast")
	// First swarm or one named "default" becomes the primary architect
	swarms: z.record(z.string(), SwarmConfigSchema).optional(),

	// Pipeline settings
	max_iterations: z.number().min(1).max(10).default(5),

	// QA workflow settings
	qa_retry_limit: z.number().min(1).max(10).default(3),

	// Feature flags
	inject_phase_reminders: z.boolean().default(true),

	// Hook configuration
	hooks: HooksConfigSchema.optional(),

	// Context budget configuration
	context_budget: ContextBudgetConfigSchema.optional(),
});

export type PluginConfig = z.infer<typeof PluginConfigSchema>;

// Re-export types from constants
export type {
	AgentName,
	PipelineAgentName,
	QAAgentName,
} from './constants';
