/**
 * Shared hook utilities for OpenCode Swarm
 *
 * This module provides common utilities for working with hooks,
 * including error handling, handler composition, file I/O, and
 * token estimation for swarm-related operations.
 */

import { warn } from '../utils';

export function safeHook<I, O>(
	fn: (input: I, output: O) => Promise<void>,
): (input: I, output: O) => Promise<void> {
	return async (input: I, output: O) => {
		try {
			await fn(input, output);
		} catch (_error) {
			const functionName = fn.name || 'unknown';
			warn(`Hook function '${functionName}' failed:`, _error);
		}
	};
}

export function composeHandlers<I, O>(
	...fns: Array<(input: I, output: O) => Promise<void>>
): (input: I, output: O) => Promise<void> {
	if (fns.length === 0) {
		return async () => {};
	}

	return async (input: I, output: O) => {
		for (const fn of fns) {
			const safeFn = safeHook(fn);
			await safeFn(input, output);
		}
	};
}

export async function readSwarmFileAsync(
	directory: string,
	filename: string,
): Promise<string | null> {
	const path = `${directory}/.swarm/${filename}`;

	try {
		const file = Bun.file(path);
		const content = await file.text();
		return content;
	} catch {
		return null;
	}
}

export function estimateTokens(text: string): number {
	if (!text) {
		return 0;
	}

	return Math.ceil(text.length * 0.33);
}
