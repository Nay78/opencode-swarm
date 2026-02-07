import { describe, test, expect } from 'bun:test';
import { createContextBudgetHandler } from '../../../src/hooks/context-budget';

// Helper function to generate messages with specific text length
function makeMessages(textLength: number, agent?: string) {
	const text = 'x'.repeat(textLength);
	return [
		{
			info: { role: 'user', agent },
			parts: [{ type: 'text', text }],
		},
	];
}

describe('context-budget hook', () => {
	describe('Returns no-op when disabled', () => {
		test('when config.context_budget.enabled === false', async () => {
			const config = {
				context_budget: { enabled: false, warn_threshold: 0.7, critical_threshold: 0.9, model_limits: { default: 128000 } },
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(1000, 'architect'),
			};
			
			await handler({}, output);
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(1000));
		});
	});

	describe('Does nothing when no messages', () => {
		test('when messages array is empty', async () => {
			const config = { 
				context_budget: { enabled: true, warn_threshold: 0.7, critical_threshold: 0.9, model_limits: { default: 128000 } },
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = { messages: [] };
			await handler({}, output);
			expect(output.messages).toEqual([]);
		});

		test('when messages is undefined', async () => {
			const config = { 
				context_budget: { enabled: true, warn_threshold: 0.7, critical_threshold: 0.9, model_limits: { default: 128000 } },
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {};
			await handler({}, output);
			expect(output).toEqual({});
		});
	});

	describe('Does nothing when usage below warn_threshold', () => {
		test('exactly at warn threshold (should not trigger)', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(212, 'architect'), // Exactly 70 tokens = 70%
			};
			
			await handler({}, output);
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(212));
		});

		test('below warn threshold', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(211, 'architect'), // ~69 tokens = 69%
			};
			
			await handler({}, output);
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(211));
		});
	});

	describe('Injects warning when usage > warn_threshold', () => {
		test('just above warn threshold', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(213, 'architect'), // 71 tokens = 71%
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT WARNING');
			expect(modifiedText).toContain('Consider summarizing');
			expect(modifiedText.endsWith('x'.repeat(213))).toBe(true);
		});

		test('well above warn threshold', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(250, 'architect'), // 83 tokens = 83%
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT WARNING');
			expect(modifiedText.endsWith('x'.repeat(250))).toBe(true);
		});
	});

	describe('Injects critical warning when usage > critical_threshold', () => {
		test('just above critical threshold', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(274, 'architect'), // 91 tokens = 91%
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT CRITICAL');
			expect(modifiedText).toContain('Offload details');
			expect(modifiedText.endsWith('x'.repeat(274))).toBe(true);
		});

		test('well above critical threshold', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(300, 'architect'), // 99 tokens = 99%
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT CRITICAL');
			expect(modifiedText.endsWith('x'.repeat(300))).toBe(true);
		});
	});

	describe('Only injects for architect agent (or no agent)', () => {
		test('injects for architect agent', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(250, 'architect'),
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT WARNING');
		});

		test('injects when no agent field', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(250),
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT WARNING');
		});
	});

	describe('Does NOT inject for non-architect agent', () => {
		test('coder agent unchanged', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(300, 'coder'),
			};
			
			await handler({}, output);
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(300));
		});

		test('explorer agent unchanged', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(300, 'explorer'),
			};
			
			await handler({}, output);
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(300));
		});
	});

	describe('Uses custom model_limits', () => {
		test('custom model limit', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 1000 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(700, 'architect'), // ~231 tokens, ~23% of 1000, below 70%
			};
			
			await handler({}, output);
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(700));
		});
	});

	describe('Falls back to default model limit', () => {
		test('uses default 128000 when no model_limits', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(10000, 'architect'), // ~3300 tokens, well below 128k
			};
			
			await handler({}, output);
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(10000));
		});
	});

	describe('Warning includes percentage', () => {
		test('warning shows correct percentage', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(250, 'architect'), // 83 tokens
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('~83%');
			expect(modifiedText).toContain('CONTEXT WARNING');
		});
	});

	describe('Does not modify non-text parts', () => {
		test('only text parts are modified', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: [{
					info: { role: 'user', agent: 'architect' },
					parts: [
						{ type: 'image', text: undefined },
						{ type: 'text', text: 'x'.repeat(300) }, // This will get the warning
						{ type: 'tool', text: undefined },
						{ type: 'text', text: 'more text' },
					],
				}],
			};
			
			await handler({}, output);
			
			// Only the text part with long text should be modified
			expect(output.messages[0].parts[0]).toEqual({ type: 'image', text: undefined });
			expect(output.messages[0].parts[2]).toEqual({ type: 'tool', text: undefined });
			expect(output.messages[0].parts[3]).toEqual({ type: 'text', text: 'more text' });
			expect(output.messages[0].parts[1].text).toContain('CONTEXT CRITICAL');
			expect(output.messages[0].parts[1].text).toContain('x'.repeat(300));
		});
	});

	describe('Handles messages with no text parts', () => {
		test('messages only have image/tool parts', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: [{
					info: { role: 'user', agent: 'architect' },
					parts: [
						{ type: 'image', text: undefined },
						{ type: 'tool', text: undefined },
					],
				}],
			};
			
			await handler({}, output);
			
			expect(output.messages[0].parts).toEqual([
				{ type: 'image', text: undefined },
				{ type: 'tool', text: undefined },
			]);
		});
	});

	describe('No user messages → no modification', () => {
		test('all messages are role=assistant', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: [
					{
						info: { role: 'assistant', agent: 'architect' },
						parts: [{ type: 'text', text: 'x'.repeat(300) }],
					},
				],
			};
			
			await handler({}, output);
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(300));
		});
	});

	describe('Custom thresholds work', () => {
		test('custom warn_threshold=0.5, critical_threshold=0.8', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					warn_threshold: 0.5,
					critical_threshold: 0.8,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(160, 'architect'), // ~53 tokens, ~53% of 100, above 50%
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT WARNING');
			expect(modifiedText).toContain('~53%');
		});

		test('critical threshold triggered with custom values', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					warn_threshold: 0.5,
					critical_threshold: 0.8,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(300, 'architect'), // ~99 tokens, ~99% of 100, above 80%
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT CRITICAL');
			expect(modifiedText).toContain('~99%');
		});
	});

	describe('Token calculation across multiple messages', () => {
		test('sums tokens across all messages', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 200 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: [
					{
						info: { role: 'user', agent: 'architect' },
						parts: [{ type: 'text', text: 'x'.repeat(310) }], // ~102 tokens
					},
					{
						info: { role: 'user', agent: 'architect' },
						parts: [{ type: 'text', text: 'x'.repeat(310) }], // ~102 tokens
					},
				],
			};
			
			await handler({}, output);
			
			// Total usage: ~205/200 = ~103%
			// Handler injects into the LAST user message (index 1)
			const modifiedText = output.messages[1].parts[0].text;
			expect(modifiedText).toContain('CONTEXT CRITICAL');
			expect(modifiedText).toContain('~103%');
		});
	});

	describe('Multiple text parts in last user message', () => {
		test('only first text part gets the warning', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: [{
					info: { role: 'user', agent: 'architect' },
					parts: [
						{ type: 'text', text: 'x'.repeat(300) }, // This will get the warning
						{ type: 'text', text: 'more text here' },
						{ type: 'tool', text: undefined },
					],
				}],
			};
			
			await handler({}, output);
			
			expect(output.messages[0].parts[0].text).toContain('CONTEXT CRITICAL');
			expect(output.messages[0].parts[1].text).toBe('more text here');
		});
	});

	describe('Edge case: exactly at 90% critical threshold boundary', () => {
		test('exactly 90% should trigger warn, not critical', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(272, 'architect'), // 90 tokens = 90%
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT WARNING');
			expect(modifiedText).not.toContain('CONTEXT CRITICAL');
			expect(modifiedText).toContain('~90%');
			expect(modifiedText.endsWith('x'.repeat(272))).toBe(true);
		});
	});

	describe('Edge case: default thresholds when not specified', () => {
		test('uses default warn threshold when not specified', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(227, 'architect'), // ~75 tokens = 75% > 70% default warn threshold
			};
			
			await handler({}, output);
			
			const modifiedText = output.messages[0].parts[0].text;
			expect(modifiedText).toContain('CONTEXT WARNING');
			expect(modifiedText).toContain('~75%');
		});
	});

	describe('Edge case: messages with missing parts array', () => {
		test('handles message without parts property', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: [
					{ info: { role: 'user', agent: 'architect' } }, // Missing parts property
					{
						info: { role: 'user', agent: 'architect' },
						parts: [{ type: 'text', text: 'normal message' }],
					},
				],
			};
			
			// Should not crash
			await handler({}, output);
			
			// Normal message should remain unchanged
			expect(output.messages[1].parts[0].text).toBe('normal message');
		});
	});

	describe('Edge case: parts with null/empty text', () => {
		test('handles empty and missing text fields', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: [{
					info: { role: 'user', agent: 'architect' },
					parts: [
						{ type: 'text', text: '' }, // Empty text
						{ type: 'text' }, // Missing text property
						{ type: 'text', text: 'valid text' },
					],
				}],
			};
			
			// Should not crash
			await handler({}, output);
			
			// Valid text should remain unchanged
			expect(output.messages[0].parts[2].text).toBe('valid text');
		});
	});

	describe('Edge case: last user message has no parts', () => {
		test('handles last user message without parts field', async () => {
			const config = { 
				context_budget: { 
					enabled: true,
					model_limits: { default: 100 },
				},
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: [
					{
						info: { role: 'assistant' },
						parts: [{ type: 'text', text: 'x'.repeat(300) }],
					},
					{ info: { role: 'user', agent: 'architect' } }, // No parts field
				],
			};
			
			await handler({}, output);
			
			// Assistant message should remain unchanged since it's not a user message
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(300));
			// User message should remain unchanged since it has no parts
			expect(output.messages[1]).toEqual({ info: { role: 'user', agent: 'architect' } });
		});
	});

	describe('Edge case: context_budget entirely missing from config', () => {
		test('handler enabled by default when context_budget missing', async () => {
			const config = { 
				max_iterations: 5,
				qa_retry_limit: 3,
				inject_phase_reminders: true,
			};
			
			const handler = createContextBudgetHandler(config);
			const output = {
				messages: makeMessages(100, 'architect'), // Small text, well below default 128k limit
			};
			
			await handler({}, output);
			
			// Since we're well below the default 128k limit (100 tokens vs 128k), no warning should be injected
			expect(output.messages[0].parts[0].text).toBe('x'.repeat(100));
		});
	});
});