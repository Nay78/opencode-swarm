import type { SMEDomainConfig } from './base';

export const devopsSMEConfig: SMEDomainConfig = {
	domain: 'devops',
	description: 'DevOps (Docker, K8s, CI/CD, Terraform)',
	guidance: `- Docker: Dockerfile, compose, multi-stage
- Kubernetes: manifests, Helm, kubectl
- GitHub Actions: workflows, matrix, secrets
- Azure DevOps: pipelines, variable groups
- Terraform: HCL, state, modules
- Ansible: playbooks, roles, vault
- CI/CD patterns (build, test, deploy)
- Secrets management (Vault, Key Vault)`,
};
