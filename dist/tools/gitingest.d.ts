import { tool } from '@opencode-ai/plugin';
export interface GitingestArgs {
    url: string;
    maxFileSize?: number;
    pattern?: string;
    patternType?: 'include' | 'exclude';
}
/**
 * Fetch repository content via gitingest.com API
 */
export declare function fetchGitingest(args: GitingestArgs): Promise<string>;
/**
 * Gitingest tool for fetching GitHub repository contents
 */
export declare const gitingest: ReturnType<typeof tool>;
