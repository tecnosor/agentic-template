---
name: github-cli
description: >-
  GitHub CLI (gh) skill for all GitHub interactions: create and review PRs, manage
  issues, view repo info, manage releases, and run CI/CD workflows directly from the
  terminal. Use whenever you need to interact with GitHub: open a PR, check PR status,
  create issues, list branches, merge PRs, view CI runs, or set the default branch.
  Keywords: github, gh, PR, pull request, issue, release, workflow, CI, merge, repo,
  branches, actions, github cli, github actions, github pr, github issues.
allowed-tools:
  - run_in_terminal
  - read_file
---

# GitHub CLI Skill

## Prerequisites

```bash
# Verify gh is installed and authenticated
gh auth status
```

If not authenticated:
```bash
gh auth login  # follow interactive prompts
```

---

## Pull Requests

### Create PR
```bash
gh pr create \
  --title "feat(user): add onboarding flow" \
  --body "## Summary\n\nAdds user onboarding with...\n\n## How to test\n\n1. ...\n\n## Checklist\n- [x] Tests added\n- [x] Lint passes\n- [x] No secrets staged" \
  --base develop \
  --head feature/FEAT-042-user-onboarding \
  --draft  # omit for ready PR
```

### List PRs
```bash
gh pr list
gh pr list --state all --search "FEAT-042"
```

### Review PR
```bash
gh pr view 42
gh pr diff 42
gh pr checks 42  # see CI status
```

### Merge PR
```bash
gh pr merge 42 --squash --delete-branch
```

### Request Review
```bash
gh pr edit 42 --add-reviewer username1,username2
```

---

## Issues

### Create Issue
```bash
gh issue create \
  --title "[BUG] User creation fails when email has uppercase" \
  --body "## Description\n\n...\n\n## Steps to Reproduce\n\n1. ...\n\n## Expected Behavior\n...\n\n## Actual Behavior\n..." \
  --label "bug,priority-high"
```

### List Issues
```bash
gh issue list
gh issue list --label "bug" --assignee "@me"
```

### Close Issue
```bash
gh issue close 15 --comment "Fixed in PR #42"
```

---

## Releases

### Create Release
```bash
gh release create v1.2.0 \
  --title "v1.2.0 — User Onboarding" \
  --notes "## What's New\n\n- feat: user onboarding flow\n- fix: token expiry handling\n\n## Migration\n\nNo schema changes." \
  --target main
```

### List Releases
```bash
gh release list
```

---

## GitHub Actions / Workflows

### List Workflows
```bash
gh workflow list
```

### Run Workflow Manually
```bash
gh workflow run "ci.yml" --ref develop
```

### View Run Status
```bash
gh run list --workflow=ci.yml
gh run view 12345678
gh run view 12345678 --log  # view full logs
```

### Rerun Failed Jobs
```bash
gh run rerun 12345678 --failed
```

---

## Repository Management

### Clone with gh
```bash
gh repo clone owner/repo-name
```

### View Repo Info
```bash
gh repo view
gh repo view owner/repo-name
```

### Set Default Branch
```bash
gh repo edit --default-branch develop
```

### List Branches
```bash
gh api repos/:owner/:repo/branches | jq '.[].name'
```

---

## PR Description Template

Use this template for all PRs:

```markdown
## Summary

Brief description of what this PR does and why.

## Changes

- `feat(scope)`: description of change
- `fix(scope)`: description of change

## How to Test

1. Start the service
2. Call endpoint `POST /api/v1/...`
3. Verify response is...

## Checklist

- [ ] Tests added / updated
- [ ] Lint passes (`npm run lint`)
- [ ] Build passes (`npm run build`)
- [ ] No secrets staged
- [ ] Migration added (if schema changed)
- [ ] PR description complete
```
