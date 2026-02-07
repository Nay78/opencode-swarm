/**
 * System Enhancer Hook
 *
 * Enhances the system prompt with current phase information from the plan
 * and cross-agent context from the activity log.
 * Reads plan.md and injects phase context into the system prompt.
 */
import type { PluginConfig } from '../config';
/**
 * Creates the experimental.chat.system.transform hook for system enhancement.
 */
export declare function createSystemEnhancerHook(config: PluginConfig, directory: string): Record<string, unknown>;
