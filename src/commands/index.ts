import type { AgentDefinition } from '../agents';
import { handleAgentsCommand } from './agents';
import { handlePlanCommand } from './plan';
import { handleStatusCommand } from './status';

// Re-export individual handlers
export { handleAgentsCommand } from './agents';
export { handlePlanCommand } from './plan';
export { handleStatusCommand } from './status';

const HELP_TEXT = [
	'## Swarm Commands',
	'',
	'- `/swarm status` — Show current swarm state',
	'- `/swarm plan [phase]` — Show plan (optionally filter by phase number)',
	'- `/swarm agents` — List registered agents',
].join('\n');

/**
 * Creates a command.execute.before handler for /swarm commands.
 * Uses factory pattern to close over directory and agents.
 */
export function createSwarmCommandHandler(
	directory: string,
	agents: Record<string, AgentDefinition>,
): (
	input: { command: string; sessionID: string; arguments: string },
	output: { parts: unknown[] },
) => Promise<void> {
	return async (input, output) => {
		// Ignore non-swarm commands
		if (input.command !== 'swarm') {
			return;
		}

		// Parse arguments
		const tokens = input.arguments.trim().split(/\s+/).filter(Boolean);
		const [subcommand, ...args] = tokens;

		let text: string;

		switch (subcommand) {
			case 'status':
				text = await handleStatusCommand(directory, agents);
				break;
			case 'plan':
				text = await handlePlanCommand(directory, args);
				break;
			case 'agents':
				text = handleAgentsCommand(agents);
				break;
			default:
				text = HELP_TEXT;
				break;
		}

		// Convert string result to Part[]
		output.parts = [
			{ type: 'text', text } as unknown as (typeof output.parts)[number],
		];
	};
}
