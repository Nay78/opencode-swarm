import type { Plugin } from '@opencode-ai/plugin';
import { createAgents, getAgentConfigs } from './agents';
import { createSwarmCommandHandler } from './commands';
import { loadPluginConfig } from './config';
import {
	composeHandlers,
	createAgentActivityHooks,
	createCompactionCustomizerHook,
	createContextBudgetHandler,
	createDelegationTrackerHook,
	createPipelineTrackerHook,
	createSystemEnhancerHook,
	safeHook,
} from './hooks';
import { detect_domains, extract_code_blocks, gitingest } from './tools';
import { log } from './utils';

/**
 * OpenCode Swarm Plugin
 *
 * Architect-centric agentic swarm for code generation.
 * Hub-and-spoke architecture with:
 * - Architect as central orchestrator
 * - Dynamic SME consultation (serial)
 * - Code generation with QA review
 * - Iterative refinement with triage
 */
const OpenCodeSwarm: Plugin = async (ctx) => {
	const config = loadPluginConfig(ctx.directory);
	const agents = getAgentConfigs(config);
	const agentDefinitions = createAgents(config);
	const pipelineHook = createPipelineTrackerHook(config);
	const systemEnhancerHook = createSystemEnhancerHook(config, ctx.directory);
	const compactionHook = createCompactionCustomizerHook(config, ctx.directory);
	const contextBudgetHandler = createContextBudgetHandler(config);
	const commandHandler = createSwarmCommandHandler(
		ctx.directory,
		Object.fromEntries(agentDefinitions.map((agent) => [agent.name, agent])),
	);
	const activityHooks = createAgentActivityHooks(config, ctx.directory);
	const delegationHandler = createDelegationTrackerHook(config);

	log('Plugin initialized', {
		directory: ctx.directory,
		maxIterations: config.max_iterations,
		agentCount: Object.keys(agents).length,
		agentNames: Object.keys(agents),
		hooks: {
			pipeline: !!pipelineHook['experimental.chat.messages.transform'],
			systemEnhancer:
				!!systemEnhancerHook['experimental.chat.system.transform'],
			compaction: !!compactionHook['experimental.session.compacting'],
			contextBudget: !!contextBudgetHandler,
			commands: true,
			agentActivity: config.hooks?.agent_activity !== false,
			delegationTracker: config.hooks?.delegation_tracker === true,
		},
	});

	return {
		name: 'opencode-swarm',

		// Register all agents
		agent: agents,

		// Register tools
		tool: {
			detect_domains,
			extract_code_blocks,
			gitingest,
		},

		// Configure OpenCode - merge agents into config
		config: async (opencodeConfig: Record<string, unknown>) => {
			// Merge agent configs (don't override default_agent)
			if (!opencodeConfig.agent) {
				opencodeConfig.agent = { ...agents };
			} else {
				Object.assign(opencodeConfig.agent, agents);
			}

			// Register /swarm command
			opencodeConfig.command = {
				...((opencodeConfig.command as Record<string, unknown>) || {}),
				swarm: {
					template: '{{arguments}}',
					description: 'Swarm management commands',
				},
			};

			log('Config applied', {
				agents: Object.keys(agents),
				commands: ['swarm'],
			});
		},

		// Inject phase reminders before API calls
		'experimental.chat.messages.transform': composeHandlers(
			...[
				pipelineHook['experimental.chat.messages.transform'],
				contextBudgetHandler,
			].filter((fn): fn is NonNullable<typeof fn> => Boolean(fn)),
			// biome-ignore lint/suspicious/noExplicitAny: Plugin API requires generic hook wrappers
		) as any,

		// Inject system prompt enhancements
		'experimental.chat.system.transform': systemEnhancerHook[
			'experimental.chat.system.transform'
			// biome-ignore lint/suspicious/noExplicitAny: Plugin API requires generic hook wrappers
		] as any,

		// Handle session compaction
		'experimental.session.compacting': compactionHook[
			'experimental.session.compacting'
			// biome-ignore lint/suspicious/noExplicitAny: Plugin API requires generic hook wrappers
		] as any,

		// Handle /swarm commands
		// biome-ignore lint/suspicious/noExplicitAny: Plugin API requires generic hook wrappers
		'command.execute.before': safeHook(commandHandler) as any,

		// Track tool usage
		// biome-ignore lint/suspicious/noExplicitAny: Plugin API requires generic hook wrappers
		'tool.execute.before': safeHook(activityHooks.toolBefore) as any,
		// biome-ignore lint/suspicious/noExplicitAny: Plugin API requires generic hook wrappers
		'tool.execute.after': safeHook(activityHooks.toolAfter) as any,

		// Track agent delegations and active agent
		// biome-ignore lint/suspicious/noExplicitAny: Plugin API requires generic hook wrappers
		'chat.message': safeHook(delegationHandler) as any,
	};
};

export default OpenCodeSwarm;

export type { AgentDefinition } from './agents';
// Export types for consumers
export type {
	AgentName,
	PipelineAgentName,
	PluginConfig,
	QAAgentName,
} from './config';
