---
name: git-flow
description: >-
  Enforces Git Flow branch naming and commit message conventions. Use for branch
  creation, commit messages, PR descriptions, release planning, and hotfix workflows.
  Validates conventional commits format and git hygiene. Keywords: branch, feature,
  commit, PR, pull request, merge, release, ticket, hotfix, gitflow, rama, commit,
  parche, versión, flujo de trabajo.
allowed-tools:
  - run_in_terminal
  - read_file
---

# Git Flow Skill

## Branch Naming Convention

```
feature/{ticket-id}-short-description
fix/{ticket-id}-short-description
refactor/{ticket-id}-short-description
chore/{ticket-id}-short-description
hotfix/{ticket-id}-short-description
release/v{major}.{minor}.{patch}
```

Examples:
```
feature/FEAT-042-user-onboarding
fix/FIX-017-handle-expired-token
chore/CHORE-003-update-dependencies
hotfix/FIX-099-critical-auth-bypass
```

Rules:
- **Never push directly to `main`, `master`, `develop`, or `release/*`**
- All feature work: PR from `feature/*` → `develop`
- Hotfixes: PR from `hotfix/*` → `main` AND `develop`
- Releases: `release/*` → `main`, then tag, then merge back to `develop`

---

## Commit Message Format (Conventional Commits)

```
{type}({scope}): {short description}

[optional body]

[optional footer: closes #issue, BREAKING CHANGE: description]
```

### Types
| Type | Use When |
|------|----------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code restructuring — no behavior change |
| `test` | Adding or modifying tests |
| `chore` | Dependency updates, config, tooling |
| `docs` | Documentation only changes |
| `style` | Formatting, spacing — no logic change |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |

### Examples
```
feat(auth): add OAuth callback handler
fix(payments): handle expired session token
refactor(domain): extract UserPreferences value object
test(user): add CreateUserCommandHandler unit tests
chore(deps): bump eslint to 9.x
docs(api): update OpenAPI spec for payment endpoint
ci(github): add security audit step to workflow
```

---

## Pre-Commit Checklist

Before every commit:
- [ ] Build passes: `npm run lint && npm run test -- --run`
- [ ] No `.env` or secrets staged: `git diff --cached | grep -i "api_key\|password\|secret"`
- [ ] No build artifacts staged: `git status | grep -E "dist/|\.next/|node_modules/"`
- [ ] Commit message follows conventional commits format
- [ ] Max 400 lines diff per commit (split if larger)

---

## PR Checklist

Before opening a PR:
- [ ] Tests added or updated for every changed handler/service
- [ ] Migration added if database schema changed
- [ ] `AGENTS.md` updated if new architectural pattern introduced
- [ ] No hardcoded environment-specific URLs or values
- [ ] PR description explains: what, why, and how to test

---

## Branch Lifecycle

```bash
# Start feature
git checkout develop
git pull origin develop
git checkout -b feature/FEAT-042-user-onboarding

# Work... commit...
git add -p  # stage only relevant changes
git commit -m "feat(user): add onboarding command handler"

# Keep branch up to date
git fetch origin
git rebase origin/develop  # preferred over merge for clean history

# Push
git push origin feature/FEAT-042-user-onboarding

# Open PR → develop (via GitHub UI or gh CLI)
```

---

## Release Process

```bash
# 1. Create release branch from develop
git checkout develop && git pull
git checkout -b release/v1.2.0

# 2. Bump version
npm version 1.2.0

# 3. PR → main
# After merge:
git checkout main && git pull
git tag v1.2.0
git push origin v1.2.0

# 4. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

---

## Hotfix Process

```bash
# 1. Branch from main
git checkout main && git pull
git checkout -b hotfix/FIX-099-critical-auth-bypass

# 2. Fix, commit
git commit -m "fix(auth): prevent bypass via malformed JWT"

# 3. PR → main AND develop
# After merge to main: tag the release
git tag v1.1.1
git push origin v1.1.1
```

---

## Git Hygiene Commands

```bash
# Verify no secrets staged
git diff --cached | grep -iE "api_key|password|secret|token|private_key"

# Clean up merged branches
git branch --merged develop | grep -v "develop\|main\|master" | xargs git branch -d

# Squash commits before PR (optional — keep logical commits)
git rebase -i origin/develop
```
