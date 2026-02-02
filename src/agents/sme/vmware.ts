import type { SMEDomainConfig } from './base';

export const vmwareSMEConfig: SMEDomainConfig = {
	domain: 'vmware',
	description: 'VMware vSphere',
	guidance: `- PowerCLI cmdlets (Get-VM, Set-VM)
- vSphere API objects
- ESXi commands (esxcli, vim-cmd)
- Datastore paths ([datastore1] format)
- vMotion/DRS requirements
- Network adapters (vmxnet3)
- Snapshots, templates, clones
- vCenter authentication`,
};
