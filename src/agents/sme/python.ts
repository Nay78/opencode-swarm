import type { SMEDomainConfig } from './base';

export const pythonSMEConfig: SMEDomainConfig = {
	domain: 'python',
	description: 'Python development',
	guidance: `- Libraries (stdlib vs third-party)
- Windows modules (pywin32, wmi, winreg)
- Type hints, dataclasses
- Exception handling, context managers
- File handling (pathlib, encoding)
- Async patterns (asyncio)
- Python 3.8+ compatibility
- Common gotchas (mutable defaults, imports)`,
};
