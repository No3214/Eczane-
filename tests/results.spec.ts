import { expect, test } from "@playwright/test";
import type { Pharmacy } from "../types/pharmacy";

test.use({ serviceWorkers: "block" });

test("expands current results and resets after a new manual search", async ({ page, context }) => {
  const records: Pharmacy[] = ["A", "B", "C", "D", "E"].map((letter, index) => ({
    id: `browser-fixture-${letter}`, name: `TEST ECZANESİ ${letter}`,
    city: "İzmir", district: "Konak", address: "TEST FIXTURE - NOT A REAL ADDRESS",
    phone: "", latitude: 38.4, longitude: 27.1, distance: index + 1,
    source: "mock", source_label: "Tarayıcı test verisi", is_live: false,
    warning_message: "Demo test kaydıdır; gerçek nöbet listesi değildir.",
  }));
  const queries: URL[] = [];
  const unexpectedRequests: string[] = [];
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin === "http://localhost:3000" && url.pathname === "/api/pharmacies") {
      queries.push(url);
      await route.fulfill({ json: { success: true, data: records } });
    } else if (url.origin === "http://localhost:3000" && !url.pathname.startsWith("/api/")) {
      await route.continue();
    } else if (url.origin === "https://api.qrserver.com"
      && url.pathname === "/v1/create-qr-code/"
      && route.request().resourceType() === "image") {
      // ShareCard mounts this image offscreen; keep the known boundary local.
      await route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="black"/></svg>',
      });
    } else {
      unexpectedRequests.push(url.href);
      await route.abort();
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Konum İzni Olmadan Ara/ }).click();
  await page.getByPlaceholder(/İl ara/).fill("İzmir");
  await page.getByRole("button", { name: "İzmir", exact: true }).click();
  await page.getByPlaceholder(/İlçe ara/).fill("Konak");
  await page.getByRole("button", { name: "Konak", exact: true }).click();
  await page.getByRole("button", { name: /Eczaneleri Listele/ }).click();

  const cards = page.getByRole("heading", { level: 3, name: /^TEST ECZANESİ [A-E]$/ });
  await expect(cards).toHaveText(["TEST ECZANESİ A", "TEST ECZANESİ B", "TEST ECZANESİ C"]);
  const expand = page.getByRole("button", { name: /Tüm Eczaneleri Göster \(5\)/ });
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expand.click();
  await expect(cards).toHaveCount(5);
  await expect(page.getByPlaceholder(/İl ara/)).toHaveCount(0);
  expect(queries).toHaveLength(1);

  await page.getByRole("button", { name: "Büyük Yazı" }).click();
  await expect(cards).toHaveCount(5);
  const collapse = page.getByRole("button", { name: "İlk 3 Eczaneyi Göster" });
  await expect(collapse).toHaveAttribute("aria-expanded", "true");
  await collapse.click();
  await expect(cards).toHaveCount(3);
  await expand.click();
  await expect(cards).toHaveCount(5);
  expect(queries).toHaveLength(1);

  await page.getByRole("button", { name: /Başka Bir İl \/ İlçe Ara/ }).click();
  await page.getByPlaceholder(/İlçe ara/).fill("Bornova");
  await page.getByRole("button", { name: "Bornova", exact: true }).click();
  await page.getByRole("button", { name: /Eczaneleri Listele/ }).click();
  await expect(cards).toHaveCount(3);
  await expect(expand).toBeEnabled();
  expect(queries).toHaveLength(2);
  expect(queries[1].searchParams.get("district")).toBe("Bornova");
  expect(unexpectedRequests).toEqual([]);
});
