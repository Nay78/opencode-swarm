import type { SMEDomainConfig } from './base';

export const securitySMEConfig: SMEDomainConfig = {
	domain: 'security',
	description: 'cybersecurity and compliance',
	guidance: `- STIG/DISA requirements (V-#####)
- FIPS 140-2/3, approved algorithms
- CAC/PIV/PKI implementation
- Encryption, key management
- Audit logging requirements
- Least privilege patterns
- CIS Benchmarks
- Input validation, sanitization
- Secrets management (no hardcoding)
- TLS versions, cipher suites`,
};
