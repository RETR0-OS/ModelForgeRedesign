# ModelForge

Hardware-aware fine-tuning for open models from the Hugging Face Hub, with browser, terminal and notebook interfaces.

Built with help from AI coding tools (Claude Code, Codex and GitHub Copilot). See [CREDITS.md](CREDITS.md).

## About the project

Fine-tuning a language model means choosing a base model, a precision, an adapter configuration, a batch size and a parallelism scheme. Then, too often, you find out at step 40 that it doesn't fit in memory. ModelForge makes those choices for you, based on your hardware, and shows its reasoning before anything starts.

You pick what you want the model to do and point it at a dataset. ModelForge then:

1. **Reads your hardware.** GPUs, VRAM, compute capability, RAM and disk, on CUDA, Apple Silicon (MPS) or CPU.
2. **Budgets memory.** It estimates what training needs (weights, gradients, optimizer state and activations) and works out the largest model each training tier can handle.
3. **Picks a model and a tier.** It searches the Hugging Face Hub for popular models of the right type that fit, then chooses full fine-tuning, LoRA, or QLoRA (8-bit or 4-bit).
4. **Builds the training config.** Learning rate, sequence length, gradient accumulation, packing, gradient checkpointing and precision are all scaled to your hardware.
5. **Trains and reports progress.** Training logs stream live, checkpoints can be resumed, and TensorBoard logging is built in.
6. **Lets you try the result.** The Playground chats with the finished model, or any checkpoint, in the browser.

## Features

- **Training objectives:**
  - Supervised fine-tuning (SFT)
  - Preference training (DPO)
  - Reinforcement training (GRPO)
- **Use cases:**
  - Instruction following
  - Text generation
  - Summarization (sequence-to-sequence)
  - Extractive question answering
- **Memory-aware training tiers:** full fine-tuning, LoRA bf16, QLoRA 8-bit and QLoRA 4-bit.
- **Multi-GPU:** data parallel by default, and FSDP for full fine-tunes too large for one GPU.
- **Memory optimizations:** gradient checkpointing, sequence packing, activation offloading, and optional Liger kernels.
- **Flexible datasets:**
  - JSONL, JSON, CSV, Parquet, Arrow and text files, single files or whole folders, or Hugging Face Hub datasets.
  - Common column names are recognized automatically, such as `instruction`/`response` for `prompt`/`completion`.
- **Playground:**
  - **One-shot mode** spreads the model across GPU, CPU memory and disk.
  - **Streaming mode** shows tokens as they're generated.
- **Secure local API:** a REST and WebSocket API protected by a per-session token.

## Installation

### Requirements

- Python 3.13 or newer
- An NVIDIA GPU with CUDA for real training. Apple Silicon and CPU-only machines work, but only with small models.
- Node.js 22 (see `.node-version`), only if you build from source

### From PyPI

```bash
pip install modelforge-finetuning

# Optional extras: the terminal wizard, and Liger kernels for CUDA GPUs
pip install "modelforge-finetuning[cli,gpu]"
```

| Extra | Adds | Use it for |
|---|---|---|
| `[cli]` | click, rich | The terminal wizard (`modelforge cli`) and `modelforge tensorboard` |
| `[gpu]` | liger-kernel | Fused kernels that reduce memory use on CUDA. No Windows or CPU wheels. |

### Platform notes

- **Linux:** the default PyTorch wheel from PyPI includes CUDA. Check it can see your GPU:

  ```bash
  python -c "import torch; print(torch.cuda.is_available())"
  ```

- **Windows:** PyTorch from PyPI is CPU-only. Install a CUDA build from [pytorch.org](https://pytorch.org/get-started/locally/) before installing ModelForge, or run ModelForge under WSL2.
- **macOS (Apple Silicon):** training uses MPS. 8-bit and 4-bit quantization aren't available on MPS, so plans use full fine-tuning or LoRA on small models.

### From source

```bash
git clone https://github.com/RETR0-OS/ModelForgeRedesign.git
cd ModelForgeRedesign
uv sync --extra dev
python scripts/build_frontend.py    # or, from web/frontend: npm ci && npm run build
uv run modelforge run --no-browser
```

`modelforge run` serves the browser UI from `web/frontend_dist/`. That directory isn't committed, so source checkouts build it with the locked frontend build shown above.

`pip wheel .`, `python -m build` and `uv build` run `npm ci` and `npm run build` automatically. The build fails if Node.js or npm is missing, or if the frontend build fails, so a wheel is never published without a UI. Installing an already-built wheel doesn't need Node.

### Hugging Face login

Public models and datasets need no login. For gated models such as Llama, accept the licence on the model's Hub page, then log in once:

```bash
hf auth login
```

## Quick start

```bash
modelforge run
```

```text
ModelForge v4 browser UI
Serving on: http://0.0.0.0:8000
Open:       http://127.0.0.1:8000/app?token=…
```

Your browser opens the console, with a one-time token that connects it to the server. In the console:

1. Choose a use case and an objective.
2. Give a dataset path or a Hub dataset ID, then press **Validate**.
3. Press **Generate recommendation**, and pick a model.
4. Choose an output folder and press **Start training**.

On a shared network, bind to localhost with `modelforge run --host 127.0.0.1`. On a remote machine, add `--no-browser` and connect through an SSH tunnel.

## Interfaces and commands

| Command | What it does |
|---|---|
| `modelforge run` | Starts the server and browser console (`--host`, `--port`, `--no-browser`, `--token`) |
| `modelforge cli` | Interactive terminal wizard for headless servers (needs `[cli]`) |
| `modelforge-nb` | Notebook-friendly entry point for Jupyter and Colab |
| `modelforge recommend` | Prints a recommendation without training (`--use-case`, `--objective`, `--n`) |
| `modelforge list-tasks` | Lists the available use cases |
| `modelforge history` | Shows past runs (`--legacy` for terminal-wizard runs) |
| `modelforge tensorboard` | Starts TensorBoard on a run's logs |

## Dataset format

Each use case and objective expects particular columns. For example, supervised instruction following:

```json
{"prompt": "Summarise this ticket: …", "completion": "Customer cannot log in after the update."}
```

| Objective | Required columns |
|---|---|
| Supervised | `prompt`, `completion` |
| Preference (DPO) | `chosen`, `rejected` (and optionally `prompt`) |
| Reinforcement (GRPO) | `prompt`, `answer` |
| Summarization | `document`, `summary` |
| Extractive QA | `context`, `question`, `answers` (SQuAD format) |

The [dataset formats guide](https://modelforge-finetuning.readthedocs.io/en/latest/configuration/dataset-formats/) lists every accepted alias and has a full example for each case.

## Tech stack

| Layer | Technologies |
|---|---|
| Training | [PyTorch](https://pytorch.org), [Transformers](https://github.com/huggingface/transformers), [TRL](https://github.com/huggingface/trl) (SFT, DPO, GRPO), [PEFT](https://github.com/huggingface/peft) (LoRA), [bitsandbytes](https://github.com/bitsandbytes-foundation/bitsandbytes) (8-bit and 4-bit quantization), [Accelerate](https://github.com/huggingface/accelerate) (multi-GPU and FSDP), optional [Liger Kernel](https://github.com/linkedin/Liger-Kernel) |
| Models and data | [Hugging Face Hub](https://huggingface.co) and `huggingface_hub`, [Datasets](https://github.com/huggingface/datasets) |
| Hardware detection | NVML (`nvidia-ml-py`), `psutil`, PyTorch device APIs |
| Backend | Python 3.13, [FastAPI](https://fastapi.tiangolo.com), [Uvicorn](https://www.uvicorn.org), WebSockets, [Pydantic](https://docs.pydantic.dev), SQLite, `platformdirs` |
| Frontend | [React](https://react.dev) 19, [React Router](https://reactrouter.com) 7, TypeScript 5, [Vite](https://vite.dev) 7, lucide-react icons |
| Terminal and monitoring | [Click](https://click.palletsprojects.com), [Rich](https://github.com/Textualize/rich), [TensorBoard](https://www.tensorflow.org/tensorboard), tqdm |
| Tooling | [uv](https://docs.astral.sh/uv/), setuptools, pytest, Vitest, GitHub Actions CI |

## Project structure

```text
cli/                     modelforge command: server launcher, terminal wizard, utilities
notebook_cli/            modelforge-nb notebook entry point
web/                     FastAPI app, token auth, playground API
web/frontend/            React + Vite browser console and in-app docs
workflow/                Run lifecycle, job manager, training launch, playground sessions
recommendation_engine/   Use cases, data formats, recommendation models
utilities/               Hardware detection, planner, parallelism, database, TensorBoard
finetuning_strategies/   SFT, DPO, GRPO and QA strategies, plus task definitions
providers/               Model providers (Hugging Face)
dataset_manager/         Dataset loading and column normalization
scripts/                 Frontend build, distribution build and smoke tests
tests/                   pytest suite
```

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for a guided tour of the codebase and [TRAINING_WORKFLOWS.md](TRAINING_WORKFLOWS.md) for how each objective trains.

## Development

```bash
uv sync --extra dev
uv run pytest                                   # Python tests
cd web/frontend && npm ci && npm test           # frontend tests
cd web/frontend && npm run dev                  # frontend dev server
```

CI runs the Python tests, a strict TypeScript check and production build of the frontend, and a wheel smoke test.

## Documentation

- Full documentation: [modelforge-finetuning.readthedocs.io](https://modelforge-finetuning.readthedocs.io)
- In-app documentation: `/app/docs` in the running console

## Team

- **Aaditya Jindal**

## Credits

AI coding tools used to build this project are credited in [CREDITS.md](CREDITS.md).
