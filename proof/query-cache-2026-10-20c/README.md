# C query cache and targeted dependency evidence

- [Report](../../docs/QUERY_CACHE_SECURITY_AUDIT_2026-10-20C.md) describes the behavior, dependency provenance and acceptance limits.
- [Verification](verification.json) is the machine summary; [commands](commands.json) preserves exact original receipt values and hashes beside raw logs.
- [Final source](source-publication.json), [version binding](validation-source-binding.json) and [parent source binding](evidence/parent-source-binding.json) bind the evidence to the same executable bytes.
- [Dependency research](evidence/security-upgrade-research.json), [lock delta](evidence/dependency-lock-delta.json) and [audit rejection](evidence/npm-audit-rejection.json) distinguish approved public package acquisition from the denied project audit upload.
- [Stdio controls](evidence/stdio-bridge-controls.json) demonstrate why the local build uses a narrowly scoped validation helper. The standard local failure is retained; the helper never becomes application or CI code.
- [File hashes](EVIDENCE_INDEX.json) bind every other file in this package. Runtime files in `harness/` use `.txt` extensions so they cannot enter application compilation.

The current-source hosted stock build and 15-browser run are still required. Historical parent browser success and local discovery are not current-source browser execution. Pharmacy fixtures are synthetic and do not establish current duty status.
