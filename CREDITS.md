# Credits

ModelForge is built and maintained by [ForgeOpus](https://github.com/ForgeOpus). This file acknowledges the AI coding tools used during development.

All AI-assisted changes were directed, reviewed and merged by the maintainers, who remain responsible for the code and documentation in this repository.

## AI coding tools

### Claude Code

[Claude Code](https://claude.com/claude-code), Anthropic's agentic coding tool, was used for:

- Migrating the v4 codebase into [ForgeOpus/ModelForge](https://github.com/ForgeOpus/ModelForge) while keeping the full commit history of the v0.1–v3.0.5 and v4 releases.
- Rewriting the [Read the Docs site](https://modelforge-finetuning.readthedocs.io) for v4, checked against the code, with redirects for removed pages.
- Syncing the in-app documentation with the code, and linking each in-app page to its Read the Docs counterpart.
- Restoring license and package metadata, updating the release and CI workflows, and rewriting the README.

In ForgeOpus/ModelForge, commits made with Claude Code carry a `Co-Authored-By: Claude` trailer.

### Codex

[Codex](https://openai.com/codex/), OpenAI's coding agent, was used for training-workflow and reliability work, developed on the `codex/fix-audit-findings` branch and merged in [#14](https://github.com/RETR0-OS/ModelForgeRedesign/pull/14). This covered:

- DPO, GRPO and extractive QA training workflows.
- Playground sessions, cancellation and streaming.
- Dataset normalization.
- Launch validation and recovery.
- Frontend packaging.

### GitHub Copilot

[GitHub Copilot](https://github.com/features/copilot) was used through its coding agent, which opened pull requests from `copilot/*` branches, and through Copilot Autofix. Its work included:

- Wiring up the redesigned React application ([#11](https://github.com/RETR0-OS/ModelForgeRedesign/pull/11)).
- CI for the Python tests and the frontend ([#8](https://github.com/RETR0-OS/ModelForgeRedesign/pull/8)).
- Packaging the built frontend into the Python distribution ([#12](https://github.com/RETR0-OS/ModelForgeRedesign/pull/12)).
- Fixing the training ETA timestamps and stopping the Playground from overwriting state ([#9](https://github.com/RETR0-OS/ModelForgeRedesign/pull/9)).
- Autofix suggestions, such as the TensorBoard configuration fix.

Commits from the coding agent carry a `Co-authored-by: copilot-swe-agent[bot]` trailer.

## Open-source projects

ModelForge is built on [PyTorch](https://pytorch.org), [Hugging Face Transformers](https://github.com/huggingface/transformers), [TRL](https://github.com/huggingface/trl), [PEFT](https://github.com/huggingface/peft), [Accelerate](https://github.com/huggingface/accelerate), [bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes), [FastAPI](https://fastapi.tiangolo.com), [React](https://react.dev) and [Vite](https://vite.dev). See `pyproject.toml` and `web/frontend/package.json` for the full list of dependencies.
