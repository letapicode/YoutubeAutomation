# Codex Self Reflection

This document summarizes how the Codex agent operates and how it should be guided within this repository.

## Overview
- **Codex** is a cloud-based software engineering agent that performs coding tasks in isolated containers.
- It is powered by **codex-1**, a model optimized for real-world development workflows.
- Each task runs in its own sandbox preloaded with the repository. The agent can read and modify files, run commands, and commit changes.
- Codex provides citations of terminal output and test results for transparency and manual verification.

## Guidance via `AGENTS.md`
- Codex reads `AGENTS.md` files in the repository to learn project conventions, test commands, and style preferences.
- The root `AGENTS.md` here instructs the agent to:
  1. Run `npm install` in `ytapp`.
  2. Run `cargo check` in `ytapp/src-tauri`.
  3. Run `npx ts-node src/cli.ts --help` from the repository root.
- These commands must be executed before committing.

## Working Style
- Codex is trained to follow instructions precisely and to produce clean patches ready for human review.
- When uncertain or when tests fail, it should communicate issues explicitly.
- All code generated by Codex should be manually reviewed before integration.

## Usage Tips
- Assign well-scoped tasks and include any special setup or testing instructions in `AGENTS.md`.
- Provide clear commit messages summarizing the change.
- Codex cannot access external websites during execution, so all dependencies must be installed through scripts or included in the repository.


## Limitations
- The agent runs in an isolated container without internet access unless explicitly enabled by the user.
- If required dependencies are missing, commands or tests may fail. The agent should report such issues and may include a disclaimer about environment limitations in the PR.

Codex tasks should start from the prebuilt image `ghcr.io/letapicode/ytapp-dev:latest`, which is built from `.codex/Dockerfile`. This container already includes all dependencies and runs `.codex/bootstrap.sh` on launch, ensuring `scripts/setup.sh` and `.env.tauri` are applied automatically. Using this image removes most initialization overhead.

## Launching the Devcontainer

Start the containerized environment with **Reopen in Container** from the VS Code command palette or run:

```bash
devcontainer open
```

The prebuilt image automatically executes `scripts/setup_codex.sh` so all dependencies are installed before you begin.

## 🛠️ The Codex Journey: What Really Happens Behind the Scenes

The following walkthrough illustrates how Codex sets up its environment and why
preparing the container matters, especially for projects that rely on system
libraries.

### 🧱 Step 1: Codex Creates a Mini World

Codex runs inside a clean container rather than on your own machine. The
repository is copied in and no other files are present. This sandbox can run
shell commands, install dependencies and produce commits, but it starts out very
minimal.

### 📦 Step 2: Codex Tries to Build

When Codex sees a `Cargo.toml` and a Tauri project, it will attempt
`cargo check`. Native packages like `glib` or `webkit2gtk` are often missing, so
the build fails.

### 🧩 Step 3: You Step In and Patch the System

To fix the build you install the required Linux packages, set up the
`PKG_CONFIG_PATH` and re-run `cargo check`. Now the project compiles inside the
container.

### 🧠 Step 4: Codex Gets Smarter (With Your Help)

Automate this setup by adding a `.devcontainer` with a `Dockerfile`, a script to
install Tauri dependencies and an optional `.cargo/config.toml`. With these in
place Codex can run `cargo check` successfully without extra help.

### 🛠️ Step 5: Codex Makes a PR

Once the environment is ready, Codex can apply code changes, validate them and
open a pull request. A properly prepared container leads to smoother automated
development.

## ✅ The Moral of the Story

Codex only works as well as the environment it is given. Providing system
dependencies and configuration upfront lets it build, test and generate code
without hitting setup errors.

## AI Model Training

Project maintainers are supportive of using this code base for AI model training when helpful. Refer to the [AI Model Training Policy](AI_MODEL_TRAINING_POLICY.md) for details.
