# Eczane independent follow-up review

**READY_FOR_ROOT_PUBLICATION_REVIEW. No blocking finding in the scoped change.**
Reviewed the frozen runtime/config bytes supplied by `/root/recover_portfolio`.
This reviewer made no Eczane source changes, remote calls or deployments and
left the accepted Met2 publication manifest unchanged.

## Findings

When native file sharing rejects with `AbortError`, the outer guard returns
before fallback error logging, a second share call, clipboard writes, downloads
or success alerts. Its structural object/name check
also accepts browser DOMException objects without relying on realm-specific
`instanceof` identity. The independent run confirms cancellation attempts only
the original file share and does not retry or perform fallback effects.

Other image/native-file failures retain the existing fallback path. The file-only
failure case calls text sharing once after the failed file share, with the same
source, optional roster date, uncertainty warning, address, phone and map link.
Demo records remain marked DEMO; records without verified hours do not acquire
an on-duty claim. Missing optional provenance receives the established unknown
source/call-first fallback, without inventing a roster date. Text-share rejection
is caught and cannot silently trigger copy, download or a success message.

The lint and Git ignore changes are exact paths matching `swDest: public/sw.js`
in `next.config.ts`. `swSrc: app/sw.ts` is unchanged and remains linted. The
ESLint API confirms eight scope probes, with the generated file alone ignored;
the worker source retains 112 active rules. Git check-ignore confirms nine
probes, with only `/public/sw.js` ignored. Helper names, nested `sw.js`, TypeScript
sources and the unobserved `public/sw.js.map` are not swept into the Git ignore.
No blanket `public/**`, JavaScript or worker-source exemption was added.

## Independent commands and evidence

- `node tests/pharmacy-share.node.cjs`: **15 named cases passed, 0 failed**,
  exit 0, 20 October 2026 at 12:02:18–12:02:20 UTC.
- Direct installed ESLint API ignore checks: **8 expectations passed**, exit 0.
- Git `check-ignore --no-index --verbose --stdin` against the candidate using an
  isolated reviewer Git directory: only the intended generated output matched.
- All 10 pinned runtime, test, dependency-manifest and configuration files were
  unchanged after the commands and final report check. Both Node commands
  recorded zero observed external-network attempts under the copied guard.

Exact hashes are in `source-pins.json`; test stdout and command receipt are
`independent-share.log` and `independent-share.json`. Ignore results are in
`eslint-ignore-scope.json`, `eslint-ignore-command.json`, and
`git-ignore-scope.json`. The tested handler is the actual component's button
callback, compiled by the repository harness with isolated module/browser stubs.

## Limits

This review does not rerun or claim the author's full Vitest, TypeScript, lint,
Webpack build or default build gates. Those receipts remain the author's separate
evidence. No real browser share dialog, permission prompt, clipboard write,
download, PNG conversion or third-party QR request was performed. ShareCard's
provenance markup was inspected; these 15 handler cases stub that component and
do not validate exported-image pixels. The exact-path ignore scope covers the
currently configured generated output, without asserting future build artifacts.

## Reviewed hashes

| Path | SHA256 |
| --- | --- |
| `components/PharmacyCard.tsx` | `c2f6d11872a33fe2d710d2f0a57f3ef1d254fa84c1c157dec0bcef7ef205679b` |
| `tests/pharmacy-share.node.cjs` | `d1ef650b12ea98edbf6fbc3643eee99908e3b36b5c5870d2df332c94a2b95eeb` |
| `eslint.config.mjs` | `1473b4313fc9a03b2904e82d695e2c9ad7c34b52736342d29a5ba8652349a5f9` |
| `.gitignore` | `e047bd384439081ceac27ab9b9fd5f7d7423cad4f3e754a1b7b74b4fd01cb2f1` |
| `next.config.ts` | `6304cb4005e59f80661763146ec802e838f7f227e4b072c5ac6dfca77e25df01` |
| `app/sw.ts` | `9afb1a42ae5d0e50793370de29750f1fddbfbb7b3d625ffa41231a421f8903a6` |
