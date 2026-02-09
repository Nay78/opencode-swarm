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
 * Represents per-session state for guardrail tracking
 */
export interface AgentSessionState {
	/** Which agent this session belongs to */
	agentName: string;

	/** Date.now() when session started */
	startTime: number;

	/** Total tool calls in this session */
	toolCallCount: number;

	/** Consecutive errors (reset on success) */
	consecutiveErrors: number;

	/** Circular buffer of recent tool calls, max 20 entries */
	recentToolCalls: Array<{ tool: string; argsHash: number; timestamp: number }>;

	/** Whether a soft warning has been issued */
	warningIssued: boolean;

	/** Whether a hard limit has been triggered */
	hardLimitHit: boolean;
}

/**
 * Singleton state object for sharing data across hooks
 */
export const swarmState = {
	/** Active tool calls — keyed by callID for before→after correlation */
	activeToolCalls: new Map<string, ToolCallEntry>(),

	/** Aggregated tool usage stats — keyed by tool name */
	toolAggregates: new Map<string, ToolAggregate>(),

	/** Active agent per session — keyed by sessionID, updated by chat.message hook */
	activeAgent: new Map<string, string>(),

	/** Delegation chains per session — keyed by sessionID */
	delegationChains: new Map<string, DelegationEntry[]>(),

	/** Number of events since last flush */
	pendingEvents: 0,

	/** Per-session guardrail state — keyed by sessionID */
	agentSessions: new Map<string, AgentSessionState>(),
};

/**
 * Reset all state to initial values - useful for testing
 */
export function resetSwarmState(): void {
	swarmState.activeToolCalls.clear();
	swarmState.toolAggregates.clear();
	swarmState.activeAgent.clear();
	swarmState.delegationChains.clear();
	swarmState.pendingEvents = 0;
	swarmState.agentSessions.clear();
}

/**
 * Start a new agent session with initialized guardrail state.
 * Also removes any stale sessions older than staleDurationMs.
 * @param sessionId - The session identifier
 * @param agentName - The agent associated with this session
 * @param staleDurationMs - Age threshold for stale session eviction (default: 60 min)
 */
export function startAgentSession(
	sessionId: string,
	agentName: string,
	staleDurationMs = 3600000,
): void {
	const now = Date.now();

	// Evict stale sessions (collect first to avoid delete-during-iteration)
	const staleIds: string[] = [];
	for (const [id, session] of swarmState.agentSessions) {
		if (now - session.startTime > staleDurationMs) {
			staleIds.push(id);
		}
	}
	for (const id of staleIds) {
		swarmState.agentSessions.delete(id);
	}

	// Create new session state
	const sessionState: AgentSessionState = {
		agentName,
		startTime: now,
		toolCallCount: 0,
		consecutiveErrors: 0,
		recentToolCalls: [],
		warningIssued: false,
		hardLimitHit: false,
	};

	swarmState.agentSessions.set(sessionId, sessionState);
}

/**
 * End an agent session by removing it from the state.
 * @param sessionId - The session identifier to remove
 */
export function endAgentSession(sessionId: string): void {
	swarmState.agentSessions.delete(sessionId);
}

/**
 * Get an agent session state by session ID.
 * @param sessionId - The session identifier
 * @returns The AgentSessionState or undefined if not found
 */
export function getAgentSession(
	sessionId: string,
): AgentSessionState | undefined {
	return swarmState.agentSessions.get(sessionId);
}
