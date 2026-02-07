/**
 * Swarm File Extractors
 *
 * Pure parsing functions for extracting structured data from .swarm/ files.
 * Used by system-enhancer and compaction-customizer hooks.
 */
/**
 * Extracts the current phase information from plan content.
 */
export declare function extractCurrentPhase(planContent: string): string | null;
/**
 * Extracts the first incomplete task from the current IN PROGRESS phase.
 */
export declare function extractCurrentTask(planContent: string): string | null;
/**
 * Extracts decisions section from context content.
 */
export declare function extractDecisions(contextContent: string, maxChars?: number): string | null;
/**
 * Extracts incomplete tasks from plan content under the current IN PROGRESS phase.
 */
export declare function extractIncompleteTasks(planContent: string, maxChars?: number): string | null;
/**
 * Extracts patterns section from context content.
 */
export declare function extractPatterns(contextContent: string, maxChars?: number): string | null;
