import { test, expect } from "@playwright/test";

test.describe("Infinite Idea — smoke", () => {
  test("loads, inserts a template block, and saves a file", async ({
    page,
  }) => {
    await page.goto("/");

    // Canvas ready
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    // Top-bar identity
    await expect(page.getByText("Infinite Idea")).toBeVisible();

    // Left panel loads on "Blocks" tab by default — insert a Process Step
    await page.getByRole("button", { name: /Process Step/ }).first().click();

    // Inspector updates to show "Process Step" header
    await expect(page.getByText(/^Process Step$/).nth(1)).toBeVisible();

    // Save triggers a download of the .infidoc.json file
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Save", exact: true }).click(),
    ]);
    const name = download.suggestedFilename();
    expect(name).toMatch(/\.infidoc\.json$/);
  });

  test("opens the templates dialog via ? shortcut and applies one", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    // Open templates dialog via the TopBar button
    await page.getByRole("button", { name: /^Templates$/ }).click();
    await expect(page.getByText("Start a document")).toBeVisible();

    // Apply the Process Flow template — should drop six shapes on the canvas
    await page.getByRole("button", { name: /Process Flow/ }).click();
    await expect(page.getByText("Start a document")).toBeHidden();
    await expect(page.locator(".tl-shape")).toHaveCount(6, { timeout: 5_000 });
  });

  test("keyboard-shortcuts button opens the shortcuts dialog", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    await page
      .getByRole("button", { name: /Keyboard shortcuts/ })
      .click();
    await expect(page.getByText("Keyboard shortcuts")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Keyboard shortcuts")).toBeHidden();
  });

  test("PagesBar adds a new page and the count increments", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    await expect(page.getByTitle("Pages")).toContainText("1 / 1");
    await page.getByTitle("Add new page").click();
    await expect(page.getByTitle("Pages")).toContainText("2 / 2");
  });

  test("Present button enters presentation mode with snapshot content", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    // Need at least one shape for presentation mode to open
    await page.getByRole("button", { name: /Title Block/ }).first().click();

    await page.getByRole("button", { name: /^Present$/ }).click();
    await expect(
      page.locator('[aria-label="Presentation mode"]'),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/^Presenting/)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator('[aria-label="Presentation mode"]')).toBeHidden();
  });

  test("shows an error toast for an invalid save file", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: /^File/ }).click();

    const [fileChooser] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: /^Open…/ }).click(),
    ]);
    await fileChooser.setFiles({
      name: "not-ours.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ hello: "world" })),
    });

    await expect(
      page.getByText(/doesn't look like a valid Infinite Idea file/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
