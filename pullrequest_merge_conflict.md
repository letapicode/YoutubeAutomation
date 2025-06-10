# Checking Pull Requests for Merge Conflicts

This guide shows how to inspect open pull requests and compare them against the
`main` branch.

## 1. Add the GitHub Remote

First add the repository fork as a remote and fetch all branches:

```bash
# Add the original repository as the upstream remote
git remote add upstream https://github.com/letapicode/YoutubeAutomation.git
# Fetch all remote branches
git fetch upstream
```

## 2. List Open Pull Requests

You can list pull requests either with the GitHub CLI (`gh`) or by calling the
API with `curl`.

### Using `gh`

```bash
# Requires the gh CLI. Authentication is read from $GH_TOKEN or $GITHUB_TOKEN
gh pr list --limit 20
```

### Using `curl`

```bash
# Reads the token from $GH_TOKEN or $GITHUB_TOKEN
token="${GH_TOKEN:-$GITHUB_TOKEN}"
repo="letapicode/YoutubeAutomation"
curl -H "Authorization: Bearer $token" \
  "https://api.github.com/repos/$repo/pulls?state=open"
```

## 3. Diff a PR Branch against `upstream/main`

After identifying a PR branch name, fetch it and run a diff against
`upstream/main`:

```bash
# Replace <branch> with the PR branch name
git fetch upstream <branch>
git diff upstream/main..FETCH_HEAD
```

This shows any changes not yet in `upstream/main`. After merging the branch
locally, run `git merge-base` or `git status` to detect conflicts.
---

## Handling Giant PR and Individual Task PRs

The repository occasionally receives a giant PR that contains all tasks at once, along with individual PRs for each task. The giant PR usually merges first because it covers everything at once. However, the smaller PRs are still useful to check for missed functionality.

### `pullrequest_merge_conflict.md`

#### \ud83d\udccc Purpose

This guide outlines the standard process to handle pull request (PR) conflicts when both a giant PR and individual task PRs are generated for the same set of tasks. It helps the AI identify and resolve merge conflicts while ensuring no functionality is lost.

#### \u2705 Assumptions

* The **giant PR** includes all tasks as a single code change.
* The **individual PRs** contain each task done separately.
* The **giant PR is already merged** into the main branch.
* **Merge conflicts are expected** when trying to merge individual PRs.

#### \ud83e\udde0 AI Responsibilities

1. **Clone the public repository** (if access is available).
2. **Check out the latest `main` branch**, which includes the merged giant PR.
3. **Iterate over each individual PR** and do the following:
   * Detect **merge conflicts**.
   * **Compare** the changes in the individual PR vs. what's already in `main`.
   * **Identify missing or improved logic** in the individual PR.
4. **Aggregate missing pieces or enhancements** across all individual PRs.
5. **Output a single unified task description** with the following:
   * All missing or extra functionality found in individual PRs.
   * Any improved code or logic that should be preserved.
6. This unified task will then be handed to Codex to **regenerate one final PR** that safely integrates everything without merge conflicts.

#### \ud83d\udee0\ufe0f Example Workflow

1. AI sees that `main` contains the giant PR.
2. It checks individual PRs like:
   * `feature/task-a`
   * `feature/task-b`
   * `feature/task-c`
3. It identifies that `task-b` had improved error handling not present in the giant PR.
4. It compiles a new single task:
   * "Regenerate full code with improved error handling from `task-b` and refactor from `task-c`..."
5. Codex now works on that one final PR.

#### \ud83d\udd01 Why This Works

* Faster initial merging (giant PR).
* Safety net to catch missed details (individual PR comparison).
* Cleaner, final integration without manually fixing PR conflicts.

