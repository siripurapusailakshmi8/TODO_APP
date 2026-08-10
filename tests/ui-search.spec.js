// @ts-check
const { test, expect } = require('@playwright/test');

// Seed titles visible in the UI on fresh page load:
//   "Review the project brief" (completed), "Sketch the todo page layout", "Test the mobile view"

test.describe('UI search by name', () => {
  let pageErrors;

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('requestfailed', (req) => {
      // ignore expected Playwright internals; only fail on same-origin fetch failures
      if (req.url().startsWith('http://localhost:3000')) {
        pageErrors.push(`Request failed: ${req.url()}`);
      }
    });
    await page.goto('/');
  });

  test.afterEach(() => {
    expect(pageErrors, `Unexpected browser errors: ${pageErrors.join(', ')}`).toHaveLength(0);
  });

  // AC-005: search control is accessible
  test('AC-005: search control has accessible label', async ({ page }) => {
    const input = page.getByRole('searchbox', { name: /search tasks by name/i });
    await expect(input).toBeVisible();
  });

  // AC-006: typing a substring shows only matching todos
  test('AC-006: typing a substring filters the list', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('sketch');
    const items = page.locator('.todo-item');
    await expect(items).toHaveCount(1);
    await expect(items.first().locator('.todo-title')).toHaveText('Sketch the todo page layout');
  });

  // AC-006: mixed-case still matches
  test('AC-006: mixed-case input matches case-insensitively', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('SKETCH');
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await search.fill('Sketch');
    await expect(page.locator('.todo-item')).toHaveCount(1);
  });

  // AC-007: leading/trailing whitespace acts like trimmed query
  test('AC-007: leading/trailing whitespace trims correctly', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('  sketch  ');
    await expect(page.locator('.todo-item')).toHaveCount(1);
  });

  // AC-007: whitespace-only restores full list for active status filter
  test('AC-007: whitespace-only shows all status-eligible todos', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('sketch');
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await search.fill('   ');
    await expect(page.locator('.todo-item')).toHaveCount(3);
  });

  // AC-007: clearing the input restores the full list
  test('AC-007: clearing input restores all todos', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('sketch');
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await search.clear();
    await expect(page.locator('.todo-item')).toHaveCount(3);
  });

  // AC-008: search AND status filter
  test('AC-008: search combines with Active filter', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('mobile');
    await page.getByRole('button', { name: 'Active' }).click();
    // "Test the mobile view" is active (not completed)
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await expect(page.locator('.todo-title').first()).toHaveText('Test the mobile view');
  });

  test('AC-008: search combines with Done filter hides active match', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('mobile');
    await page.getByRole('button', { name: 'Done' }).click();
    // "Test the mobile view" is active, so Done + "mobile" = no results
    await expect(page.locator('.todo-item')).toHaveCount(0);
    const noResults = page.locator('[role="status"]');
    await expect(noResults).toBeVisible();
  });

  test('AC-008: All filter with search shows matching across both states', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    // "e" appears in all three seed titles — expect all visible
    await search.fill('review');
    await page.getByRole('button', { name: 'All' }).click();
    await expect(page.locator('.todo-item')).toHaveCount(1);
  });

  // AC-009: no-results state
  test('AC-009: no-match shows accessible no-results message', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('zzznomatch');
    await expect(page.locator('.todo-item')).toHaveCount(0);
    const noResults = page.locator('[role="status"]');
    await expect(noResults).toBeVisible();
    await expect(noResults).toContainText('No tasks match your search');
  });

  // AC-010: completion under active search retains search
  test('AC-010: completing a todo retains search and re-derives list', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('sketch');
    const checkbox = page.locator('.todo-item .todo-check').first();
    await checkbox.check();
    // still only one item visible — the completed version
    await expect(page.locator('.todo-item')).toHaveCount(1);
    // the search input still has its value
    await expect(search).toHaveValue('sketch');
  });

  // AC-010: deletion under active search retains search
  test('AC-010: deleting a todo retains search and re-derives list', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /search tasks by name/i });
    await search.fill('sketch');
    await expect(page.locator('.todo-item')).toHaveCount(1);
    await page.locator('[data-action="delete"]').first().click();
    // item gone, no-results since only match was deleted
    await expect(page.locator('.todo-item')).toHaveCount(0);
    await expect(search).toHaveValue('sketch');
  });

  // AC-010: create resets status to "all" (existing behavior preserved)
  test('AC-010: create resets status filter to All', async ({ page }) => {
    // Switch to Done filter first
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.locator('.todo-item')).toHaveCount(1);
    // Add a new task
    await page.getByLabel('New todo title').fill('New test task');
    await page.getByRole('button', { name: 'Add task' }).click();
    // Existing code resets filter to "all" — all todos now visible
    const allButton = page.getByRole('button', { name: 'All' });
    await expect(allButton).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.todo-item')).toHaveCount(4);
  });
});
