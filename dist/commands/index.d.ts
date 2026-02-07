import type { AgentDefinition } from '../agents';
export { handleAgentsCommand } from './agents';
export { handleConfigCommand } from './config';
export { handleHistoryCommand } from './history';
export { handlePlanCommand } from './plan';
export { handleStatusCommand } from './status';
/**
 * Creates a command.execute.before handler for /swarm commands.
 * Uses factory pattern to close over directory and agents.
 */
export declare function createSwarmCommandHandler(directory: string, agents: Record<string, AgentDefinition>): (input: {
    command: string;
    sessionID: string;
    arguments: string;
}, output: {
    parts: unknown[];
}) => Promise<void>;
