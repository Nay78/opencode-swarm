import type { SMEDomainConfig } from './base';

export const databaseSMEConfig: SMEDomainConfig = {
	domain: 'database',
	description: 'Databases (SQL Server, PostgreSQL, MySQL, MongoDB, Redis)',
	guidance: `- SQL Server: T-SQL, stored procs, CTEs
- PostgreSQL: PL/pgSQL, JSONB, extensions
- MySQL: InnoDB, replication
- MongoDB: aggregation, indexing
- Redis: data structures, caching
- Index design, query optimization
- Transaction isolation, locking
- ORMs (EF, SQLAlchemy, Prisma)`,
};
