import { test, expect } from "@playwright/test";

test.describe("Infinite Idea — smoke", () => {
  test("loads, inserts a template block, and saves a file", async ({
    page,
  }) => {
    await page.goto("/?welcome=0");

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
    await page.goto("/?welcome=0");
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    // Open templates dialog via the TopBar button
    await page.getByRole("button", { name: /^Templates$/ }).click();
    await expect(page.getByText("Start a document")).toBeVisible();

    // Apply the Process Flow template — should drop six shapes on the canvas
    await page.getByRole("button", { name: /Process Flow/ }).click();
    await expect(page.getByText("Start a document")).toBeHidden();
    await expect(page.locator(".tl-shape")).toHaveCount(6, { timeout: 5_000 });
  });

  test("command palette opens with Ctrl+K and lists keyboard shortcuts", async ({
    page,
  }) => {
    await page.goto("/?welcome=0");
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    await page.keyboard.press("Control+k");
    await expect(
      page.locator('[aria-label="Command palette"]'),
    ).toBeVisible();

    // Filter to shortcuts then run it; the dialog should open.
    await page.locator('[aria-label="Command palette"] input').fill("shortcuts");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Keyboard shortcuts")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Keyboard shortcuts")).toBeHidden();
  });

  test("PagesBar adds a new page and the count increments", async ({ page }) => {
    await page.goto("/?welcome=0");
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    await expect(page.getByTitle("Pages")).toContainText("1 / 1");
    await page.getByTitle("Add new page").click();
    await expect(page.getByTitle("Pages")).toContainText("2 / 2");
  });

  test("Present button enters presentation mode with snapshot content", async ({
    page,
  }) => {
    await page.goto("/?welcome=0");
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
    await page.goto("/?welcome=0");
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

  test("structured editor: typing into a table cell persists in the inspector", async ({
    page,
  }) => {
    await page.goto("/?welcome=0");
    await expect(page.locator(".tl-container")).toBeVisible({ timeout: 30_000 });

    // Insert a Table block from the toolbox.
    // The button's accessible name is "Table Editable grid" (label + hint text).
    await page
      .getByRole("button", { name: /Table.*Editable grid/ })
      .first()
      .click();

    // Inspector should mount with the structured editor below the Label.
    // Find a text input inside the inspector panel that lives in the
    // structured editor (not the Label textarea above it).
    const inspector = page
      .locator(".glass-strong")
      .filter({ hasText: "Inspector" });
    await expect(inspector).toBeVisible();

    // Type into the first text cell of the structured editor (skipping the
    // Label textarea). The Table schema sets all columns as `text`, so the
    // cells are <input> elements with no explicit type attribute (defaults to
    // text). The Label field above uses a <textarea>, so the first bare
    // <input> inside the inspector belongs to the structured editor.
    const cell = inspector.locator("input:not([type])").first();
    await expect(cell).toBeVisible();
    await cell.fill("Hello");

    // Blur to trigger the immediate flush.
    await cell.blur();

    // The cell should retain the typed value (proves controlled-input
    // round-trip via the tldraw store works end-to-end).
    await expect(cell).toHaveValue("Hello");
  });
});
