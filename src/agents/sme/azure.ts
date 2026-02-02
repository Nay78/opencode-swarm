import type { SMEDomainConfig } from './base';

export const azureSMEConfig: SMEDomainConfig = {
	domain: 'azure',
	description: 'Microsoft Azure',
	guidance: `- Az PowerShell cmdlets
- Azure CLI (az) syntax
- ARM templates, Bicep
- Entra ID configuration
- RBAC roles, assignments
- Service principals, managed identity
- Networking (VNet, NSG)
- Key Vault integration`,
};
