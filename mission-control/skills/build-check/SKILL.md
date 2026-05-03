---
name: build-check
description: >-
  Validates project build in strict sequential order: install dependencies, lint, compile,
  unit tests, integration tests. Stops on first failure and reports which step failed.
  Auto-detects project type (npm, Docker Compose, Terraform). Use before commits,
  PRs, or when verifying changes compile correctly. Keywords: build, compile, test, lint,
  verify, CI, npm, docker, terraform, construir, compilar, verificar, validar build.
allowed-tools:
  - run_in_terminal
  - get_errors
  - read_file
  - file_search
---

# Build Check Skill

## Project Type Detection

Before running any commands, detect project type:

```bash
# npm (Node.js / TypeScript / Vue)
[ -f "package.json" ] && echo "NPM"

# Docker Compose
[ -f "docker-compose.yml" ] || [ -f "docker/local/docker-compose.yml" ] && echo "COMPOSE"

# Terraform
ls *.tf 2>/dev/null && echo "TERRAFORM"
```

---

## npm Build Pipeline (TypeScript / Node.js / Vue)

Execute in strict order — **stop on first failure**:

### Step 1: Install Dependencies
```bash
npm ci  # preferred (lockfile-based, reproducible)
# or
npm install
```

### Step 2: Lint
```bash
npm run lint
```
Auto-fix if available:
```bash
npm run lint:fix
```

### Step 3: Type Check
```bash
npx vue-tsc --noEmit 2>/dev/null || npx tsc --noEmit
```

### Step 4: Unit Tests
```bash
npm run test -- --run  # single run (not watch mode)
```
Read output for: `Tests X passed`, `Tests X failed`.

### Step 5: Build
```bash
npm run build
```
This validates: no TypeScript errors, no missing i18n keys (if configured), tree-shaking.

### Fast Iteration (skip tests)
```bash
npm run lint && npx tsc --noEmit
```
Only use when confirmed: "skip tests for fast iteration".

---

## Docker Compose Validation

```bash
# Validate compose file syntax
docker compose config > /dev/null && echo "✅ Compose file valid" || echo "❌ Compose file invalid"

# Check images can be pulled (dry run)
docker compose pull --dry-run 2>&1 | grep -E "Pulling|ERROR"
```

---

## Terraform Validation

```bash
# Format check
terraform fmt -check -recursive

# Validation
terraform validate

# Plan (dry run — requires backend config)
terraform plan -detailed-exitcode
```

---

## Build Status Report Format

```
🔨 Build Check — [repo-name]
Project type: NPM / COMPOSE / TERRAFORM

Step 1: Install Dependencies ...... ✅ PASS
Step 2: Lint ....................... ✅ PASS (0 warnings)
Step 3: Type Check ................. ✅ PASS
Step 4: Unit Tests ................. ✅ PASS (42 tests, 0 failures)
Step 5: Build ...................... ✅ PASS

🟢 BUILD SUCCESSFUL
```

On failure:
```
Step 4: Unit Tests ................. ❌ FAIL

Failure details:
  [test file].[test name]
  Expected: [X] but received: [Y]
  at [file:line]

🔴 BUILD FAILED — stopping pipeline
Fix the above error before proceeding.
```

---

## Pre-Commit Quick Check

Minimal check before every commit:
```bash
npm run lint && npm run test -- --run
```

---

## CI Equivalence

These steps mirror what runs in GitHub Actions CI:
1. Dependency install (`npm ci`)
2. Lint
3. Type-check
4. Unit tests
5. Build

If build passes locally, it should pass in CI. Any discrepancy = investigate environment differences (Node.js version, `.nvmrc`, env vars).
