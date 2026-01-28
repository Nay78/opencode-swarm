import { z } from 'zod';

// Agent override configuration
export const AgentOverrideConfigSchema = z.object({
	model: z.string().optional(),
	temperature: z.number().min(0).max(2).optional(),
	disabled: z.boolean().optional(),
});

export type AgentOverrideConfig = z.infer<typeof AgentOverrideConfigSchema>;

// Main plugin configuration
export const PluginConfigSchema = z.object({
	// Per-agent overrides (including _sme and _qa category defaults)
	agents: z.record(z.string(), AgentOverrideConfigSchema).optional(),

	// Pipeline settings
	max_iterations: z.number().min(1).max(10).default(5),

	// SME behavior
	multi_domain_sme: z.boolean().default(true), // Single SME call with all domains vs separate calls

	// Feature flags
	auto_detect_domains: z.boolean().default(true),
	inject_phase_reminders: z.boolean().default(false), // Disabled by default
});

export type PluginConfig = z.infer<typeof PluginConfigSchema>;

// Re-export types from constants
export type {
	AgentName,
	SMEAgentName,
	QAAgentName,
	PipelineAgentName,
} from './constants';
