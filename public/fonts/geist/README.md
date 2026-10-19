# Vendored Geist fonts

These unmodified variable fonts are served by this application so the build does not fetch fonts from Google. The CSS in `app/fonts.css` preserves the Geist and Geist Mono families, weights 100–900, and separate Latin/Latin-ext coverage. Both subsets are necessary for Turkish text.

## Binary provenance

Copied from the already installed `next@16.2.9` package at `dist/next-devtools/server/font/`. The actual font metadata identifies version **1.401**, regular style and the variable `wght` axis 100–900 (default 400). Each file carries the 2024 Geist Project Authors copyright. No font conversion, merging or subsetting was performed.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `geist-latin-ext.woff2` | 15,292 | `f7604a53a00250f66db4b47dd44327ce2a43f6edec850d5217bb80238819efdd` |
| `geist-latin.woff2` | 28,356 | `1b5ebfb3a01a97343ac96873e6d59a8cb285c66012b6a1ac509cb2765e995ba8` |
| `geist-mono-latin-ext.woff2` | 13,036 | `7d5609538a79545ec945e019771ed562e2c65a6c1c3c4ccc4ea34372e277c396` |
| `geist-mono-latin.woff2` | 31,288 | `b7ac144b394cbd81052d6397ec0c33397977b1d7e9bc095e744e652a378c6fb3` |

The Unicode ranges come from that same installed package's `src/next-devtools/dev-overlay/font/font-styles.tsx`, included in its source map. The font-face weight descriptor is 100–900, matching the actual variable font axis. Fallback metrics match those returned by Next 16.2.9's Google font loader for these two families. The Latin files retain the root layout's preload behavior; the Latin-ext files load when needed by the text.

## License

These files are distributed under **SIL Open Font License 1.1**, not the application's license. Retain the accompanying `OFL.txt` and copyright notice when redistributing them.

The exact license file was obtained from [the official Geist repository at commit e1f671c727f6de7e97c1e1d26dbb44f349c19459](https://github.com/vercel/geist-font/blob/e1f671c727f6de7e97c1e1d26dbb44f349c19459/OFL.txt). Its Git blob SHA-1 is `04e95fc550855eb44416b9db1f6722f5cb7342db`, SHA-256 is `c683bfbcc7e087f5d37a54ef628f10387c451a83ddc459b151403a164ac46c90`, and size is 4,383 bytes. Its 2024 Geist Project Authors copyright matches the binary metadata.

That commit pins the license source only. The cached version 1.401 binaries have the separate installed-package provenance and hashes above; they are not attributed to that later source commit.
