# Checking Pull Requests for Merge Conflicts

This guide shows how to inspect open pull requests and compare them against the
`main` branch.

## 1. Add the GitHub Remote

First add the repository fork as a remote and fetch all branches:

```bash
# Replace <url> with the GitHub HTTPS or SSH URL
git remote add upstream <url>
# Fetch all remote branches
git fetch upstream
```

## 2. List Open Pull Requests

You can list pull requests either with the GitHub CLI (`gh`) or by calling the
API with `curl`.

### Using `gh`

```bash
# Requires the gh CLI and GH_TOKEN or GITHUB_TOKEN for authentication
gh pr list --limit 20
```

### Using `curl`

```bash
# Requires a GitHub token in $GH_TOKEN
token="$GH_TOKEN"
repo="owner/repo"
curl -H "Authorization: Bearer $token" \ 
  "https://api.github.com/repos/$repo/pulls?state=open"
```

## 3. Diff a PR Branch against `main`

After identifying a PR branch name, fetch it and run a diff:

```bash
# Replace <branch> with the PR branch name
git fetch upstream <branch>
git diff main..FETCH_HEAD
```

This shows any changes not yet in `main`. Combine with `git merge-base` or
`git status` to check for potential conflicts before merging.
