import { describe, it, expect, beforeEach } from 'bun:test';
import { swarmState, resetSwarmState } from '../../../src/state';
import { createDelegationTrackerHook } from '../../../src/hooks/delegation-tracker';
import type { PluginConfig } from '../../../src/config';

describe('DelegationTrackerHook', () => {
	const defaultConfig: PluginConfig = {
		max_iterations: 5,
		qa_retry_limit: 3,
		inject_phase_reminders: true,
	};

	const enabledConfig: PluginConfig = {
		max_iterations: 5,
		qa_retry_limit: 3,
		inject_phase_reminders: true,
		hooks: {
			system_enhancer: true,
			compaction: true,
			agent_activity: true,
			delegation_tracker: true,
			agent_awareness_max_chars: 300,
		},
	};

	beforeEach(() => {
		resetSwarmState();
	});

	describe('activeAgent updates', () => {
		it('always updates activeAgent when agent is present', async () => {
			const hook = createDelegationTrackerHook(defaultConfig);
			const sessionId = 'test-session-1';

			await hook({ sessionID: sessionId, agent: 'coder' }, {});

			expect(swarmState.activeAgent.get(sessionId)).toBe('coder');
		});

		it('skips when no agent is specified', async () => {
			const hook = createDelegationTrackerHook(defaultConfig);
			const sessionId = 'test-session-1';

			// Set a previous agent
			swarmState.activeAgent.set(sessionId, 'architect');

			await hook({ sessionID: sessionId }, {});

			// Should remain unchanged
			expect(swarmState.activeAgent.get(sessionId)).toBe('architect');
			expect(swarmState.delegationChains.has(sessionId)).toBe(false);
			expect(swarmState.pendingEvents).toBe(0);
		});

		it('skips when agent is empty string', async () => {
			const hook = createDelegationTrackerHook(defaultConfig);
			const sessionId = 'test-session-1';

			// Set a previous agent
			swarmState.activeAgent.set(sessionId, 'architect');

			await hook({ sessionID: sessionId, agent: '' }, {});

			// Should remain unchanged
			expect(swarmState.activeAgent.get(sessionId)).toBe('architect');
			expect(swarmState.delegationChains.has(sessionId)).toBe(false);
			expect(swarmState.pendingEvents).toBe(0);
		});

		it('activeAgent tracks correctly', async () => {
			const hook = createDelegationTrackerHook(defaultConfig);
			const sessionId = 's1';

			await hook({ sessionID: sessionId, agent: 'coder' }, {});

			expect(swarmState.activeAgent.get('s1')).toBe('coder');
		});

		it('multiple sessions maintain independent active agents', async () => {
			const hook = createDelegationTrackerHook(defaultConfig);

			await hook({ sessionID: 'session1', agent: 'architect' }, {});
			await hook({ sessionID: 'session2', agent: 'coder' }, {});
			await hook({ sessionID: 'session3', agent: 'reviewer' }, {});

			expect(swarmState.activeAgent.get('session1')).toBe('architect');
			expect(swarmState.activeAgent.get('session2')).toBe('coder');
			expect(swarmState.activeAgent.get('session3')).toBe('reviewer');
		});
	});

	describe('delegation tracking disabled by default', () => {
		it('no delegation entries created when delegation_tracker is undefined', async () => {
			const hook = createDelegationTrackerHook(defaultConfig);
			const sessionId = 'test-session';

			// Set previous agent
			swarmState.activeAgent.set(sessionId, 'architect');

			await hook({ sessionID: sessionId, agent: 'coder' }, {});

			expect(swarmState.delegationChains.has(sessionId)).toBe(false);
			expect(swarmState.pendingEvents).toBe(0);
			expect(swarmState.activeAgent.get(sessionId)).toBe('coder'); // But agent still updated
		});

		it('no delegation entries created when delegation_tracker is false', async () => {
			const disabledConfig: PluginConfig = {
				...defaultConfig,
				hooks: {
					system_enhancer: false,
					compaction: false,
					agent_activity: false,
					delegation_tracker: false,
					agent_awareness_max_chars: 300,
				},
			};
			const hook = createDelegationTrackerHook(disabledConfig);
			const sessionId = 'test-session';

			// Set previous agent
			swarmState.activeAgent.set(sessionId, 'architect');

			await hook({ sessionID: sessionId, agent: 'coder' }, {});

			expect(swarmState.delegationChains.has(sessionId)).toBe(false);
			expect(swarmState.pendingEvents).toBe(0);
			expect(swarmState.activeAgent.get(sessionId)).toBe('coder'); // But agent still updated
		});

		it('pendingEvents NOT incremented when delegation tracking disabled', async () => {
			const hook = createDelegationTrackerHook(defaultConfig);
			const sessionId = 'test-session';

			swarmState.activeAgent.set(sessionId, 'architect');
			const initialEvents = swarmState.pendingEvents;

			await hook({ sessionID: sessionId, agent: 'coder' }, {});

			expect(swarmState.pendingEvents).toBe(initialEvents); // Should remain unchanged
		});
	});

	describe('delegation tracking enabled', () => {
		it('creates delegation entry when agent changes', async () => {
			const hook = createDelegationTrackerHook(enabledConfig);
			const sessionId = 'test-session';

			// Set previous agent
			swarmState.activeAgent.set(sessionId, 'architect');

			await hook({ sessionID: sessionId, agent: 'coder' }, {});

			expect(swarmState.delegationChains.has(sessionId)).toBe(true);
			const chain = swarmState.delegationChains.get(sessionId);
			expect(chain).toHaveLength(1);

			const entry = chain![0];
			expect(entry.from).toBe('architect');
			expect(entry.to).toBe('coder');
			expect(typeof entry.timestamp).toBe('number');
			expect(entry.timestamp).toBeGreaterThan(0);
		});

		it('same agent does not create delegation entry', async () => {
			const hook = createDelegationTrackerHook(enabledConfig);
			const sessionId = 'test-session';

			// Set previous agent
			swarmState.activeAgent.set(sessionId, 'architect');

			await hook({ sessionID: sessionId, agent: 'architect' }, {});

			expect(swarmState.delegationChains.has(sessionId)).toBe(false);
			expect(swarmState.pendingEvents).toBe(0);
		});

		it('first agent assignment does not create delegation entry', async () => {
			const hook = createDelegationTrackerHook(enabledConfig);
			const sessionId = 'test-session';

			// No previous agent set
			await hook({ sessionID: sessionId, agent: 'architect' }, {});

			expect(swarmState.delegationChains.has(sessionId)).toBe(false);
			expect(swarmState.pendingEvents).toBe(0);
		});

		it('chain accumulates multiple agent switches', async () => {
			const hook = createDelegationTrackerHook(enabledConfig);
			const sessionId = 'test-session';

			// Simulate a series of agent switches
			swarmState.activeAgent.set(sessionId, 'architect');
			await hook({ sessionID: sessionId, agent: 'coder' }, {});
			await hook({ sessionID: sessionId, agent: 'reviewer' }, {});
			await hook({ sessionID: sessionId, agent: 'sme' }, {});
			await hook({ sessionID: sessionId, agent: 'tester' }, {});

			const chain = swarmState.delegationChains.get(sessionId);
			expect(chain).toHaveLength(4); // 4 switches total

			expect(chain![0]).toEqual({
				from: 'architect',
				to: 'coder',
				timestamp: expect.any(Number),
			});
			expect(chain![1]).toEqual({
				from: 'coder',
				to: 'reviewer',
				timestamp: expect.any(Number),
			});
			expect(chain![2]).toEqual({
				from: 'reviewer',
				to: 'sme',
				timestamp: expect.any(Number),
			});
			expect(chain![3]).toEqual({
				from: 'sme',
				to: 'tester',
				timestamp: expect.any(Number),
			});
		});

		it('pendingEvents increments for each delegation', async () => {
			const hook = createDelegationTrackerHook(enabledConfig);
			const sessionId = 'test-session';

			swarmState.activeAgent.set(sessionId, 'architect');
			const initialEvents = swarmState.pendingEvents;

			await hook({ sessionID: sessionId, agent: 'coder' }, {});
			expect(swarmState.pendingEvents).toBe(initialEvents + 1);

			await hook({ sessionID: sessionId, agent: 'reviewer' }, {});
			expect(swarmState.pendingEvents).toBe(initialEvents + 2);
		});

		it('pendingEvents NOT incremented when delegation tracking disabled', async () => {
			const hook = createDelegationTrackerHook(enabledConfig);
			const sessionId = 'test-session';

			// Use default config (delegation tracking disabled)
			const disabledHook = createDelegationTrackerHook(defaultConfig);

			swarmState.activeAgent.set(sessionId, 'architect');
			const initialEvents = swarmState.pendingEvents;

			await disabledHook({ sessionID: sessionId, agent: 'coder' }, {});

			expect(swarmState.pendingEvents).toBe(initialEvents); // Should remain unchanged
		});
	});

	describe('edge cases', () => {
		it('handles null agent gracefully', async () => {
			const hook = createDelegationTrackerHook(enabledConfig);
			const sessionId = 'test-session';

			swarmState.activeAgent.set(sessionId, 'architect');

			// @ts-expect-error - testing runtime behavior with null
			await hook({ sessionID: sessionId, agent: null }, {});

			// Should remain unchanged since null is falsy
			expect(swarmState.activeAgent.get(sessionId)).toBe('architect');
			expect(swarmState.delegationChains.has(sessionId)).toBe(false);
		});

		it('handles multiple sessions with different delegation patterns', async () => {
			const hook = createDelegationTrackerHook(enabledConfig);

			// Session 1: agent switch (should create delegation)
			swarmState.activeAgent.set('session1', 'architect');
			await hook({ sessionID: 'session1', agent: 'coder' }, {});

			// Session 2: first agent (no delegation)
			await hook({ sessionID: 'session2', agent: 'reviewer' }, {});

			// Session 3: same agent (no delegation)
			swarmState.activeAgent.set('session3', 'sme');
			await hook({ sessionID: 'session3', agent: 'sme' }, {});

			// Session 4: agent switch (should create delegation)
			swarmState.activeAgent.set('session4', 'architect');
			await hook({ sessionID: 'session4', agent: 'tester' }, {});

			expect(swarmState.delegationChains.get('session1')).toHaveLength(1);
			expect(swarmState.delegationChains.get('session2')).toBeUndefined();
			expect(swarmState.delegationChains.get('session3')).toBeUndefined();
			expect(swarmState.delegationChains.get('session4')).toHaveLength(1);

			expect(swarmState.pendingEvents).toBe(2); // Only 2 actual delegations
		});
	});
});