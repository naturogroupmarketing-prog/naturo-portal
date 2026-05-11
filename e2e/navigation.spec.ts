import { test, expect, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@naturogroup.com.au";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123";

async function login(page: Page) {
  await page.goto("/login");
  await page.fill("input[type='email']", ADMIN_EMAIL);
  await page.fill("input[type='password']", ADMIN_PASSWORD);
  await page.click("button[type='submit']");
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

test.describe("Dashboard Navigation (Admin)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("dashboard loads with stat cards", async ({ page }) => {
    await expect(page.locator("text=Total Assets")).toBeVisible();
  });

  test("navigate to assets page", async ({ page }) => {
    await page.click("a[href='/assets']");
    await expect(page).toHaveURL(/\/assets/);
    await expect(page.locator("h1")).toContainText("Assets");
  });

  test("navigate to consumables page", async ({ page }) => {
    await page.click("a[href='/consumables']");
    await expect(page).toHaveURL(/\/consumables/);
    await expect(page.locator("h1")).toContainText("Consumables");
  });

  test("navigate to staff page", async ({ page }) => {
    await page.click("a[href='/staff']");
    await expect(page).toHaveURL(/\/staff/);
  });

  test("navigate to purchase orders", async ({ page }) => {
    await page.click("a[href='/purchase-orders']");
    await expect(page).toHaveURL(/\/purchase-orders/);
    await expect(page.locator("h1")).toContainText("Purchase Orders");
  });

  test("navigate to settings", async ({ page }) => {
    await page.click("a[href='/settings']");
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.locator("h1")).toContainText("Settings");
  });

  test("navigate to locations (admin)", async ({ page }) => {
    await page.click("a[href='/admin/locations']");
    await expect(page).toHaveURL(/\/admin\/locations/);
    await expect(page.locator("h1")).toContainText("Locations");
  });

  test("command palette opens with Cmd+K", async ({ page }) => {
    await page.keyboard.press("Meta+k");
    await expect(page.locator("text=Search pages and actions")).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("user dropdown opens", async ({ page }) => {
    await page.locator("[aria-label='chevron-down']").first().click({ force: true });
    // Just verify we can click the user area without errors
  });
});
