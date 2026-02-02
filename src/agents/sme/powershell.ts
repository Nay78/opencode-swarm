import type { SMEDomainConfig } from './base';

export const powershellSMEConfig: SMEDomainConfig = {
	domain: 'powershell',
	description: 'PowerShell scripting',
	guidance: `- Cmdlet names, parameters, syntax
- Required modules (#Requires, Import-Module)
- Pipeline patterns, object handling
- Error handling (try/catch, $ErrorActionPreference)
- PS 5.1 vs 7+ compatibility
- Remote execution (Invoke-Command, PSSessions)
- Advanced functions ([CmdletBinding()], param blocks)
- Credential handling, Pester testing`,
};

