import type { AgentDefinition } from '../agents';
export declare function handleStatusCommand(directory: string, agents: Record<string, AgentDefinition>): Promise<string>;
