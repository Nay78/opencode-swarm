import type { SMEDomainConfig } from './base';

export const networkSMEConfig: SMEDomainConfig = {
	domain: 'network',
	description: 'network protocols and security',
	guidance: `- Protocols, standard ports
- Firewall rules (Windows, iptables)
- DNS records (A, CNAME, MX, TXT, SRV)
- TLS/SSL config (ciphers, protocols)
- Certificates, chain validation
- Troubleshooting (ping, tracert, netstat)
- IP addressing, subnetting, VLAN
- HTTP/HTTPS headers, status codes`,
};
