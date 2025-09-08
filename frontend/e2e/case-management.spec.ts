// LegalFlow3 - Case Management E2E Tests
// End-to-end tests for case management functionality

import { test, expect } from "@playwright/test";

test.describe("Case Management E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the case management page
    await page.goto("/cases");

    // Wait for the page to load
    await page.waitForSelector('[data-testid="case-list"]');
  });

  test("should create a new case", async ({ page }) => {
    // Click create case button
    await page.click('[data-testid="create-case-button"]');

    // Wait for create form to appear
    await page.waitForSelector('[data-testid="case-create-form"]');

    // Fill in required fields
    await page.fill('[data-testid="case-name-input"]', "E2E Test Case");
    await page.fill('[data-testid="case-category-input"]', "test-category-123");

    // Submit the form
    await page.click('[data-testid="submit-case-button"]');

    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');

    // Verify case appears in list
    await expect(page.locator('[data-testid="case-item"]')).toContainText(
      "E2E Test Case",
    );
  });

  test("should edit an existing case", async ({ page }) => {
    // Create a case first
    await page.click('[data-testid="create-case-button"]');
    await page.waitForSelector('[data-testid="case-create-form"]');
    await page.fill('[data-testid="case-name-input"]', "Original Case Name");
    await page.fill('[data-testid="case-category-input"]', "test-category-123");
    await page.click('[data-testid="submit-case-button"]');
    await page.waitForSelector('[data-testid="success-message"]');

    // Click on the case to view details
    await page.click('[data-testid="case-item"]:first-child');
    await page.waitForSelector('[data-testid="case-detail"]');

    // Click edit button
    await page.click('[data-testid="edit-case-button"]');
    await page.waitForSelector('[data-testid="case-edit-form"]');

    // Update the case name
    await page.fill('[data-testid="case-name-input"]', "Updated Case Name");

    // Submit the update
    await page.click('[data-testid="submit-case-button"]');

    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');

    // Verify the case name was updated
    await expect(page.locator('[data-testid="case-item"]')).toContainText(
      "Updated Case Name",
    );
  });

  test("should delete a case", async ({ page }) => {
    // Create a case first
    await page.click('[data-testid="create-case-button"]');
    await page.waitForSelector('[data-testid="case-create-form"]');
    await page.fill('[data-testid="case-name-input"]', "Case to Delete");
    await page.fill('[data-testid="case-category-input"]', "test-category-123");
    await page.click('[data-testid="submit-case-button"]');
    await page.waitForSelector('[data-testid="success-message"]');

    // Click on the case to view details
    await page.click('[data-testid="case-item"]:first-child');
    await page.waitForSelector('[data-testid="case-detail"]');

    // Click delete button
    await page.click('[data-testid="delete-case-button"]');

    // Confirm deletion in modal
    await page.waitForSelector('[data-testid="delete-confirmation-modal"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');

    // Verify case is removed from list
    await expect(page.locator('[data-testid="case-item"]')).toHaveCount(0);
  });

  test("should search for cases", async ({ page }) => {
    // Create multiple cases
    const cases = [
      "Search Test Case 1",
      "Search Test Case 2",
      "Different Case",
    ];

    for (const caseName of cases) {
      await page.click('[data-testid="create-case-button"]');
      await page.waitForSelector('[data-testid="case-create-form"]');
      await page.fill('[data-testid="case-name-input"]', caseName);
      await page.fill(
        '[data-testid="case-category-input"]',
        "test-category-123",
      );
      await page.click('[data-testid="submit-case-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }

    // Search for specific case
    await page.fill('[data-testid="case-search-input"]', "Search Test");

    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]');

    // Verify only matching cases are shown
    const caseItems = page.locator('[data-testid="case-item"]');
    await expect(caseItems).toHaveCount(2);
    await expect(caseItems.nth(0)).toContainText("Search Test Case 1");
    await expect(caseItems.nth(1)).toContainText("Search Test Case 2");
  });

  test("should filter cases by status", async ({ page }) => {
    // Create cases with different statuses
    const cases = [
      { name: "Active Case", status: "Active" },
      { name: "Closed Case", status: "Closed" },
    ];

    for (const { name, status } of cases) {
      await page.click('[data-testid="create-case-button"]');
      await page.waitForSelector('[data-testid="case-create-form"]');
      await page.fill('[data-testid="case-name-input"]', name);
      await page.fill(
        '[data-testid="case-category-input"]',
        "test-category-123",
      );
      await page.selectOption('[data-testid="case-status-select"]', status);
      await page.click('[data-testid="submit-case-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }

    // Filter by Active status
    await page.selectOption('[data-testid="status-filter-select"]', "Active");

    // Wait for filtered results
    await page.waitForSelector('[data-testid="filtered-results"]');

    // Verify only Active cases are shown
    const caseItems = page.locator('[data-testid="case-item"]');
    await expect(caseItems).toHaveCount(1);
    await expect(caseItems.nth(0)).toContainText("Active Case");
  });

  test("should handle pagination", async ({ page }) => {
    // Create multiple cases to test pagination
    const cases = Array.from(
      { length: 25 },
      (_, i) => `Pagination Test Case ${i + 1}`,
    );

    for (const caseName of cases) {
      await page.click('[data-testid="create-case-button"]');
      await page.waitForSelector('[data-testid="case-create-form"]');
      await page.fill('[data-testid="case-name-input"]', caseName);
      await page.fill(
        '[data-testid="case-category-input"]',
        "test-category-123",
      );
      await page.click('[data-testid="submit-case-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }

    // Verify initial page shows limited cases
    const initialCaseItems = page.locator('[data-testid="case-item"]');
    await expect(initialCaseItems).toHaveCount(20); // Assuming 20 items per page

    // Click load more button
    await page.click('[data-testid="load-more-button"]');

    // Wait for additional cases to load
    await page.waitForSelector('[data-testid="case-item"]:nth-child(21)');

    // Verify more cases are loaded
    const loadedCaseItems = page.locator('[data-testid="case-item"]');
    await expect(loadedCaseItems).toHaveCount(25);
  });

  test("should handle form validation", async ({ page }) => {
    // Click create case button
    await page.click('[data-testid="create-case-button"]');
    await page.waitForSelector('[data-testid="case-create-form"]');

    // Try to submit without required fields
    await page.click('[data-testid="submit-case-button"]');

    // Verify validation errors are shown
    await expect(
      page.locator('[data-testid="validation-error"]'),
    ).toContainText("ケース名は必須です");
    await expect(
      page.locator('[data-testid="validation-error"]'),
    ).toContainText("カテゴリは必須です");

    // Fill in required fields
    await page.fill('[data-testid="case-name-input"]', "Valid Case Name");
    await page.fill('[data-testid="case-category-input"]', "test-category-123");

    // Submit should now work
    await page.click('[data-testid="submit-case-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Mock network failure
    await page.route("**/graphql", (route) => route.abort());

    // Try to create a case
    await page.click('[data-testid="create-case-button"]');
    await page.waitForSelector('[data-testid="case-create-form"]');
    await page.fill('[data-testid="case-name-input"]', "Network Error Case");
    await page.fill('[data-testid="case-category-input"]', "test-category-123");
    await page.click('[data-testid="submit-case-button"]');

    // Verify error message is shown
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "ネットワークエラーが発生しました",
    );
  });

  test("should handle real-time updates", async ({ page }) => {
    // Open case list in one tab
    await page.goto("/cases");
    await page.waitForSelector('[data-testid="case-list"]');

    // Open another tab and create a case
    const newPage = await page.context().newPage();
    await newPage.goto("/cases");
    await newPage.waitForSelector('[data-testid="case-list"]');
    await newPage.click('[data-testid="create-case-button"]');
    await newPage.waitForSelector('[data-testid="case-create-form"]');
    await newPage.fill(
      '[data-testid="case-name-input"]',
      "Real-time Test Case",
    );
    await newPage.fill(
      '[data-testid="case-category-input"]',
      "test-category-123",
    );
    await newPage.click('[data-testid="submit-case-button"]');
    await newPage.waitForSelector('[data-testid="success-message"]');
    await newPage.close();

    // Verify the case appears in the original tab
    await page.waitForSelector(
      '[data-testid="case-item"]:has-text("Real-time Test Case")',
    );
    await expect(page.locator('[data-testid="case-item"]')).toContainText(
      "Real-time Test Case",
    );
  });

  test("should handle concurrent operations", async ({ page }) => {
    // Create a case
    await page.click('[data-testid="create-case-button"]');
    await page.waitForSelector('[data-testid="case-create-form"]');
    await page.fill('[data-testid="case-name-input"]', "Concurrent Test Case");
    await page.fill('[data-testid="case-category-input"]', "test-category-123");
    await page.click('[data-testid="submit-case-button"]');
    await page.waitForSelector('[data-testid="success-message"]');

    // Open case details
    await page.click('[data-testid="case-item"]:first-child');
    await page.waitForSelector('[data-testid="case-detail"]');

    // Open edit form
    await page.click('[data-testid="edit-case-button"]');
    await page.waitForSelector('[data-testid="case-edit-form"]');

    // Simulate concurrent edit by another user
    await page.evaluate(() => {
      // Simulate another user editing the same case
      window.dispatchEvent(
        new CustomEvent("case-updated", {
          detail: {
            id: "CASE#test-123",
            name: "Concurrent Edit Case",
            updatedAt: new Date().toISOString(),
          },
        }),
      );
    });

    // Verify conflict resolution
    await expect(
      page.locator('[data-testid="conflict-warning"]'),
    ).toContainText("このケースは他のユーザーによって編集されています");
  });

  test("should handle large datasets efficiently", async ({ page }) => {
    // Create a large number of cases
    const cases = Array.from(
      { length: 100 },
      (_, i) => `Performance Test Case ${i + 1}`,
    );

    const startTime = Date.now();

    for (const caseName of cases) {
      await page.click('[data-testid="create-case-button"]');
      await page.waitForSelector('[data-testid="case-create-form"]');
      await page.fill('[data-testid="case-name-input"]', caseName);
      await page.fill(
        '[data-testid="case-category-input"]',
        "test-category-123",
      );
      await page.click('[data-testid="submit-case-button"]');
      await page.waitForSelector('[data-testid="success-message"]');
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Verify performance is acceptable (less than 30 seconds for 100 cases)
    expect(duration).toBeLessThan(30000);

    // Verify all cases are displayed
    await page.waitForSelector('[data-testid="case-item"]:nth-child(100)');
    const caseItems = page.locator('[data-testid="case-item"]');
    await expect(caseItems).toHaveCount(100);
  });
});
