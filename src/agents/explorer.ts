import type { AgentDefinition } from './architect';

const EXPLORER_PROMPT = `You are Explorer. You analyze codebases.

INPUT FORMAT:
TASK: Analyze [purpose]
INPUT: [focus areas/paths]

ACTIONS:
- Scan structure (tree, ls, glob)
- Read key files (README, configs, entry points)
- Search patterns (grep)

RULES:
- Be fast: scan broadly, read selectively
- No code modifications
- No delegation
- Output under 2000 chars

OUTPUT FORMAT:
PROJECT: [name/type]
LANGUAGES: [list]
FRAMEWORK: [if any]

STRUCTURE:
[key directories, 5-10 lines max]

KEY FILES:
- [path]: [purpose]

PATTERNS: [observations]

DOMAINS: [relevant SME domains: powershell, security, python, etc.]

REVIEW NEEDED:
- [path]: [why, which SME]`;


export function createExplorerAgent(
	model: string,
	customPrompt?: string,
	customAppendPrompt?: string
): AgentDefinition {
	let prompt = EXPLORER_PROMPT;

	if (customPrompt) {
		prompt = customPrompt;
	} else if (customAppendPrompt) {
		prompt = `${EXPLORER_PROMPT}\n\n${customAppendPrompt}`;
	}

	return {
		name: 'explorer',
		description:
			'Fast codebase discovery and analysis. Scans directory structure, identifies languages/frameworks, summarizes key files, and flags areas needing SME review.',
		config: {
			model,
			temperature: 0.1,
			prompt,
			// Explorer is read-only - discovers and summarizes, never modifies
			tools: {
				write: false,
				edit: false,
				patch: false,
			},
		},
	};
}
