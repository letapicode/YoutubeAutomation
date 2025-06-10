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
