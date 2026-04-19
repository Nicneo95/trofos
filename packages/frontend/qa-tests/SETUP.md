# QA Testing Setup Guide

This guide walks you through setting up QA integration tests for the Trofos project.

## Overview

The QA testing setup includes:

1. **Standalone test suite** in `packages/frontend/qa-tests/` with 11 feature test suites (~138 tests)
2. **Separate Playwright config** (`playwright.qa.config.ts`) optimized for production testing
3. **GitHub Actions workflow** (`qa-integration-tests.yaml`) for manual-trigger CI testing with 2-shard parallelization
4. **Comprehensive documentation** and examples

## Setup Steps

### 1. Local Development Setup

#### Copy environment template
```bash
cd packages/frontend/qa-tests
cp .env.example .env
```

#### Add your QA test credentials
Edit `.env` and fill in:
```env
TEST_EMAIL=your-qa-test-account@example.com
TEST_PASSWORD=your-qa-password

# Optional - override production URL if needed
# BASE_URL=https://trofos-staging.comp.nus.edu.sg
```

#### Install dependencies
```bash
pnpm install
pnpm exec playwright install --with-deps
```

#### Run tests locally
```bash
# Run all tests (excluding logout)
pnpm run test:all

# Run all tests including logout cleanup
pnpm run test:all:with-logout

# Run specific test suite
pnpm run test:dashboard
pnpm run test:sprints
# etc...

# Interactive UI mode
pnpm run test:ui

# View HTML report
pnpm run report
```

### 2. GitHub Actions Setup

#### Create QA test account
You need a dedicated QA test account on the production Trofos server. This account should:
- Have a valid email (e.g., qa-testing@company.com)
- Have Password login enabled (not SSO-only)
- Have 2FA disabled (or use app password if enabled)
- Have appropriate permissions for testing all features
- Have a predictable state (no active assignments/tasks)

#### Add GitHub secrets
In your GitHub repository settings:

1. Go to **Settings > Secrets and variables > Actions**

2. Create two new repository secrets:
   - **Name**: `QA_TEST_EMAIL`
     - **Value**: Your QA test account email
   - **Name**: `QA_TEST_PASSWORD`
     - **Value**: Your QA test account password

**Important**: These secrets should use a dedicated QA test account, NOT a real user account.

#### Verify workflow file
The workflow file `.github/workflows/qa-integration-tests.yaml` is already created. Verify it exists:

```bash
cat .github/workflows/qa-integration-tests.yaml
```

### 3. Running the Workflow

#### Manual Trigger
1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **QA Integration Tests** workflow on the left
4. Click **Run workflow**
5. (Optional) Select specific shard or leave blank for both
6. Click green **Run workflow** button

#### Workflow Execution
- Workflow triggers 2 shards to run in parallel
- Each shard runs ~50 tests
- Total runtime: ~50 minutes
- Artifacts uploaded after completion

#### View Results
After workflow completes:
1. Click the workflow run
2. Scroll down to "Artifacts" section
3. Download:
   - `playwright-report-shard-1` - First shard results
   - `playwright-report-shard-2` - Second shard results
   - `playwright-report-merged` - Combined HTML report

To view the merged report:
1. Extract the zip file
2. Open `index.html` in a browser

### 4. Continuous Improvement

#### Monitor test flakiness
- If tests fail intermittently, check:
  - Network/server latency
  - QA account state changes
  - UI selector changes
  - Timeout values in `playwright.qa.config.ts`

#### Update test selectors
If the UI changes:
1. Update test files in `packages/frontend/qa-tests/tests/`
2. Test locally first: `pnpm run test:all`
3. Commit and push changes
4. Re-run GitHub Actions workflow

#### Add new tests
1. Create new `NN-feature.spec.ts` file
2. Follow existing test format
3. Use helper functions from `helpers/auth.ts`
4. Test locally before committing
5. File will be automatically included in sharded runs

## Configuration Files

### playwright.qa.config.ts
- Production-optimized Playwright configuration
- 2 workers for sharding support
- 180s timeout for complex operations
- HTML + JUnit + list reporters
- Video/screenshot on failure

### .github/workflows/qa-integration-tests.yaml
- Manual-trigger workflow (`workflow_dispatch`)
- Matrix strategy with 2 shards
- Parallel execution (~50 min total)
- Artifact upload and report merging
- Optional PR comments with results

### packages/frontend/qa-tests/package.json
- Test scripts using `playwright.qa.config.ts`
- Explicit reference to QA config (not default)
- All 11 test suites accessible via `pnpm run test:*`

## Troubleshooting

### Tests timeout on login
- Verify QA account credentials in secrets
- Check if account is locked
- Check if 2FA is enabled
- Try running locally first

### Auth state file errors
- Run setup project: `pnpm exec playwright test --project=setup`
- Delete old state: `rm -f auth-state-*.json`
- Re-run tests to regenerate

### Tests pass locally but fail in CI
- Check secrets are set correctly
- Verify QA account has same permissions as local
- Check network/latency issues
- Review Playwright traces in report

### Shard reports not merging
- Verify both shards completed successfully
- Check artifact upload didn't fail
- Manually merge: `pnpm exec playwright merge-reports`

## Best Practices

1. **Use dedicated QA account** - Never use real user accounts
2. **Run locally first** - Test changes locally before CI
3. **Keep tests independent** - Tests should not depend on execution order
4. **Review failures** - Always review failed test artifacts
5. **Update documentation** - Document test additions/changes

## File Structure

```
trofos/
├── packages/frontend/
│   └── qa-tests/
│       ├── tests/
│       │   ├── 1-dashboard.spec.ts
│       │   ├── ...
│       │   ├── 11-logout.spec.ts
│       │   ├── auth.setup.ts
│       │   └── helpers/
│       ├── scripts/
│       ├── playwright.qa.config.ts      ← QA config
│       ├── .env.example
│       ├── QA_README.md
│       ├── SETUP.md                     ← This file
│       └── package.json
└── .github/
    └── workflows/
        └── qa-integration-tests.yaml    ← CI workflow
```

## Support

For questions or issues:
- Review the [QA_README.md](./QA_README.md) for detailed docs
- Check [Playwright docs](https://playwright.dev/)
- Review GitHub Actions logs for CI issues
- Contact the QA/Testing team

## Next Steps

1. ✅ Create QA test account
2. ✅ Add GitHub secrets
3. ✅ Test locally with real credentials
4. ✅ Trigger workflow manually
5. ✅ Review test results
6. ✅ Schedule regular test runs (optional)

Done! Your QA testing setup is ready. 🚀
