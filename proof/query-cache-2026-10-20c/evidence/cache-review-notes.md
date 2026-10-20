# Query ownership and offline area cache review

## Proven issue

The published parent `ccc6e4590ecf50a0326280cdfdfb0ec0de32f9f8` had no ownership check between concurrent `fetchPharmacies` calls. A slow old response could replace a newer result, write the browser snapshot and IndexedDB rows after it had become obsolete, mark the newer result offline, or clear the newer request's loading state. The fallback also reused one global browser array without matching the active query. GPS fallback could take arbitrary rows from the global database, and a failed new area could retain the prior area's visible results.

The same new 22 unit cases produced 18 failures and 4 passes with the unchanged parent hook. The candidate hook passed all 22, along with all 11 existing Home result tests. The network guard observed no attempted external requests. Exact raw logs, receipts, source manifests, and the unchanged parent hook are retained beside this note.

## Behavior changed

- A monotonically increasing request identity owns the current state. Completion checks follow `fetch`, JSON parsing and IndexedDB reads; only the current identity clears loading. Unmount invalidates pending identities.
- A browser snapshot stores its version, query identity and rows in one localStorage value. A separate mutable query tag cannot label another area's rows.
- Manual snapshots and database results must match both the requested city and district, using trimmed Turkish case normalization. A failed search without matching rows clears the prior result.
- A GPS fallback requires an exact query-bound coordinate snapshot. The old unbound GPS array and arbitrary global database rows are not enough to establish a location match.
- A matching empty snapshot remains empty rather than resurrecting older database rows. Invalid cached core row shapes and storage access failures do not defeat the scoped database fallback.
- A successful online response remains online if localStorage is unavailable or full. A non-success HTTP status is not an online success even if its JSON payload claims success.

## Deliberate boundaries

The request still runs if it becomes obsolete; the fix guards publication of state and initiation of cache writes rather than canceling the underlying transport. A database write already started while its request was current is allowed to finish. Old visible cards remain during a pending search to preserve the existing Home behavior, and are replaced or cleared when the current request resolves. No provider metadata, database schema, cache expiry policy, duty-hours verification, PWA service worker, or external API contract is changed.

Legacy manual arrays can be recovered only when their separate legacy area tag matches and each returned row belongs to that area. Legacy GPS arrays are intentionally not recovered, because their separate query tag cannot prove an atomic location snapshot. Exact GPS coordinate matching is conservative: moving even slightly requires a new online response before that location can be restored offline.

The cached-row check covers required core strings and finite numeric coordinates. It is not a complete schema validator for every optional metadata field. Cached entries can be old; area consistency does not establish current pharmacy duty status.

## Browser acceptance added

`tests/cache-area.spec.ts` uses the real Home, manual picker, localStorage and IndexedDB. The API boundary supplies clearly synthetic pharmacy data, service workers are blocked, and unexpected non-local requests fail the scenario. It seeds Konak online, fails an uncached Bornova search and requires no cards, seeds Bornova online, then fails a Konak search and requires the actual IndexedDB Konak entry instead of the newer Bornova snapshot. The new spec is discovered in Chromium, Firefox and WebKit, raising the configured suite from 12 to 15 cases. Discovery is not browser execution; current-source hosted acceptance remains required.

## Intermediate source frozen for the initial 22-case focused review

| File | SHA-256 |
|---|---|
| `lib/hooks/usePharmacies.ts` | `57a363be7f7f3a255a5192bbe7c2dd57f22a7726dba79641fd9c6dc8a184fd54` |
| `tests/pharmacy-query-ownership.test.tsx` | `ebdc152f2d8690f86b3cc65957238bd9cdd850ff2568906b72950963e8eb02f5` |
| `tests/cache-area.spec.ts` | `50bd583e099b6277ef9b8214181fda96c3df249d6746a260cd025fe0d6a398c8` |

The current framework at focused red/green time was Next.js 16.2.9. Dependency remediation is owned by the parent agent; this focused result does not validate a later dependency candidate.

## Final lifecycle review correction

A retained GPS callback can be invoked after its hook has unmounted, because the browser geolocation callback lives outside the hook. Incrementing the request identity in cleanup prevents existing responses from publishing but does not prevent this later invocation from creating a fresh request. A 23rd test uses real StrictMode effect replay, accepts an initial GPS result, retains the callback, unmounts, and then invokes it. The intermediate candidate failed this one case while the original 22 still passed: the obsolete callback made a fresh HTTP request.

The final hook also tracks whether it is mounted. Its effect resets that flag for StrictMode replay, cleanup clears it and invalidates requests, entry returns immediately when unmounted, and completion ownership includes the mounted flag. The exact same 23-case file then passed all 23 cases. Existing 22 test lines were preserved; only the StrictMode import and the new lifecycle case were added. This does not sequence a still-mounted late GPS intent against a newer manual selection; broader geolocation intent handling remains outside this batch.

The final executable-source manifest is `source-publication.json`, SHA-256 `2b3685b4df1c670301b784efb0a476f3acb92201b9ded4356d4fc02e09de9550` (102 files). Earlier 152-test and 33-focused receipts are intermediate. Final acceptance uses 153 Vitest tests plus 15 handlers, 34 independent focused cases, strict types, lint, a labeled harness-assisted build, and discovery of 15 hosted browser cases. Exact receipt results are bound separately in the completed package.
