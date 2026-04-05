import { test, expect } from "@playwright/test";

test.describe("Security", () => {
  test("API routes require auth", async ({ request }) => {
    const res = await request.get("/api/notifications");
    expect(res.status()).toBe(401);
  });

  test("QR API requires auth", async ({ request }) => {
    const res = await request.get("/api/qr/TEST001");
    expect(res.status()).toBe(401);
  });

  test("security headers present", async ({ page }) => {
    const res = await page.goto("/login");
    const headers = res?.headers() || {};
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["strict-transport-security"]).toContain("max-age=");
  });

  test("protected pages redirect to login", async ({ page }) => {
    const protectedRoutes = ["/dashboard", "/assets", "/consumables", "/staff", "/settings"];
    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("manifest.webmanifest accessible", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Trackio");
  });
});
