# Pre-Release Changelog

## Unreleased

## Features

## Bug Fixes

## Documentation

- **README sponsor name:** Corrected sponsor name typo `BSAP SE` → `SAP SE` in the README sponsor listing. This updates sponsor recognition only, with no runtime, public API, or type compatibility changes. ([#11373](https://github.com/axios/axios/pull/11373))
- **Error identification:** Corrected the error `name` description in the README and English, French, Spanish, and Chinese error-handling guides. Cancellation errors use `CanceledError`, and wrapped errors may retain their original name, so the guides now recommend `axios.isAxiosError(error)` for identifying Axios errors and `axios.isCancel(error)` for detecting cancellations instead of comparing `name`. Documentation only; no runtime, public API, or type changes. ([#11374](https://github.com/axios/axios/pull/11374))
- **v1.21.0 release notes and docs:** Added the published v1.21.0 release notes to `CHANGELOG.md`. Applied the 13 pending `PRE_RELEASE_DOCS.md` entries from v1.20.0 and v1.21.0 to the English, Spanish, French, and Chinese docs site, including upgrade-guide sections for both releases. Cleared the released entries from `PRE_RELEASE_CHANGELOG.md`, and reduced `PRE_RELEASE_DOCS.md` to the README updates that remain pending for those entries. No runtime, public API, or type compatibility changes.
- **Docs site partners page and sponsor cards:** Added a Partners page to the English, Spanish, French, and Chinese docs site, linked from the top navigation. It lists HeroDevs, Socket, Namespace, Greptile, and cubic with their logos, a short description, and links to each partner's website and social profiles. Each homepage also gets a short translated introduction for the Sponsors section that links to Open Collective, and a Partners section under the sponsor carousel with its own introduction and the five partner cards. The Partners page, Sponsors page, homepage sponsor carousel, and homepage Partners section now share one card component (`docs/.vitepress/theme/LogoCard.vue`): logo, name, tier badge or description, and a row of link icons led by a globe for the website, followed by every social profile. The whole card links to the website when one exists. `docs/scripts/process-sponsors.js` now stores all Open Collective social links (X, GitHub, LinkedIn, YouTube, and others) in a `socialLinks` list instead of only `twitter`, and `docs/data/sponsors.json` was regenerated. Partner and sponsor links use the same `axios_docs_website` UTM parameters. The homepage carousel now loads Splide's stylesheet from the installed package instead of the jsDelivr CDN and is destroyed when the page unmounts. Sponsor logos load lazily. The Partners and Sponsors pages use narrower side margins on phones so cards keep a usable width. Docs site only; no runtime, public API, or type compatibility changes.
- **CI sponsor badge:** Added Namespace to the Gold sponsors grid in the README, with the open source CI badge and the line "Actually the fastest way to run your GitHub Actions." The link uses the axios campaign. Axios CI already runs on the namespace-profile-axios runner profile. Documentation only; no runtime, public API, or type compatibility changes.

## Maintenance

<!-- Record test-only changes, internal refactors, tooling, dependency updates, and CI changes without a user-visible behavior change here. -->

- **CI runners:** Switched GitHub Actions jobs from GitHub-hosted `ubuntu-latest` runners to the `namespace-profile-axios` Namespace runner profile. The npm publish job stays on `ubuntu-latest` because npm provenance and trusted publishing require GitHub-hosted runners. CI only; no runtime, public API, or type compatibility changes.
