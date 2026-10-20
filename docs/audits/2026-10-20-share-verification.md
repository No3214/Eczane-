# Eczane sharing and build verification — 20 October 2026

The five-file candidate for PR #2 is ready for review against parent
`2f733bc472f0aea50e37afc8ec2214a87ecf8ba5`, tree
`e745555eef38c4b26f72b31c92f219fd72467f6a`. It completes the recovered sharing
correction and fixes two defects observed during this review.

## Resulting behavior

Shared text retains the card's demo/unverified status, source label, optional
roster date and call-first warning on native and clipboard paths. A missing
date stays absent. Titles use “Eczane Bilgisi”; native/download image filenames
use `_eczane_bilgisi.png` so they do not imply a verified on-duty pharmacy.

Cancelling the native share dialog now ends the action. The prior outer catch
opened a second text-share dialog on `AbortError`; an early return prevents
that retry and all copy/download/success effects. A separate regression proves
that an actual native file-sharing error still falls back to text with the same
provenance. The default `npm test` command includes all 15 handler cases.

A production build also exposed generated-code lint errors. `next.config.ts`
declares Serwist source `app/sw.ts` and output `public/sw.js`. ESLint now ignores
only `public/sw.js`, with matching `/public/sw.js` in the Git ignore file.
The source worker remains linted, no rule was disabled, and no source map was
observed or excluded. The generated worker stayed in place for the successful
final build → lint sequence; moving or deleting it is not required.

Application/config changes are limited to `components/PharmacyCard.tsx`,
`tests/pharmacy-share.node.cjs`, `package.json`, `eslint.config.mjs` and
`.gitignore`. Provider contracts, dependencies, lockfile, visible JSX, existing
Vitest cases and worker source are unchanged.

## Fresh verification

| Command or control | Observed result |
| --- | --- |
| Final `npm test` | 119 Vitest cases in 18 files plus 15 handler cases passed; zero failures. |
| Final `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Exit 0. |
| Final `node node_modules/next/dist/bin/next build --webpack` | Exit 0; compilation, TypeScript, 8 static pages, traces and service worker completed. |
| `npm run lint` after that build | Exit 0, 0 errors and 3 pre-existing unused-import warnings. Generated worker remains present. |
| Original 14-case harness on parent code | 12 failures, 2 passes; the missing sharing provenance is reproduced. |
| Final 15-case harness before the cancellation fix | 1 failure, 14 passes: cancellation made two share calls instead of one. |
| Lint after build, before the generated-output ignore fix | Exit 1, 1 error and 75 warnings; the error was in generated `public/sw.js`. |
| Final patch applied to verified parent files | All 5 changed files match exactly; 93 other materialized files preserved. |

An earlier `npm run build` on the recovered v2 source failed in Turbopack's CSS
transform because a subprocess could not bind a port (`EPERM`). That receipt is
retained as an environment-blocked result on its earlier source phase. It was
not rerun on the final candidate. The final supported webpack build is a
separate successful command, not a claimed default-build pass. No sandbox
escalation was requested for this work.

All retained command runs preserve their 98 monitored source/test/assets files
and record zero guarded external network attempts. Each receipt names its
source phase; repeated runs and failing controls are not added as new coverage.
The final four gates bind to one source manifest. Handler tests execute the
actual component's button callback with browser/image/React boundaries stubbed.

## Evidence and limits

[The verification summary](../../proof/share-2026-10-20/verification-summary.json)
maps every receipt, raw log and source phase.
[The source manifest](../../proof/share-2026-10-20/source-manifest.json) records
parent, recovered-v2 and final blob identities. The
[generated-worker record](../../proof/share-2026-10-20/generated-worker.json),
[patch check](../../proof/share-2026-10-20/patch-check.json),
[dependency provenance](../../proof/share-2026-10-20/dependency-provenance.json)
and [evidence index](../../proof/share-2026-10-20/EVIDENCE_INDEX.json) bind the
remaining evidence to exact bytes.

Recovery verified 97 parent blobs against the retained complete 422-blob tree.
The 325 unmaterialized historical/agent entries must be retained from the
parent tree and are not claimed as newly audited. Existing scratch dependencies
were copied locally without installation or download. All 564 present locked
package versions matched; 82 absent entries are optional. This metadata check
does not reverify every cached byte against registry tarballs.

Actual browser/mobile sharing, image capture, live provider freshness, QR
requests, installed-PWA behavior and final-head hosted CI remain unverified.
The separate show-all/location-picker behavior is outside this patch.
No merge, deployment, live pharmacy request or real external share was performed.
Recorded harness files are archives with the original scratch layout, not
portable installers. Publication must recheck the parent and branch, retain
unlisted tree entries, and perform a separate remote readback.
