import type { SMEDomainConfig } from './base';

export const webSMEConfig: SMEDomainConfig = {
	domain: 'web',
	description: 'Web/frontend (React, Vue, Angular, Flutter, TS)',
	guidance: `- React: hooks, context, Next.js
- Vue: Composition API, Pinia, Nuxt
- Angular: components, services, RxJS
- Flutter: widgets, state (Riverpod, Bloc)
- TypeScript: types, ES modules, async
- HTML/CSS: semantic, Flexbox/Grid, Tailwind
- Browser APIs: Fetch, Storage, WebSockets
- Build optimization, code splitting`,
};
