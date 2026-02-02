import type { SMEDomainConfig } from './base';

export const apiSMEConfig: SMEDomainConfig = {
	domain: 'api',
	description: 'APIs (REST, GraphQL, OAuth, webhooks)',
	guidance: `- REST: methods, status codes, versioning
- GraphQL: schema, resolvers, N+1
- OAuth 2.0: flows, PKCE, tokens
- JWT: structure, signing, refresh
- OpenAPI/Swagger specs
- Pagination (cursor, offset)
- Error formats (RFC 7807)
- Webhooks, CORS, rate limiting`,
};
