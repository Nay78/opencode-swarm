import type { SMEDomainConfig } from './base';

export const windowsSMEConfig: SMEDomainConfig = {
	domain: 'windows',
	description: 'Windows OS internals',
	guidance: `- Registry paths (HKLM, HKCU, HKU)
- WMI/CIM classes (Win32_*, CIM_*)
- Service names, dependencies, startup types
- File locations (System32, SysWOW64, ProgramData)
- Permission requirements (admin, SYSTEM, TrustedInstaller)
- Event logs, scheduled tasks
- UAC/elevation, 32/64-bit (WoW64)`,
};
