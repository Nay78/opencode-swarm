import type { SMEDomainConfig } from './base';

export const oracleSMEConfig: SMEDomainConfig = {
	domain: 'oracle',
	description: 'Oracle Database and PL/SQL',
	guidance: `- Oracle SQL syntax (not MySQL/SQL Server)
- PL/SQL blocks, exception handling
- CDB/PDB architecture
- Privileges/roles (DBA, SYSDBA)
- Dictionary views (DBA_*, V$*, GV$*)
- RMAN commands
- TNS config (tnsnames.ora, listener.ora)
- Bind variables, execution plans`,
};
