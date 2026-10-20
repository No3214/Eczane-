/* eslint-disable @typescript-eslint/no-require-imports -- Node-only CommonJS harness with isolated module stubs. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Execute the actual component and its button handler, without rendering a DOM,
// fetching ShareCard's QR image, downloading files, or opening a share dialog.
const sourcePath = path.join(__dirname, "../components/PharmacyCard.tsx");
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, "utf8"), {
  fileName: sourcePath,
  reportDiagnostics: true,
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
});
assert.equal(
  compiled.diagnostics.filter((item) => item.category === ts.DiagnosticCategory.Error).length,
  0,
  "PharmacyCard must transpile before its real handler is tested",
);

const demo = Object.freeze({
  id: "local-share-fixture",
  name: "Örnek Eczanesi",
  city: "İzmir",
  district: "Konak",
  address: "Örnek Sokak No: 1 (test verisi)",
  phone: "0000000000",
  latitude: 0,
  longitude: 0,
  source: "mock",
  source_label: "Yerel demo kaydı",
  roster_date: "2026-10-19",
  warning_message: "Bu kayıt demo verisidir; gerçek nöbet listesi değildir.",
});
const official = Object.freeze({
  ...demo,
  source: "official_fixture",
  source_label: "Resmî kaynak test örneği",
  warning_message: "Nöbet saatleri doğrulanmadı; yola çıkmadan önce arayın.",
});
const defaultWarning = "Yola çıkmadan önce eczaneyi arayıp nöbet durumunu teyit edin.";

function textContent(node) {
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node?.props ? textContent(node.props.children) : "";
}

function findShareButtons(node) {
  if (Array.isArray(node)) return node.flatMap(findShareButtons);
  if (!node?.props) return [];
  if (node.type === "button" && textContent(node).trim() === "Bilgileri Paylaş") return [node];
  return findShareButtons(node.props.children);
}

function mountHandler(pharmacy, options = {}) {
  const calls = {
    images: [], shares: [], copies: [], downloads: [], revoked: [], alerts: [],
    errors: [], warnings: [], network: [],
  };
  const captureNode = {};
  const image = { type: "image/png" };
  const noNetwork = () => {
    calls.network.push("attempt");
    throw new Error("Network is disabled in share-handler tests");
  };
  const navigator = {};
  if (options.fileSharing !== "absent") navigator.canShare = () => options.fileSharing !== false;
  if (options.nativeShare !== false) {
    navigator.share = async (payload) => {
      calls.shares.push(payload);
      if (options.shareError && (!options.fileErrorOnly || payload.files)) throw options.shareError;
    };
  }
  if (options.clipboard !== false) {
    navigator.clipboard = {
      writeText: async (text) => {
        calls.copies.push(text);
        if (options.clipboardError) throw options.clipboardError;
      },
    };
  }
  const inertComponent = () => null;
  const jsx = (type, props) => ({ type, props });
  const imports = {
    react: { useState: (value) => [value, () => {}], useRef: () => ({ current: options.missingRef ? null : captureNode }) },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@/lib/distance": { formatDistance: () => "test mesafesi" },
    "@/lib/phone": {
      getPhoneUrl: () => "tel:0000000000",
      getWhatsappUrl: () => "https://example.invalid/unused",
      normalizePhone: () => "0000000000",
    },
    "lucide-react": Object.fromEntries(
      ["Phone", "MessageCircle", "MapPin", "AlertTriangle", "Navigation", "Clock", "Share2"].map((name) => [name, inertComponent]),
    ),
    "@/components/MapChoiceSheet": inertComponent,
    "@/components/ReportDialog": inertComponent,
    "@/components/ShareCard": inertComponent,
    "html-to-image": {
      toBlob: async (node, settings) => {
        calls.images.push({ node, settings });
        if (options.imageError) throw options.imageError;
        return options.nullImage ? null : image;
      },
    },
  };
  const exports = {};
  vm.runInNewContext(compiled.outputText, {
    exports,
    require: (name) => {
      assert.ok(Object.hasOwn(imports, name), `Unexpected component import: ${name}`);
      return imports[name];
    },
    process: { env: {} },
    window: { fetch: noNetwork },
    navigator,
    File: class FakeFile {
      constructor(parts, name, settings) { Object.assign(this, { parts, name, type: settings.type }); }
    },
    URL: {
      createObjectURL: (blob) => { assert.equal(blob, image); return "blob:local-test"; },
      revokeObjectURL: (url) => calls.revoked.push(url),
    },
    document: {
      createElement: (tag) => {
        assert.equal(tag, "a");
        const link = { click: () => calls.downloads.push({ href: link.href, download: link.download }) };
        return link;
      },
    },
    alert: (message) => calls.alerts.push(message),
    console: { error: (...args) => calls.errors.push(args), warn: (...args) => calls.warnings.push(args) },
    fetch: noNetwork,
    XMLHttpRequest: noNetwork,
    WebSocket: noNetwork,
  }, { filename: sourcePath, timeout: 1000 });

  const tree = exports.default({ pharmacy, index: 0, elderMode: options.elderMode ?? false });
  const buttons = findShareButtons(tree);
  assert.equal(buttons.length, 1, "Locate the actual visible share button in PharmacyCard");
  assert.equal(typeof buttons[0].props.onClick, "function");
  return {
    calls,
    async click() {
      await buttons[0].props.onClick();
      assert.equal(calls.network.length, 0, "Sharing must not request a provider or QR service in this harness");
    },
  };
}

function assertProvenance(text, pharmacy) {
  const required = [
    pharmacy.name,
    pharmacy.address,
    pharmacy.phone,
    `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`,
    pharmacy.source === "mock" ? "DEMO VERİ" : "NÖBET SAATLERİ TEYİT EDİLMEDİ",
    `Kaynak: ${pharmacy.source_label || "Bilinmiyor"}`,
    pharmacy.warning_message || defaultWarning,
  ];
  if (pharmacy.roster_date) required.push(`Liste tarihi: ${pharmacy.roster_date}`);
  for (const value of required) assert.ok(text.includes(value), `Share text must retain: ${value}`);
  if (!pharmacy.roster_date) assert.ok(!text.includes("Liste tarihi:"), "Do not invent a roster date");
  assert.ok(!/undefined|null/.test(text));
}

function assertShare(payload, pharmacy) {
  assertProvenance(payload.text, pharmacy);
  assert.ok(payload.title.includes(pharmacy.name));
  assert.doesNotMatch(payload.title, /nöbetçi|açık|aktif/i, "Unverified records must not be advertised as on-duty");
}

test("native image sharing retains demo status, source, roster date and warning", async () => {
  const h = mountHandler(demo);
  await h.click();
  assert.equal(h.calls.shares.length, 1);
  assertShare(h.calls.shares[0], demo);
  assert.equal(h.calls.shares[0].files.length, 1);
  assert.equal(h.calls.shares[0].files[0].type, "image/png");
  assert.equal(h.calls.shares[0].files[0].name, "Örnek_Eczanesi_eczane_bilgisi.png");
  assert.equal(h.calls.copies.length + h.calls.downloads.length + h.calls.alerts.length, 0);
});

test("an official-source fixture still shares unverified hours and its own warning", async () => {
  const h = mountHandler(official, { elderMode: true });
  await h.click();
  assertShare(h.calls.shares[0], official);
});

test("legacy metadata-free records get an unknown source and the call-first warning", async () => {
  const legacy = { ...demo };
  for (const key of ["source", "source_label", "roster_date", "warning_message"]) delete legacy[key];
  // Deliberately absent optional metadata must remain absent rather than gain today's date.
  const h = mountHandler(legacy);
  await h.click();
  assertShare(h.calls.shares[0], legacy);
});

test("an image-rendering error falls back to native text with the same provenance", async () => {
  const h = mountHandler(demo, { imageError: new Error("image unavailable") });
  await h.click();
  assert.equal(h.calls.shares.length, 1);
  assertShare(h.calls.shares[0], demo);
  assert.equal(h.calls.shares[0].files, undefined);
  assert.equal(h.calls.errors.length, 1);
  assert.equal(h.calls.copies.length + h.calls.downloads.length, 0);
});

test("a null image falls back to native text with unverified official-source status", async () => {
  const h = mountHandler(official, { nullImage: true });
  await h.click();
  assert.equal(h.calls.shares.length, 1);
  assertShare(h.calls.shares[0], official);
  assert.equal(h.calls.shares[0].files, undefined);
});

test("unsupported file sharing downloads the image and copies full provenance", async () => {
  const h = mountHandler(demo, { fileSharing: false });
  await h.click();
  assert.equal(h.calls.shares.length, 0);
  assert.equal(h.calls.copies.length, 1);
  assertProvenance(h.calls.copies[0], demo);
  assert.equal(h.calls.downloads.length, 1);
  assert.equal(h.calls.downloads[0].href, "blob:local-test");
  assert.equal(h.calls.downloads[0].download, "Örnek Eczanesi_eczane_bilgisi.png");
  assert.deepEqual(h.calls.revoked, ["blob:local-test"]);
  assert.deepEqual(h.calls.alerts, ["Eczane bilgi görseli indirildi ve detaylar panoya kopyalandı!"]);
});

test("absent canShare uses the existing download and clipboard route", async () => {
  const h = mountHandler(official, { fileSharing: "absent" });
  await h.click();
  assertProvenance(h.calls.copies[0], official);
  assert.equal(h.calls.downloads.length, 1);
  assert.equal(h.calls.shares.length, 0);
});

test("image failure without native share copies the complete warning", async () => {
  const h = mountHandler(demo, { imageError: new Error("image unavailable"), nativeShare: false });
  await h.click();
  assert.equal(h.calls.copies.length, 1);
  assertProvenance(h.calls.copies[0], demo);
  assert.equal(h.calls.downloads.length + h.calls.shares.length, 0);
  assert.deepEqual(h.calls.alerts, ["Eczane bilgileri panoya kopyalandı!"]);
});

test("clipboard denial after download falls back to native text without a success alert", async () => {
  const h = mountHandler(demo, { fileSharing: false, clipboardError: new Error("permission denied") });
  await h.click();
  assertProvenance(h.calls.copies[0], demo);
  assert.equal(h.calls.downloads.length, 1);
  assert.equal(h.calls.shares.length, 1);
  assertShare(h.calls.shares[0], demo);
  assert.equal(h.calls.shares[0].files, undefined);
  assert.equal(h.calls.alerts.length, 0);
});

test("native cancellation ends sharing without retrying or performing fallback effects", async () => {
  const cancelled = Object.assign(new Error("cancelled"), { name: "AbortError" });
  const h = mountHandler(demo, { shareError: cancelled });
  await assert.doesNotReject(() => h.click());
  assert.equal(h.calls.shares.length, 1, "Cancelling the native dialog must not open a second one");
  assertShare(h.calls.shares[0], demo);
  assert.equal(h.calls.shares[0].files.length, 1);
  assert.equal(h.calls.warnings.length + h.calls.errors.length, 0);
  assert.equal(h.calls.copies.length + h.calls.downloads.length + h.calls.alerts.length, 0);
});

test("a non-cancellation native file error still falls back to successful text sharing", async () => {
  const h = mountHandler(official, { shareError: new Error("file sharing unavailable"), fileErrorOnly: true });
  await assert.doesNotReject(() => h.click());
  assert.equal(h.calls.shares.length, 2);
  for (const payload of h.calls.shares) assertShare(payload, official);
  assert.equal(h.calls.shares[0].files.length, 1);
  assert.equal(h.calls.shares[1].files, undefined);
  assert.equal(h.calls.errors.length, 1);
  assert.equal(h.calls.warnings.length, 0);
  assert.equal(h.calls.copies.length + h.calls.downloads.length + h.calls.alerts.length, 0);
});

test("text-only cancellation is caught and does not claim success or copy silently", async () => {
  const h = mountHandler(official, { imageError: new Error("image unavailable"), shareError: new Error("cancelled") });
  await assert.doesNotReject(() => h.click());
  assertShare(h.calls.shares[0], official);
  assert.equal(h.calls.shares.length, 1);
  assert.equal(h.calls.warnings.length, 1);
  assert.equal(h.calls.copies.length + h.calls.downloads.length + h.calls.alerts.length, 0);
});

test("clipboard-only denial is caught without a success alert", async () => {
  const h = mountHandler(demo, { nullImage: true, nativeShare: false, clipboardError: new Error("permission denied") });
  await assert.doesNotReject(() => h.click());
  assertProvenance(h.calls.copies[0], demo);
  assert.equal(h.calls.errors.length, 2);
  assert.equal(h.calls.alerts.length, 0);
});

test("missing native-share and clipboard APIs remain a handled failure", async () => {
  const h = mountHandler(demo, { nullImage: true, nativeShare: false, clipboard: false });
  await assert.doesNotReject(() => h.click());
  assert.equal(h.calls.errors.length, 2);
  assert.equal(h.calls.shares.length + h.calls.copies.length + h.calls.downloads.length + h.calls.alerts.length, 0);
});

test("a missing capture ref keeps the existing no-op behavior", async () => {
  const h = mountHandler(demo, { missingRef: true });
  await h.click();
  for (const entries of Object.values(h.calls)) assert.equal(entries.length, 0);
});
