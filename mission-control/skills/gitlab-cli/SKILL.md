---
name: gitlab-cli
description: >-
  GitLab CLI (glab) skill for GitLab interactions: create and review merge requests,
  manage issues, inspect pipelines, releases, and repository metadata directly from
  the terminal. Use whenever you need to interact with GitLab: open an MR, check
  pipeline status, create issues, list branches, merge MRs, or inspect releases.
  Keywords: gitlab, glab, MR, merge request, issue, release, pipeline, CI, merge,
  repo, branches, gitlab cli, gitlab pipelines, gitlab issues.
allowed-tools:
  - run_in_terminal
  - read_file
---

# GitLab CLI Skill

## Prerequisites

```bash
# Verify glab is installed and authenticated
glab auth status
```

If not authenticated:
```bash
glab auth login
```

---

## Merge Requests

### Create MR
```bash
glab mr create \
  --title "feat(user): add onboarding flow" \
  --description "## Summary\n\nAdds user onboarding with...\n\n## How to test\n\n1. ...\n\n## Checklist\n- [x] Tests added\n- [x] Lint passes\n- [x] No secrets staged" \
  --target-branch develop \
  --source-branch feature/FEAT-042-user-onboarding \
  --draft
```

### List MRs
```bash
glab mr list
glab mr list --state all
```

### Review MR
```bash
glab mr view 42
glab mr diff 42
```

### Merge MR
```bash
glab mr merge 42 --squash --remove-source-branch
```

---

## Issues

### Create Issue
```bash
glab issue create \
  --title "[BUG] User creation fails when email has uppercase" \
  --description "## Description\n\n...\n\n## Steps to Reproduce\n\n1. ...\n\n## Expected Behavior\n...\n\n## Actual Behavior\n..." \
  --label "bug,priority-high"
```

### List Issues
```bash
glab issue list
glab issue list --label bug
```

### Close Issue
```bash
glab issue close 15
```

---

## Pipelines

### List Pipelines
```bash
glab pipeline list
```

### View Pipeline
```bash
glab pipeline view 123456
```

### Retry Failed Pipeline
```bash
glab pipeline retry 123456
```

---

## Releases

### Create Release
```bash
glab release create v1.2.0 \
  --notes "## What's New\n\n- feat: user onboarding flow\n- fix: token expiry handling" \
  --ref main
```

### List Releases
```bash
glab release list
```

---

## Repository Management

### View Repo Info
```bash
glab repo view
```

### List Branches
```bash
glab api projects/:id/repository/branches
```

### Set Default Branch
```bash
glab api projects/:id -X PUT -F default_branch=develop
```
