/**
 * Shared hook utilities for OpenCode Swarm
 *
 * This module provides common utilities for working with hooks,
 * including error handling, handler composition, file I/O, and
 * token estimation for swarm-related operations.
 */
export declare function safeHook<I, O>(fn: (input: I, output: O) => Promise<void>): (input: I, output: O) => Promise<void>;
export declare function composeHandlers<I, O>(...fns: Array<(input: I, output: O) => Promise<void>>): (input: I, output: O) => Promise<void>;
export declare function readSwarmFileAsync(directory: string, filename: string): Promise<string | null>;
export declare function estimateTokens(text: string): number;
