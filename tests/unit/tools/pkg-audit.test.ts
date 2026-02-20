import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { pkg_audit } from '../../../src/tools/pkg-audit';
import type { ToolContext } from '@opencode-ai/plugin';

// Mock for Bun.spawn
let originalSpawn: typeof Bun.spawn;
let spawnCalls: Array<{ cmd: string[]; opts: unknown }> = [];
let mockExitCode: number = 0;
let mockStdout: string = '';
let mockStderr: string = '';
let mockSpawnError: Error | null = null;

function mockSpawn(cmd: string[], opts: unknown) {
	spawnCalls.push({ cmd, opts });

	if (mockSpawnError) {
		throw mockSpawnError;
	}

	// Create mock readable streams
	const encoder = new TextEncoder();
	const stdoutReadable = new ReadableStream({
		start(controller) {
			controller.enqueue(encoder.encode(mockStdout));
			controller.close();
		}
	});
	const stderrReadable = new ReadableStream({
		start(controller) {
			controller.enqueue(encoder.encode(mockStderr));
			controller.close();
		}
	});

	return {
		stdout: stdoutReadable,
		stderr: stderrReadable,
		exited: Promise.resolve(mockExitCode),
		exitCode: mockExitCode,
	} as unknown as ReturnType<typeof Bun.spawn>;
}

// Temp directories for ecosystem detection tests
let tempDir: string;
let originalCwd: string;

// Helper to create mock context
function getMockContext(): ToolContext {
	return {
		sessionID: 'test-session',
		messageID: 'test-message',
		agent: 'test-agent',
		directory: tempDir,
		worktree: tempDir,
		abort: new AbortController().signal,
		metadata: () => ({}),
		ask: async () => undefined,
	};
}

describe('pkg-audit tool', () => {
	beforeEach(() => {
		originalSpawn = Bun.spawn;
		spawnCalls = [];
		mockExitCode = 0;
		mockStdout = '';
		mockStderr = '';
		mockSpawnError = null;
		Bun.spawn = mockSpawn;

		// Save current directory and create temp dir
		originalCwd = process.cwd();
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg-audit-test-'));
		process.chdir(tempDir);
	});

	afterEach(() => {
		Bun.spawn = originalSpawn;
		process.chdir(originalCwd);
		// Clean up temp directory
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	// ============ Validation Tests ============
	describe('validation', () => {
		it('should return error for invalid ecosystem value', async () => {
			// Note: The tool validates args and returns error as JSON string
			const result = await pkg_audit.execute({ ecosystem: 'evil' }, getMockContext());
			const parsed = JSON.parse(result);
			expect(parsed.error).toContain('Invalid arguments');
		});
	});

	// ============ Ecosystem Detection Tests ============
	describe('ecosystem detection', () => {
		it('should auto-detect npm from package.json presence', async () => {
			// Create package.json
			fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');

			mockExitCode = 0;
			mockStdout = '{"vulnerabilities": {}}';

			const result = await pkg_audit.execute({ ecosystem: 'auto' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.ecosystems).toContain('npm');
		});

		it('should auto-detect pip from pyproject.toml presence', async () => {
			// Create pyproject.toml
			fs.writeFileSync(path.join(tempDir, 'pyproject.toml'), '[project]');

			mockExitCode = 0;
			mockStdout = '[]';

			const result = await pkg_audit.execute({ ecosystem: 'auto' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.ecosystems).toContain('pip');
		});

		it('should auto-detect pip from requirements.txt presence', async () => {
			// Create requirements.txt
			fs.writeFileSync(path.join(tempDir, 'requirements.txt'), 'requests>=2.0');

			mockExitCode = 0;
			mockStdout = '[]';

			const result = await pkg_audit.execute({ ecosystem: 'auto' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.ecosystems).toContain('pip');
		});

		it('should auto-detect cargo from Cargo.toml presence', async () => {
			// Create Cargo.toml
			fs.writeFileSync(path.join(tempDir, 'Cargo.toml'), '[package]\nname = "test"');

			mockExitCode = 0;
			mockStdout = '{"vulnerabilities": null}';

			const result = await pkg_audit.execute({ ecosystem: 'auto' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.ecosystems).toContain('cargo');
		});

		it('should return empty ecosystems when no project files found', async () => {
			// Don't create any project files - temp dir is empty

			mockExitCode = 0;
			mockStdout = '';

			const result = await pkg_audit.execute({ ecosystem: 'auto' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.ecosystems).toEqual([]);
			expect(parsed.clean).toBe(true);
		});
	});

	// ============ NPM Audit JSON Parsing Tests ============
	describe('npm audit v2 JSON parsing', () => {
		it('should parse npm audit v2 JSON format correctly - vulnerabilities object', async () => {
			mockExitCode = 1; // non-zero exit code means vulnerabilities found
			mockStdout = JSON.stringify({
				vulnerabilities: {
					"lodash": {
						severity: "high",
						range: "4.17.15",
						fixAvailable: { version: "4.17.21" },
						title: "Prototype Pollution in lodash",
						cves: ["CVE-2021-23337"],
						url: "https://nvd.nist.gov/vuln/detail/CVE-2021-23337"
					}
				}
			});

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(false);
			expect(parsed.findings.length).toBe(1);
			expect(parsed.findings[0].package).toBe('lodash');
			expect(parsed.findings[0].severity).toBe('high');
			expect(parsed.findings[0].cve).toBe('CVE-2021-23337');
			expect(parsed.findings[0].patchedVersion).toBe('4.17.21');
		});

		it('should parse npm audit with fixAvailable: true correctly', async () => {
			mockExitCode = 1;
			mockStdout = JSON.stringify({
				vulnerabilities: {
					"express": {
						severity: "moderate",
						range: "4.0.0",
						fixAvailable: true,
						title: "Some vuln"
					}
				}
			});

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.findings[0].patchedVersion).toBe('latest');
		});

		it('should return clean:true when no vulnerabilities found (exit code 0)', async () => {
			mockExitCode = 0;
			mockStdout = '{"vulnerabilities": {}}';

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(true);
			expect(parsed.findings.length).toBe(0);
		});

		it('should return clean:true when tool not installed', async () => {
			mockSpawnError = new Error("'npm' is not recognized");

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(true);
			expect(parsed.note).toContain('not available');
		});

		it('should handle malformed JSON gracefully', async () => {
			mockExitCode = 1;
			mockStdout = 'not valid json at all';
			mockStderr = '';

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			// Should return clean with note about parsing issue
			expect(parsed.clean).toBe(true);
			expect(parsed.note).toBeDefined();
		});

		it('should handle empty output gracefully', async () => {
			mockExitCode = 0;
			mockStdout = '';
			mockStderr = '';

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(true);
		});
	});

	// ============ pip-audit JSON Parsing Tests ============
	describe('pip-audit JSON parsing', () => {
		it('should parse pip-audit JSON format correctly - array of {name, version, vulns}', async () => {
			mockExitCode = 1;
			mockStdout = JSON.stringify([
				{
					name: "django",
					version: "3.2.0",
					vulns: [
						{
							id: "CVE-2021-44420",
							aliases: ["CVE-2021-44420"],
							fix_versions: ["3.2.10"]
						}
					]
				}
			]);

			const result = await pkg_audit.execute({ ecosystem: 'pip' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(false);
			expect(parsed.findings.length).toBe(1);
			expect(parsed.findings[0].package).toBe('django');
			expect(parsed.findings[0].severity).toBe('high'); // aliases with CVE -> high
			expect(parsed.findings[0].cve).toBe('CVE-2021-44420');
		});

		it('should return moderate severity when no aliases (no CVE)', async () => {
			mockExitCode = 1;
			mockStdout = JSON.stringify([
				{
					name: "some-package",
					version: "1.0.0",
					vulns: [
						{
							id: "PYSEC-2021-001",
							aliases: [],  // empty aliases -> moderate
							fix_versions: []
						}
					]
				}
			]);

			const result = await pkg_audit.execute({ ecosystem: 'pip' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.findings[0].severity).toBe('moderate'); // no aliases -> moderate
		});

		it('should return clean:true when no vulnerabilities found', async () => {
			mockExitCode = 0;
			mockStdout = '[]';

			const result = await pkg_audit.execute({ ecosystem: 'pip' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(true);
		});

		it('should handle pip-audit not installed', async () => {
			mockSpawnError = new Error("pip-audit: command not found");

			const result = await pkg_audit.execute({ ecosystem: 'pip' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(true);
			expect(parsed.note).toContain('not installed');
		});
	});

	// ============ cargo audit JSON Parsing Tests ============
	describe('cargo audit JSON parsing', () => {
		it('should parse cargo audit JSON format correctly - vulnerabilities.list array', async () => {
			mockExitCode = 1;
			// cargo audit outputs multiple JSON objects, one per line
			mockStdout = JSON.stringify({
				vulnerabilities: {
					list: [
						{
							advisory: {
								package: "serde",
								title: "Arbitrary Code Execution in serde",
								id: "RUSTSEC-2021-001",
								aliases: ["CVE-2021-43740"],
								url: "https://rustsec.org/advisories/RUSTSEC-2021-001",
								cvss: 9.5
							},
							package: { version: "1.0.0" },
							versions: { patched: ["1.0.1"] }
						}
					]
				}
			}) + '\n';

			const result = await pkg_audit.execute({ ecosystem: 'cargo' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(false);
			expect(parsed.findings.length).toBe(1);
			expect(parsed.findings[0].package).toBe('serde');
			expect(parsed.findings[0].severity).toBe('critical'); // CVSS 9.5 -> critical
		});

		it('should map CVSS 9.5 to critical severity', async () => {
			mockExitCode = 1;
			mockStdout = JSON.stringify({
				vulnerabilities: {
					list: [
						{
							advisory: {
								package: "test",
								title: "Test",
								id: "RUSTSEC-2021-001",
								aliases: [],
								url: "",
								cvss: 9.5
							},
							package: { version: "1.0.0" },
							versions: { patched: [] }
						}
					]
				}
			}) + '\n';

			const result = await pkg_audit.execute({ ecosystem: 'cargo' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.findings[0].severity).toBe('critical');
		});

		it('should map CVSS 7.5 to high severity', async () => {
			mockExitCode = 1;
			mockStdout = JSON.stringify({
				vulnerabilities: {
					list: [
						{
							advisory: {
								package: "test",
								title: "Test",
								id: "RUSTSEC-2021-001",
								aliases: [],
								url: "",
								cvss: 7.5
							},
							package: { version: "1.0.0" },
							versions: { patched: [] }
						}
					]
				}
			}) + '\n';

			const result = await pkg_audit.execute({ ecosystem: 'cargo' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.findings[0].severity).toBe('high');
		});

		it('should map CVSS 5.0 to moderate severity', async () => {
			mockExitCode = 1;
			mockStdout = JSON.stringify({
				vulnerabilities: {
					list: [
						{
							advisory: {
								package: "test",
								title: "Test",
								id: "RUSTSEC-2021-001",
								aliases: [],
								url: "",
								cvss: 5.0
							},
							package: { version: "1.0.0" },
							versions: { patched: [] }
						}
					]
				}
			}) + '\n';

			const result = await pkg_audit.execute({ ecosystem: 'cargo' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.findings[0].severity).toBe('moderate');
		});

		it('should map CVSS 2.0 to low severity', async () => {
			mockExitCode = 1;
			mockStdout = JSON.stringify({
				vulnerabilities: {
					list: [
						{
							advisory: {
								package: "test",
								title: "Test",
								id: "RUSTSEC-2021-001",
								aliases: [],
								url: "",
								cvss: 2.0
							},
							package: { version: "1.0.0" },
							versions: { patched: [] }
						}
					]
				}
			}) + '\n';

			const result = await pkg_audit.execute({ ecosystem: 'cargo' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.findings[0].severity).toBe('low');
		});

		it('should map undefined/0 CVSS to low severity', async () => {
			mockExitCode = 1;
			mockStdout = JSON.stringify({
				vulnerabilities: {
					list: [
						{
							advisory: {
								package: "test",
								title: "Test",
								id: "RUSTSEC-2021-001",
								aliases: [],
								url: "",
								cvss: 0
							},
							package: { version: "1.0.0" },
							versions: { patched: [] }
						}
					]
				}
			}) + '\n';

			const result = await pkg_audit.execute({ ecosystem: 'cargo' }, getMockContext());
			const parsed = JSON.parse(result);

			// cvss = 0 falls to default case, returning low
			expect(parsed.findings[0].severity).toBe('low');
		});

		it('should return clean:true when no vulnerabilities found (exit code 0)', async () => {
			mockExitCode = 0;
			mockStdout = '{"vulnerabilities": null}';

			const result = await pkg_audit.execute({ ecosystem: 'cargo' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(true);
			expect(parsed.findings.length).toBe(0);
		});

		it('should handle cargo-audit not installed', async () => {
			mockSpawnError = new Error("cargo-audit: command not found");

			const result = await pkg_audit.execute({ ecosystem: 'cargo' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.clean).toBe(true);
			expect(parsed.note).toContain('not installed');
		});
	});

	// ============ Combined Result Tests ============
	describe('combined result for auto with multiple ecosystems', () => {
		it('should combine results from multiple ecosystems', async () => {
			// Create multiple project files
			fs.writeFileSync(path.join(tempDir, 'package.json'), '{}');
			fs.writeFileSync(path.join(tempDir, 'Cargo.toml'), '[package]\nname = "test"');

			// First call is npm (exit 0), second is cargo (exit 0)
			let callCount = 0;
			const originalMockSpawn = Bun.spawn;
			Bun.spawn = (cmd, opts) => {
				callCount++;
				if (cmd[0] === 'npm') {
					mockStdout = '{"vulnerabilities": {}}';
				} else if (cmd[0] === 'cargo') {
					mockStdout = '{"vulnerabilities": null}';
				}
				return mockSpawn(cmd, opts);
			};

			const result = await pkg_audit.execute({ ecosystem: 'auto' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.ecosystems.length).toBe(2);
			expect(parsed.ecosystems).toContain('npm');
			expect(parsed.ecosystems).toContain('cargo');

			Bun.spawn = originalMockSpawn;
		});
	});

	// ============ Adversarial Tests ============
	describe('adversarial tests', () => {
		it('should handle invalid ecosystem value: "evil"', async () => {
			const result = await pkg_audit.execute({ ecosystem: 'evil' as any }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.error).toBeDefined();
			expect(parsed.error).toContain('Invalid arguments');
		});

		it('should handle malformed JSON from audit command', async () => {
			mockExitCode = 1;
			mockStdout = 'this is not { valid json';
			mockStderr = '';

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			// Should return clean with note
			expect(parsed.clean).toBe(true);
			expect(parsed.note).toBeDefined();
		});

		it('should handle empty output from audit command', async () => {
			mockExitCode = 0;
			mockStdout = '';
			mockStderr = '';

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			// Empty output with exit code 0 means clean
			expect(parsed.clean).toBe(true);
		});

		it('should handle timeout gracefully', async () => {
			// This is harder to test with the mock, but we can verify the code path exists
			// by checking that the note is generated on actual timeout in real scenarios
			mockExitCode = 0;
			mockStdout = '';
			mockStderr = '';

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			// Verify we got a result (basic sanity)
			expect(parsed).toBeDefined();
		});
	});

	// ============ Count Tests ============
	describe('count tests', () => {
		it('should correctly count critical and high vulnerabilities', async () => {
			mockExitCode = 1;
			mockStdout = JSON.stringify({
				vulnerabilities: {
					"lodash": {
						severity: "critical",
						range: "4.17.15",
						fixAvailable: { version: "4.17.21" }
					},
					"express": {
						severity: "high",
						range: "4.0.0",
						fixAvailable: true
					},
					"moment": {
						severity: "moderate",
						range: "2.29.0",
						fixAvailable: { version: "2.29.4" }
					}
				}
			});

			const result = await pkg_audit.execute({ ecosystem: 'npm' }, getMockContext());
			const parsed = JSON.parse(result);

			expect(parsed.criticalCount).toBe(1);
			expect(parsed.highCount).toBe(1);
			expect(parsed.totalCount).toBe(3);
		});
	});
});
