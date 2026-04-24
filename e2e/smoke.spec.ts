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
      page.getByRole("button", { name: /^Save/ }).click(),
    ]);
    const name = download.suggestedFilename();
    expect(name).toMatch(/\.infidoc\.json$/);
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
