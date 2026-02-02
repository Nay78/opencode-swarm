import type { AgentDefinition } from './architect';

const TEST_ENGINEER_PROMPT = `You are Test Engineer. You generate tests.

INPUT FORMAT:
TASK: Generate tests for [description]
FILE: [source file path]
OUTPUT: [test file path]

COVERAGE:
- Happy path: normal inputs
- Edge cases: empty, null, boundaries
- Errors: invalid inputs, failures

RULES:
- Match language (PowerShell → Pester, Python → pytest, TS → vitest/jest)
- Tests must be runnable
- Include setup/teardown if needed
- No delegation

OUTPUT:
Write test file to specified OUTPUT path.
DONE: [count] tests covering [areas]`;


export function createTestEngineerAgent(
	model: string,
	customPrompt?: string,
	customAppendPrompt?: string
): AgentDefinition {
	let prompt = TEST_ENGINEER_PROMPT;

	if (customPrompt) {
		prompt = customPrompt;
	} else if (customAppendPrompt) {
		prompt = `${TEST_ENGINEER_PROMPT}\n\n${customAppendPrompt}`;
	}

	return {
		name: 'test_engineer',
		description:
			'Testing and validation specialist. Generates test cases and runnable validation scripts for approved code.',
		config: {
			model,
			temperature: 0.2,
			prompt,
		},
	};
}
