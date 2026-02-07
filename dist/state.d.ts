/**
 * Shared state module for OpenCode Swarm plugin.
 * Provides a module-scoped singleton for cross-hook state sharing.
 *
 * This module is used by multiple hooks (tool.execute.before, tool.execute.after,
 * chat.message, system-enhancer) to share state like active agents, tool call tracking,
 * and delegation chains.
 */
/**
 * Represents a single tool call entry for tracking purposes
 */
export interface ToolCallEntry {
    tool: string;
    sessionID: string;
    callID: string;
    startTime: number;
}
/**
 * Aggregated statistics for a specific tool
 */
export interface ToolAggregate {
    tool: string;
    count: number;
    successCount: number;
    failureCount: number;
    totalDuration: number;
}
/**
 * Represents a delegation from one agent to another
 */
export interface DelegationEntry {
    from: string;
    to: string;
    timestamp: number;
}
/**
 * Singleton state object for sharing data across hooks
 */
export declare const swarmState: {
    /** Active tool calls — keyed by callID for before→after correlation */
    activeToolCalls: Map<string, ToolCallEntry>;
    /** Aggregated tool usage stats — keyed by tool name */
    toolAggregates: Map<string, ToolAggregate>;
    /** Active agent per session — keyed by sessionID, updated by chat.message hook */
    activeAgent: Map<string, string>;
    /** Delegation chains per session — keyed by sessionID */
    delegationChains: Map<string, DelegationEntry[]>;
    /** Number of events since last flush */
    pendingEvents: number;
};
/**
 * Reset all state to initial values - useful for testing
 */
export declare function resetSwarmState(): void;
