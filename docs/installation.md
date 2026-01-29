# Installation Guide

## Quick Start

### 1. Add to OpenCode Configuration

Edit your `opencode.json`:

```json
{
  "plugin": ["opencode-swarm"]
}
```

### 2. Install Dependencies

```bash
bunx opencode-swarm install
```

### 3. Create Configuration (Optional)

Create `~/.config/opencode/opencode-swarm.json`:

```json
{
  "agents": {
    "architect": { "model": "anthropic/claude-sonnet-4-5" },
    "explorer": { "model": "google/gemini-2.0-flash" },
    "coder": { "model": "anthropic/claude-sonnet-4-5" },
    "_sme": { "model": "google/gemini-2.0-flash" },
    "_qa": { "model": "google/gemini-2.0-flash" },
    "test_engineer": { "model": "google/gemini-2.0-flash" }
  }
}
```

### 4. Start OpenCode

```bash
opencode
```

---

## Configuration Options

### Model Assignment

Each agent can use a different model:

```json
{
  "agents": {
    "architect": { "model": "anthropic/claude-sonnet-4-5" },
    "explorer": { "model": "google/gemini-2.0-flash" },
    "coder": { "model": "anthropic/claude-sonnet-4-5" }
  }
}
```

### Category Defaults

Use `_sme` and `_qa` prefixes to set defaults for all agents in a category:

```json
{
  "agents": {
    "_sme": { "model": "google/gemini-2.0-flash" },
    "_qa": { "model": "openai/gpt-4o" }
  }
}
```

Individual agents override category defaults:

```json
{
  "agents": {
    "_sme": { "model": "google/gemini-2.0-flash" },
    "sme_security": { "model": "anthropic/claude-sonnet-4-5" }
  }
}
```

### Disabling Agents

Disable SMEs you don't need:

```json
{
  "agents": {
    "sme_vmware": { "disabled": true },
    "sme_azure": { "disabled": true },
    "sme_ui_ux": { "disabled": true }
  }
}
```

### Temperature Override

Adjust agent creativity:

```json
{
  "agents": {
    "coder": { 
      "model": "anthropic/claude-sonnet-4-5",
      "temperature": 0.2
    }
  }
}
```

---

## Custom Prompts

Override or extend default agent prompts.

### Location

Place files in `~/.config/opencode/opencode-swarm/`:

### Full Replacement

Create `{agent}.md` to completely replace the default prompt:

```
~/.config/opencode/opencode-swarm/architect.md
```

### Append Mode

Create `{agent}_append.md` to add instructions to the default prompt:

```
~/.config/opencode/opencode-swarm/architect_append.md
```

### Example: Custom Architect Instructions

`~/.config/opencode/opencode-swarm/architect_append.md`:

```markdown
## Additional Guidelines

- Always check for .editorconfig before suggesting formatting changes
- Prefer TypeScript over JavaScript for new files
- Run `npm test` after any code changes
```

---

## Local Model Configuration

### Using Ollama

```json
{
  "agents": {
    "architect": { "model": "anthropic/claude-sonnet-4-5" },
    "_sme": { "model": "ollama/qwen2.5:32b" },
    "_qa": { "model": "ollama/qwen2.5:32b" }
  }
}
```

### Using LM Studio

```json
{
  "agents": {
    "_sme": { "model": "lmstudio/local-model" }
  }
}
```

### Hybrid Setup

Mix cloud and local models:

```json
{
  "agents": {
    "architect": { "model": "anthropic/claude-sonnet-4-5" },
    "explorer": { "model": "ollama/qwen2.5:14b" },
    "coder": { "model": "anthropic/claude-sonnet-4-5" },
    "_sme": { "model": "ollama/qwen2.5:14b" },
    "_qa": { "model": "ollama/qwen2.5:32b" },
    "test_engineer": { "model": "ollama/qwen2.5:14b" }
  }
}
```

---

## Verification

After installation, verify agents are loaded:

```
opencode
> ping architect
> ping explorer
> ping sme_powershell
```

Or list all available agents in the OpenCode UI.

---

## Troubleshooting

### Plugin Not Loading

1. Check `opencode.json` has the plugin listed
2. Clear cache: `rm -rf ~/.cache/opencode/node_modules/opencode-swarm`
3. Reinstall: `bunx opencode-swarm install`

### Agent Not Appearing

1. Verify config file syntax (valid JSON)
2. Check agent isn't disabled
3. Ensure model string is valid for your provider

### Model Errors

1. Verify API keys are configured for the provider
2. Check model name matches provider's naming convention
3. Test with a known-working model first

---

## Updating

```bash
bunx opencode-swarm@latest install
```

Clear cache if issues persist:

```bash
rm -rf ~/.cache/opencode/node_modules/opencode-swarm
bunx opencode-swarm@latest install
```
