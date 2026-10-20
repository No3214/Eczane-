import { expect, test } from "@playwright/test";
import type { Pharmacy } from "../types/pharmacy";

test.use({ serviceWorkers: "block" });

test("offline manual searches never display another area's cached pharmacies", async ({ page, context }) => {
  const konak: Pharmacy = {
    id: "browser-query-konak", name: "TEST QUERY KONAK", city: "İzmir", district: "Konak",
    address: "TEST RECORD - NOT A REAL ADDRESS", phone: "", latitude: 38.42, longitude: 27.13,
    source: "mock", source_label: "Yerel tarayıcı test verisi", is_live: false,
    warning_message: "Demo test kaydıdır; gerçek nöbet listesi değildir.",
  };
  const bornova: Pharmacy = { ...konak, id: "browser-query-bornova", name: "TEST QUERY BORNOVA", district: "Bornova" };
  let offline = false;
  const districts: string[] = [];
  const unexpectedRequests: string[] = [];
  await context.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin === "http://localhost:3000" && url.pathname === "/api/pharmacies") {
      const district = url.searchParams.get("district") || "";
      districts.push(district);
      if (offline) {
        await route.fulfill({ status: 503, json: { success: false, error: "TEST OFFLINE" } });
      } else {
        await route.fulfill({ json: { success: true, data: district === "Konak" ? [konak] : [bornova] } });
      }
    } else if (url.origin === "http://localhost:3000" && !url.pathname.startsWith("/api/")) {
      await route.continue();
    } else if (url.origin === "https://api.qrserver.com"
      && url.pathname === "/v1/create-qr-code/"
      && route.request().resourceType() === "image") {
      await route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="black"/></svg>',
      });
    } else {
      unexpectedRequests.push(url.href);
      await route.abort();
    }
  });

  const cards = page.getByRole("heading", { level: 3, name: /^TEST QUERY / });
  const mapToggle = page.getByRole("button", { name: /Haritada Gör/ });
  async function searchDistrict(district: string) {
    await page.getByRole("button", { name: /Başka Bir İl \/ İlçe Ara/ }).click();
    await page.getByPlaceholder(/İlçe ara/).fill(district);
    await page.getByRole("button", { name: district, exact: true }).click();
    await page.getByRole("button", { name: /Eczaneleri Listele/ }).click();
  }

  await page.goto("/");
  await page.getByRole("button", { name: /Konum İzni Olmadan Ara/ }).click();
  await page.getByPlaceholder(/İl ara/).fill("İzmir");
  await page.getByRole("button", { name: "İzmir", exact: true }).click();
  await page.getByPlaceholder(/İlçe ara/).fill("Konak");
  await page.getByRole("button", { name: "Konak", exact: true }).click();
  await page.getByRole("button", { name: /Eczaneleri Listele/ }).click();
  await expect(cards).toHaveText(["TEST QUERY KONAK"]);
  await expect(mapToggle).toBeVisible(); // The real IndexedDB write has settled.

  offline = true;
  await searchDistrict("Bornova");
  await expect(page.getByText(/yerel veritabanında kayıtlı eczane bulunamadı/)).toBeVisible();
  await expect(cards).toHaveCount(0);

  offline = false;
  await searchDistrict("Bornova");
  await expect(cards).toHaveText(["TEST QUERY BORNOVA"]);
  await expect(mapToggle).toBeVisible();

  // The browser snapshot now belongs to Bornova. The real IndexedDB fallback
  // must select the earlier Konak record, rather than reusing that snapshot.
  offline = true;
  await searchDistrict("Konak");
  await expect(cards).toHaveText(["TEST QUERY KONAK"]);
  await expect(page.getByText("Çevrimdışı Çalışma Modu", { exact: true })).toBeVisible();
  await expect(mapToggle).toBeVisible();
  expect(districts).toEqual(["Konak", "Bornova", "Bornova", "Konak"]);
  expect(unexpectedRequests).toEqual([]);
});
