# QA Integration Tests

Comprehensive Playwright test suite for Trofos production testing. Includes 11 feature test suites covering dashboard, navigation, sprints, board, issues, standup, feedback, milestones, users, admin, and logout flows.

## Quick Features

- ✅ **11 comprehensive test suites** (~138 total tests)
- ✅ **Production-ready** - Tests against https://trofos-production.comp.nus.edu.sg
- ✅ **Sharded execution** - 2 parallel shards in CI for ~50 min runtime
- ✅ **Auth state caching** - Reuses login across test runs
- ✅ **Rich reporting** - HTML reports + video/screenshots on failures
- ✅ **Manual trigger** - Run via GitHub Actions workflow dispatch

## Test Coverage

| Test Suite | Tests | Coverage |
|--|--|--|
| 1-dashboard.spec.ts | 12 | Dashboard UI, widgets, navigation |
| 2-navigation.spec.ts | 14 | Page navigation, menu flows |
| 3-sprints.spec.ts | 28 | Sprint management, CRUD operations |
| 4-board.spec.ts | 18 | Kanban board, task movements |
| 5-issues.spec.ts | 13 | Issue management, filtering |
| 6-standup.spec.ts | 16 | Standup reports, daily updates |
| 7-feedback.spec.ts | 28 | Feedback system, submissions |
| 8-milestones.spec.ts | 11 | Milestone tracking, progress |
| 9-users.spec.ts | 11 | User management, permissions |
| 10-admin.spec.ts | 15 | Admin panel, settings |
| 11-logout.spec.ts | 3 | Session cleanup, logout flows |

## Setup

### Local Development

1. **Install dependencies**
   ```bash
   cd packages/frontend/qa-tests
   pnpm install
   ```

2. **Install Playwright browsers**
   ```bash
   pnpm exec playwright install --with-deps
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   # Edit .env and add your QA test credentials
   ```

4. **Run tests**
   ```bash
   # All tests (excluding logout)
   pnpm run test:all
   
   # All tests including logout
   pnpm run test:all:with-logout
   
   # Specific feature
   pnpm run test:dashboard
   
   # Interactive UI mode
   pnpm run test:ui
   
   # Headed mode (see browser)
   pnpm run test:headed
   
   # View HTML report
   pnpm run report
   ```

### GitHub Actions - Triggered Manually

1. **Set up secrets** in GitHub repository:
   - `QA_TEST_EMAIL` - QA test account email
   - `QA_TEST_PASSWORD` - QA test account password

2. **Trigger the workflow**:
   - Go to Actions → QA Integration Tests
   - Click "Run workflow"
   - Optionally select a specific shard (1 or 2)
   - Click "Run workflow"

3. **View results**:
   - Workflow runs in ~50 min total (parallel shards)
   - Artifacts include per-shard reports
   - Merged report available after completion

## Configuration

### playwright.qa.config.ts

Production-optimized configuration:

```typescript
testDir: './tests'                    // Test directory
fullyParallel: false                  // Serial execution (stateful app)
workers: 2                            // 2 workers for sharding
timeout: 180_000                      // 3-minute timeout
baseURL: production-url               // Always production
retries: 1                            // Retry flaky tests once in CI
reporter: [html, list, junit]         // Multiple report formats
```

**Environment variables:**
- `CI` - Set in GitHub Actions (enables retries, disables slowMo)
- `BASE_URL` - Override production URL if needed
- `TEST_EMAIL` - QA test account email
- `TEST_PASSWORD` - QA test account password

## Running Tests

### Command Options

```bash
# Run all tests
pnpm run test:all

# Run with logout test (cleanup at end)
pnpm run test:all:with-logout

# Run specific feature test
pnpm run test:dashboard
pnpm run test:sprints
pnpm run test:board
# etc...

# Interactive mode
pnpm run test:ui

# Headed (see browser)
pnpm run test:headed

# View last report
pnpm run report
```

### Sharding (Local)

To simulate CI sharding locally:

```bash
# Shard 1 of 2
pnpm exec playwright test --shard=1/2

# Shard 2 of 2
pnpm exec playwright test --shard=2/2
```

## CI/CD Pipeline

### GitHub Actions Workflow

**Trigger**: Manual via `workflow_dispatch`

**Jobs**:
1. `qa-tests` (matrix with 2 shards)
   - Sets up Node.js & pnpm
   - Installs dependencies & Playwright
   - Runs tests for shard 1/2 and 2/2 in parallel
   - Uploads results per shard

2. `merge-reports`
   - Downloads all shard artifacts
   - Merges reports into single HTML report
   - Uploads final merged report

**Outputs**:
- `playwright-report-shard-1` - Shard 1 results
- `playwright-report-shard-2` - Shard 2 results
- `playwright-report-merged` - Combined results
- `test-results-shard-*` - JUnit XML for CI systems

**Duration**: ~50 minutes total (shards run in parallel)

## Troubleshooting

### Tests timeout waiting for login

1. Verify `TEST_EMAIL` and `TEST_PASSWORD` are correct
2. Check if QA account is active and not locked
3. Check 2FA is disabled on test account
4. Increase timeout in `playwright.qa.config.ts`

### Auth state file not found

- Run `setup` project first: `pnpm exec playwright test --project=setup`
- Clear browser cache: `rm -f auth-state-*.json`
- Re-run tests to regenerate auth state

### Tests failing in CI but passing locally

1. Check `TEST_EMAIL`/`TEST_PASSWORD` secrets are set correctly
2. Verify QA test account has same permissions as local
3. Check for timing issues: production might be slower
4. Review Playwright traces: check `playwright-report-qa/trace.zip`

### Viewing detailed test results

```bash
# After tests run, view HTML report
pnpm run report

# Or manually open
open playwright-report-qa/index.html

# View video of failed test
# Video files stored in playwright-report-qa/
```

## Best Practices

1. **Use QA account** - Dedicated QA test account with predictable state
2. **Run all tests** - Use `--grep-invert "[Logout]"` to skip logout in development
3. **Check auth state** - Auth cache speeds up tests significantly
4. **Review traces** - Failed tests include traces for debugging
5. **Update selectors** - If UI changes, update test selectors promptly

## File Structure

```
packages/frontend/qa-tests/
├── tests/
│   ├── 1-dashboard.spec.ts
│   ├── 2-navigation.spec.ts
│   ├── ...
│   ├── 11-logout.spec.ts
│   ├── auth.setup.ts               # Auth before all tests
│   └── helpers/
│       └── auth.ts                 # Login function
├── playwright.qa.config.ts          # QA test configuration
├── playwright.config.ts             # Original config (legacy)
├── package.json
├── .env.example
└── README.md
```

## Contributing

When adding new tests:

1. Follow naming: `NN-feature.spec.ts`
2. Group tests by feature
3. Use helper functions from `helpers/auth.ts`
4. Add comments for complex flows
5. Run locally before CI: `pnpm run test:all`

## Support

For issues or questions:
- Check Playwright [documentation](https://playwright.dev/)
- Review test reports for failures
- Check GitHub Actions logs for CI issues
- Contact QA team for test account issues
