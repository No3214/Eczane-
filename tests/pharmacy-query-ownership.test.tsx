// @vitest-environment jsdom
import { StrictMode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePharmacies } from "@/lib/hooks/usePharmacies";
import type { Pharmacy } from "@/types/pharmacy";

const database = vi.hoisted(() => ({ read: vi.fn(), bulkPut: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: { pharmacies: {
    bulkPut: database.bulkPut,
    toArray: database.read,
  } },
}));

const konak: Pharmacy = {
  id: "query-test-konak", name: "TEST KONAK", city: "İzmir", district: "Konak",
  address: "TEST RECORD — NOT A REAL ADDRESS", phone: "", latitude: 38.42, longitude: 27.13,
  source: "mock", is_live: false, warning_message: "Yerel test verisidir.",
};
const bornova: Pharmacy = { ...konak, id: "query-test-bornova", name: "TEST BORNOVA", district: "Bornova", latitude: 38.46, longitude: 27.22 };
const response = (rows: Pharmacy[], status = 200) => new Response(JSON.stringify({ success: true, data: rows }), { status });
const fetchMock = vi.fn<typeof fetch>();

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  database.read.mockReset().mockResolvedValue([]);
  database.bulkPut.mockReset().mockResolvedValue(undefined);
  // Return unfiltered stored rows. Area normalization belongs to the hook, not
  // a mock implementation of Dexie's locale-independent indexed case folding.
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type Hook = ReturnType<typeof renderHook<ReturnType<typeof usePharmacies>, unknown>>;
function begin(hook: Hook, ...args: Parameters<ReturnType<typeof usePharmacies>["fetchPharmacies"]>) {
  let request!: Promise<void>;
  act(() => { request = hook.result.current.fetchPharmacies(...args); });
  return request;
}
async function finish(request: Promise<void>) {
  await act(async () => { await request; });
}
async function load(hook: Hook, rows: Pharmacy[], ...args: Parameters<ReturnType<typeof usePharmacies>["fetchPharmacies"]>) {
  fetchMock.mockResolvedValueOnce(response(rows));
  await finish(begin(hook, ...args));
}

describe("pharmacy request ownership", () => {
  it("ignores an older success after the newer manual query has completed, including cache writes", async () => {
    const hook = renderHook(() => usePharmacies());
    const first = deferred<Response>();
    fetchMock.mockReturnValueOnce(first.promise);
    const oldRequest = begin(hook, undefined, undefined, "İzmir", "Konak");
    await load(hook, [bornova], undefined, undefined, "İzmir", "Bornova");
    await act(async () => { first.resolve(response([konak])); await oldRequest; });
    expect(hook.result.current.pharmacies).toEqual([bornova]);
    expect(database.bulkPut).toHaveBeenCalledTimes(1);
    hook.unmount();
    const fresh = renderHook(() => usePharmacies());
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(fresh, undefined, undefined, "İzmir", "Bornova"));
    expect(fresh.result.current.pharmacies).toEqual([bornova]);
  });

  it("also checks ownership after JSON body parsing completes", async () => {
    const hook = renderHook(() => usePharmacies());
    const body = deferred<{ success: boolean; data: Pharmacy[] }>();
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => body.promise } as Response);
    const oldRequest = begin(hook, undefined, undefined, "İzmir", "Konak");
    await act(async () => { await Promise.resolve(); });
    await load(hook, [bornova], undefined, undefined, "İzmir", "Bornova");
    await act(async () => { body.resolve({ success: true, data: [konak] }); await oldRequest; });
    expect(hook.result.current.pharmacies).toEqual([bornova]);
    expect(database.bulkPut).toHaveBeenCalledTimes(1);
  });

  it("does not let an older failed query mark a newer online result as offline", async () => {
    const hook = renderHook(() => usePharmacies());
    const first = deferred<Response>();
    fetchMock.mockReturnValueOnce(first.promise);
    const oldRequest = begin(hook, undefined, undefined, "İzmir", "Konak");
    await load(hook, [bornova], undefined, undefined, "İzmir", "Bornova");
    await act(async () => { first.reject(new Error("old failure")); await oldRequest; });
    expect(hook.result.current.pharmacies).toEqual([bornova]);
    expect(hook.result.current.isOfflineData).toBe(false);
    expect(hook.result.current.error).toBeNull();
    expect(database.read).not.toHaveBeenCalled();
  });

  it("keeps loading true when an old request fails while a new request is pending", async () => {
    const hook = renderHook(() => usePharmacies());
    const first = deferred<Response>();
    const second = deferred<Response>();
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const oldRequest = begin(hook, undefined, undefined, "İzmir", "Konak");
    const currentRequest = begin(hook, undefined, undefined, "İzmir", "Bornova");
    await act(async () => { first.reject(new Error("old failure")); await oldRequest; });
    expect(hook.result.current.loading).toBe(true);
    expect(hook.result.current.error).toBeNull();
    await act(async () => { second.resolve(response([bornova])); await currentRequest; });
    expect(hook.result.current.loading).toBe(false);
  });

  it("does not apply an old asynchronous database fallback after a newer online result", async () => {
    const hook = renderHook(() => usePharmacies());
    const cacheRead = deferred<Pharmacy[]>();
    database.read.mockReturnValueOnce(cacheRead.promise);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const oldRequest = begin(hook, undefined, undefined, "İzmir", "Konak");
    await act(async () => { await Promise.resolve(); });
    expect(database.read).toHaveBeenCalledTimes(1);
    await load(hook, [bornova], undefined, undefined, "İzmir", "Bornova");
    await act(async () => { cacheRead.resolve([konak]); await oldRequest; });
    expect(hook.result.current.pharmacies).toEqual([bornova]);
    expect(hook.result.current.isOfflineData).toBe(false);
    expect(hook.result.current.error).toBeNull();
  });

  it("keeps the new query loading when the old query's cache write completes", async () => {
    const hook = renderHook(() => usePharmacies());
    const write = deferred<void>();
    const next = deferred<Response>();
    database.bulkPut.mockReturnValueOnce(write.promise);
    fetchMock.mockResolvedValueOnce(response([konak])).mockReturnValueOnce(next.promise);
    const oldRequest = begin(hook, undefined, undefined, "İzmir", "Konak");
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(database.bulkPut).toHaveBeenCalledTimes(1);
    const currentRequest = begin(hook, undefined, undefined, "İzmir", "Bornova");
    await act(async () => { write.resolve(); await oldRequest; });
    expect(hook.result.current.loading).toBe(true);
    await act(async () => { next.resolve(response([bornova])); await currentRequest; });
    expect(hook.result.current.pharmacies).toEqual([bornova]);
  });

  it("ignores a response after the hook has unmounted without writing caches", async () => {
    const hook = renderHook(() => usePharmacies());
    const pending = deferred<Response>();
    fetchMock.mockReturnValueOnce(pending.promise);
    const request = begin(hook, undefined, undefined, "İzmir", "Konak");
    hook.unmount();
    await act(async () => { pending.resolve(response([konak])); await request; });
    expect(database.bulkPut).not.toHaveBeenCalled();
    expect(localStorage.getItem("last_viewed_pharmacies")).toBeNull();
  });

  it("ignores a retained GPS callback invoked after unmount, while allowing requests after StrictMode effect replay", async () => {
    const hook = renderHook(() => usePharmacies(), { wrapper: StrictMode });
    await load(hook, [konak], 38.42, 27.13);
    expect(hook.result.current.pharmacies).toEqual([konak]);
    const retainedGpsCallback = hook.result.current.fetchPharmacies;
    const cachedBeforeNavigation = localStorage.getItem("last_viewed_pharmacies");
    fetchMock.mockClear();
    database.bulkPut.mockClear();
    const cacheWrites = vi.spyOn(Storage.prototype, "setItem");
    hook.unmount();

    fetchMock.mockResolvedValueOnce(response([bornova]));
    await finish(retainedGpsCallback(38.46, 27.22));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(database.bulkPut).not.toHaveBeenCalled();
    expect(cacheWrites).not.toHaveBeenCalled();
    expect(localStorage.getItem("last_viewed_pharmacies")).toBe(cachedBeforeNavigation);
  });
});

describe("offline results belong to the requested area", () => {
  it("restores a matching manual query in a fresh hook instance", async () => {
    const first = renderHook(() => usePharmacies());
    await load(first, [konak], undefined, undefined, "İzmir", "Konak");
    first.unmount();
    const second = renderHook(() => usePharmacies());
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(second, undefined, undefined, "İzmir", "Konak"));
    expect(second.result.current.pharmacies).toEqual([konak]);
    expect(second.result.current.isOfflineData).toBe(true);
    expect(second.result.current.error).toContain("önbelle");
    expect(database.read).not.toHaveBeenCalled();
  });

  it("uses matching database rows instead of another district's latest browser snapshot", async () => {
    const hook = renderHook(() => usePharmacies());
    await load(hook, [konak], undefined, undefined, "İzmir", "Konak");
    database.read.mockResolvedValueOnce([konak, bornova]);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, undefined, undefined, "İzmir", "Bornova"));
    expect(hook.result.current.pharmacies).toEqual([bornova]);
    expect(hook.result.current.isOfflineData).toBe(true);
  });

  it.each(["İzmir", "izmir", "  İZMİR  "])("restores only valid matching IndexedDB rows for Turkish city variant %s", async (city) => {
    const hook = renderHook(() => usePharmacies());
    await load(hook, [bornova], undefined, undefined, "İzmir", "Bornova");
    const paddedKonak = { ...konak, city: " İZMİR ", district: " KONAK " };
    database.read.mockResolvedValueOnce([
      null,
      { ...konak, id: "broken-city", city: null },
      { ...konak, id: "broken-coordinate", latitude: NaN },
      { ...konak, id: "another-city", city: "Ankara" },
      bornova,
      paddedKonak,
    ]);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, undefined, undefined, city, " konak "));
    expect(database.read).toHaveBeenCalledTimes(1);
    expect(hook.result.current.pharmacies).toEqual([paddedKonak]);
    expect(hook.result.current.isOfflineData).toBe(true);
  });

  it("matches dotless Turkish I in cached city and district without accepting a different city", async () => {
    const row = { ...konak, id: "igdir-record", city: " IĞDIR ", district: " ARALIK " };
    database.read.mockResolvedValueOnce([row, { ...row, id: "different-city", city: "ığdırx" }]);
    const hook = renderHook(() => usePharmacies());
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, undefined, undefined, "ığdır", "aralık"));
    expect(hook.result.current.pharmacies).toEqual([row]);
    expect(hook.result.current.isOfflineData).toBe(true);
  });

  it("clears the old result when the new area fails and has no matching cached records", async () => {
    const hook = renderHook(() => usePharmacies());
    await load(hook, [konak], undefined, undefined, "İzmir", "Konak");
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, undefined, undefined, "İzmir", "Bornova"));
    expect(hook.result.current.pharmacies).toEqual([]);
    expect(hook.result.current.isOfflineData).toBe(false);
    expect(hook.result.current.error).toBeTruthy();
  });

  it("restores a query-tagged GPS snapshot only for the same coordinates", async () => {
    const hook = renderHook(() => usePharmacies());
    await load(hook, [konak], 38.42, 27.13);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, 38.42, 27.13));
    expect(hook.result.current.pharmacies).toEqual([konak]);
    expect(hook.result.current.isOfflineData).toBe(true);
  });

  it("does not assign a different GPS area's snapshot or arbitrary database records to a new location", async () => {
    const hook = renderHook(() => usePharmacies());
    await load(hook, [konak], 38.42, 27.13);
    database.read.mockResolvedValue([konak]);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, 41.01, 28.97));
    expect(hook.result.current.pharmacies).toEqual([]);
    expect(hook.result.current.isOfflineData).toBe(false);
  });

  it("matches Turkish manual-area names across case and surrounding whitespace", async () => {
    const hook = renderHook(() => usePharmacies());
    await load(hook, [konak], undefined, undefined, "İzmir", "Konak");
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, undefined, undefined, " izmir ", " KONAK "));
    expect(hook.result.current.pharmacies).toEqual([konak]);
    expect(database.read).not.toHaveBeenCalled();
  });

  it("keeps a matching empty snapshot from resurrecting older database records", async () => {
    const hook = renderHook(() => usePharmacies());
    await load(hook, [konak], undefined, undefined, "İzmir", "Konak");
    await load(hook, [], undefined, undefined, "İzmir", "Konak");
    database.read.mockResolvedValue([konak]);
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, undefined, undefined, "İzmir", "Konak"));
    expect(hook.result.current.pharmacies).toEqual([]);
    expect(database.read).not.toHaveBeenCalled();
  });

  it("filters a matching legacy manual snapshot by both city and district", async () => {
    localStorage.setItem("last_viewed_pharmacies", JSON.stringify([konak, bornova, { ...konak, id: "other-city", city: "Ankara" }]));
    localStorage.setItem("last_search_query", JSON.stringify({ city: "İzmir", district: "Konak" }));
    const hook = renderHook(() => usePharmacies());
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, undefined, undefined, "İzmir", "Konak"));
    expect(hook.result.current.pharmacies).toEqual([konak]);
  });

  it("rejects a legacy GPS list whose separate query tag cannot establish an atomic snapshot", async () => {
    localStorage.setItem("last_viewed_pharmacies", JSON.stringify([konak]));
    localStorage.setItem("last_search_query", JSON.stringify({ lat: 38.42, lng: 27.13 }));
    database.read.mockResolvedValue([konak]);
    const hook = renderHook(() => usePharmacies());
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, 38.42, 27.13));
    expect(hook.result.current.pharmacies).toEqual([]);
    expect(hook.result.current.isOfflineData).toBe(false);
  });

  it.each([JSON.stringify({ unexpected: "shape" }), JSON.stringify([null]), "{broken"])("ignores malformed browser cache and still tries a scoped database fallback: %s", async (raw) => {
    localStorage.setItem("last_viewed_pharmacies", raw);
    localStorage.setItem("last_search_query", JSON.stringify({ city: "İzmir", district: "Konak" }));
    database.read.mockResolvedValue([konak]);
    const hook = renderHook(() => usePharmacies());
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, undefined, undefined, "İzmir", "Konak"));
    expect(hook.result.current.pharmacies).toEqual([konak]);
    expect(hook.result.current.isOfflineData).toBe(true);
  });

  it("preserves an online result when browser storage denies writes", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage quota"); });
    const hook = renderHook(() => usePharmacies());
    await load(hook, [konak], undefined, undefined, "İzmir", "Konak");
    expect(hook.result.current.pharmacies).toEqual([konak]);
    expect(hook.result.current.isOfflineData).toBe(false);
    expect(hook.result.current.error).toBeNull();
    expect(database.bulkPut).toHaveBeenCalledTimes(1);
  });

  it("falls back to the scoped database even when browser storage denies reads", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("storage denied"); });
    database.read.mockResolvedValue([konak]);
    const hook = renderHook(() => usePharmacies());
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    await finish(begin(hook, undefined, undefined, "İzmir", "Konak"));
    expect(hook.result.current.pharmacies).toEqual([konak]);
    expect(hook.result.current.isOfflineData).toBe(true);
  });

  it("does not accept a non-success HTTP response as an online result", async () => {
    const hook = renderHook(() => usePharmacies());
    fetchMock.mockResolvedValueOnce(response([konak], 503));
    await finish(begin(hook, undefined, undefined, "İzmir", "Konak"));
    expect(hook.result.current.pharmacies).toEqual([]);
    expect(hook.result.current.error).toBeTruthy();
    expect(database.bulkPut).not.toHaveBeenCalled();
  });
});
