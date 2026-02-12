/**
 * Delegation Tracker Hook
 *
 * Tracks agent delegation by monitoring chat.message events with agent fields.
 * Updates the active agent map and optionally logs delegation chain entries.
 */

import type { PluginConfig } from '../config/schema';
import type { DelegationEntry } from '../state';
import { ensureAgentSession, swarmState } from '../state';

/**
 * Creates the chat.message hook for delegation tracking.
 */
export function createDelegationTrackerHook(
	config: PluginConfig,
): (
	input: { sessionID: string; agent?: string },
	output: Record<string, unknown>,
) => Promise<void> {
	return async (
		input: { sessionID: string; agent?: string },
		_output: Record<string, unknown>,
	): Promise<void> => {
		// If no agent is specified, only reset delegationActive on existing session
		// and return without updating activeAgent or creating a new session
		if (!input.agent || input.agent === '') {
			const session = swarmState.agentSessions.get(input.sessionID);
			if (session) {
				session.delegationActive = false;
			}
			return;
		}

		const agentName = input.agent;

		// Get the previous agent for this session
		const previousAgent = swarmState.activeAgent.get(input.sessionID);

		// Update the active agent
		swarmState.activeAgent.set(input.sessionID, agentName);

		// Ensure guardrail session exists with correct agent name
		// This prevents the race condition where tool.execute.before fires
		// before chat.message, causing sessions to be created with 'unknown'
		const session = ensureAgentSession(input.sessionID, agentName);
		session.delegationActive = true;

		// If delegation tracking is enabled and agent has changed, log the delegation
		if (
			config.hooks?.delegation_tracker === true &&
			previousAgent &&
			previousAgent !== agentName
		) {
			// Create a delegation entry
			const entry: DelegationEntry = {
				from: previousAgent,
				to: agentName,
				timestamp: Date.now(),
			};

			// Get or create the delegation chain for this session
			if (!swarmState.delegationChains.has(input.sessionID)) {
				swarmState.delegationChains.set(input.sessionID, []);
			}

			// Push the entry to the chain
			const chain = swarmState.delegationChains.get(input.sessionID);
			chain?.push(entry);

			// Increment pending events counter
			swarmState.pendingEvents++;
		}
	};
}
