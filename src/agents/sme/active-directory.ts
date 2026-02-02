import type { SMEDomainConfig } from './base';

export const activeDirectorySMEConfig: SMEDomainConfig = {
	domain: 'active_directory',
	description: 'Active Directory',
	guidance: `- AD PowerShell cmdlets (Get-ADUser, etc.)
- LDAP filter syntax
- Distinguished names (DN)
- Group Policy, processing order
- Kerberos, SPNs
- Security groups (Domain Local, Global, Universal)
- Delegation patterns
- ADSI/DirectoryServices .NET`,
};
