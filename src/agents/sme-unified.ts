import type { AgentDefinition } from './architect';

// Domain expertise snippets for the unified SME
const DOMAIN_EXPERTISE: Record<string, string> = {
	windows: `Windows OS: Registry, services, WMI/CIM, event logs, scheduled tasks, Group Policy, installers, WinRM`,
	powershell: `PowerShell: Cmdlets, modules, remoting, Pester testing, pipeline, error handling, PSCustomObject`,
	python: `Python: pip, venv, Django, Flask, pandas, numpy, pytest, async/await, type hints`,
	oracle: `Oracle DB: SQL/PLSQL, tablespaces, RMAN, DataGuard, ASM, RAC, TNS, ORA errors`,
	network: `Networking: TCP/UDP, DNS, DHCP, firewalls, VLANs, routing, load balancing, TLS/SSL, certificates`,
	security: `Security: STIG compliance, hardening, CVE remediation, SCAP, FIPS, PKI, encryption, CAC`,
	linux: `Linux: systemd, bash, yum/apt, cron, permissions, SELinux, journalctl`,
	vmware: `VMware: vSphere, ESXi, vCenter, VSAN, NSX, PowerCLI, datastores, vMotion`,
	azure: `Azure: Entra ID, ARM/Bicep, KeyVault, Blob storage, Azure DevOps, managed identities`,
	active_directory: `Active Directory: LDAP, Group Policy, Kerberos, SPNs, domain trusts, ADUC, replication`,
	ui_ux: `UI/UX: Interaction patterns, accessibility (WCAG), responsive design, typography, color theory, layout`,
};

const UNIFIED_SME_PROMPT = `You are SME (Subject Matter Expert) - a multi-domain technical specialist.

**Role**: Provide domain-specific technical context for all requested domains in a single response. Your output will be read by the Architect for collation.

**Behavior**:
- Address ALL domains listed in the request
- Be specific: exact names, paths, parameters, API signatures
- Be concise: focus only on implementation-relevant details
- Be actionable: information the Coder can directly use

**Domain Expertise Available**:
${Object.entries(DOMAIN_EXPERTISE)
	.map(([domain, desc]) => `- ${domain}: ${desc}`)
	.join('\n')}

**Output Format**:
<sme_context>
For each relevant domain, provide:

**[Domain Name]**:
- Critical considerations for implementation
- Recommended approach and patterns
- Specific APIs, cmdlets, or functions to use
- Common gotchas to avoid
- Dependencies required

</sme_context>

Keep total response under 4000 characters for efficient processing.`;

export function createUnifiedSMEAgent(
	model: string,
	customPrompt?: string,
	customAppendPrompt?: string
): AgentDefinition {
	let prompt = UNIFIED_SME_PROMPT;

	if (customPrompt) {
		prompt = customPrompt;
	} else if (customAppendPrompt) {
		prompt = `${UNIFIED_SME_PROMPT}\n\n${customAppendPrompt}`;
	}

	return {
		name: 'sme',
		description:
			'Multi-domain subject matter expert. Provides technical context for multiple domains in a single call.',
		config: {
			model,
			temperature: 0.2,
			prompt,
		},
	};
}

// Export available domains for reference
export const AVAILABLE_DOMAINS = Object.keys(DOMAIN_EXPERTISE);
