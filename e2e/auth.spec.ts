import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("img[alt='Trackio']")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email']", "invalid@test.com");
    await page.fill("input[type='password']", "WrongPassword1");
    await page.click("button[type='submit']");
    await expect(page.locator("text=Invalid email or password")).toBeVisible({ timeout: 10000 });
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("forgot password link exists", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("a[href='/forgot-password']")).toBeVisible();
  });

  test("privacy policy link exists on login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("a[href='/privacy-policy']")).toBeVisible();
  });

  test("privacy policy page loads", async ({ page }) => {
    await page.goto("/privacy-policy");
    await expect(page.locator("h1")).toContainText("Privacy Policy");
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.locator("input[type='email']")).toBeVisible();
  });
});
