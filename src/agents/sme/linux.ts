import type { SMEDomainConfig } from './base';

export const linuxSMEConfig: SMEDomainConfig = {
	domain: 'linux',
	description: 'Linux administration',
	guidance: `- Distro-specific (RHEL vs Ubuntu)
- Systemd units (service, timer)
- Permissions (chmod, chown, ACLs)
- SELinux/AppArmor contexts
- Package mgmt (yum/dnf, apt)
- Logs (journalctl, /var/log)
- Shell scripting (bash, POSIX)
- Network config (nmcli, ip, netplan)`,
};
