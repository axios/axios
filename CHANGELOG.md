# Changelog

## [1.2.0] - 2022-11-10

### Changed

- changed: refactored module exports [#5162](https://github.com/axios/axios/pull/5162)
- change: re-added support for loading Axios with require('axios').default [#5225](https://github.com/axios/axios/pull/5225)

### Fixed

- fix: improve AxiosHeaders class [#5224](https://github.com/axios/axios/pull/5224)
- fix: TypeScript type definitions for commonjs [#5196](https://github.com/axios/axios/pull/5196)
- fix: type definition of use method on AxiosInterceptorManager to match the the README [#5071](https://github.com/axios/axios/pull/5071)

### Chores

- chore: force CI restart [#5243](https://github.com/axios/axios/pull/5243)
- chore: update ECOSYSTEM.md [#5077](https://github.com/axios/axios/pull/5077)
- chore: update get/index.html [#5116](https://github.com/axios/axios/pull/5116)
- chore: update Sandbox UI/UX [#5205](https://github.com/axios/axios/pull/5205)
- chore(packages) bump socket.io-parser from 4.0.4 to 4.0.5 [#5241](https://github.com/axios/axios/pull/5241)
- chore(packages): bump loader-utils from 1.4.0 to 1.4.1 [#5245](https://github.com/axios/axios/pull/5245)
- chore(docs): update Resources links in README [#5119](https://github.com/axios/axios/pull/5119)
- chore(docs): fix broken links [#5218](https://github.com/axios/axios/pull/5218)
- chore(docs): update and rename UPGRADE_GUIDE.md to MIGRATION_GUIDE.md [#5170](https://github.com/axios/axios/pull/5170)
- chore(docs): typo fix line #856 and #920 [#5194](https://github.com/axios/axios/pull/5194)
- chore(docs): typo fix #800 [#5193](https://github.com/axios/axios/pull/5193)
- chore(docs): fix typos [#5184](https://github.com/axios/axios/pull/5184)
- chore(docs): fix punctuation in README.md [#5197](https://github.com/axios/axios/pull/5197)
- chore: remove \b from filename [#5207](https://github.com/axios/axios/pull/5207)
- chore(docs): update CHANGELOG.md [#5137](https://github.com/axios/axios/pull/5137)
- chore: add sideEffects false to package.json [#5025](https://github.com/axios/axios/pull/5025)

### Contributors to this release

- [Maddy Miller](https://github.com/me4502)
- [Amit Saini](https://github.com/amitsainii)
- [ecyrbe](https://github.com/ecyrbe)
- [Ikko Ashimine](https://github.com/eltociear)
- [Geeth Gunnampalli](https://github.com/thetechie7)
- [Shreem Asati](https://github.com/shreem-123)
- [Frieder Bluemle](https://github.com/friederbluemle)
- [윤세영](https://github.com/yunseyeong)
- [Claudio Busatto](https://github.com/cjcbusatto)
- [Remco Haszing](https://github.com/remcohaszing)
- [Dmitriy Mozgovoy](https://github.com/DigitalBrainJS)
- [Csaba Maulis](https://github.com/om4csaba)
- [MoPaMo](https://github.com/MoPaMo)
- [Daniel Fjeldstad](https://github.com/w3bdesign)
- [Adrien Brunet](https://github.com/adrien-may)

## [1.1.3] - 2022-10-15

### Added

- Added custom params serializer support [#5113](https://github.com/axios/axios/pull/5113)

### Fixed

- Fixed top-level export to keep them in-line with static properties [#5109](https://github.com/axios/axios/pull/5109)
- Stopped including null values to query string. [#5108](https://github.com/axios/axios/pull/5108)
- Restored proxy config backwards compatibility with 0.x [#5097](https://github.com/axios/axios/pull/5097)
- Added back AxiosHeaders in AxiosHeaderValue [#5103](https://github.com/axios/axios/pull/5103)
- Pin CDN install instructions to a specific version [#5060](https://github.com/axios/axios/pull/5060)
- Handling of array values fixed for AxiosHeaders [#5085](https://github.com/axios/axios/pull/5085)

### Chores

- docs: match badge style, add link to them [#5046](https://github.com/axios/axios/pull/5046)
- chore: fixing comments typo [#5054](https://github.com/axios/axios/pull/5054)
- chore: update issue template [#5061](https://github.com/axios/axios/pull/5061)
- chore: added progress capturing section to the docs; [#5084](https://github.com/axios/axios/pull/5084)

### Contributors to this release

- [Jason Saayman](https://github.com/jasonsaayman)
- [scarf](https://github.com/scarf005)
- [Lenz Weber-Tronic](https://github.com/phryneas)
- [Arvindh](https://github.com/itsarvindh)
- [Félix Legrelle](https://github.com/FelixLgr)
- [Patrick Petrovic](https://github.com/ppati000)
- [Dmitriy Mozgovoy](https://github.com/DigitalBrainJS)
- [littledian](https://github.com/littledian)
- [ChronosMasterOfAllTime](https://github.com/ChronosMasterOfAllTime)

## [1.1.2] - 2022-10-07

### Fixed

- Fixed broken exports for UMD builds.

### Contributors to this release

- [Jason Saayman](https://github.com/jasonsaayman)

## [1.1.1] - 2022-10-07

### Fixed

- Fixed broken exports for common js. This fix breaks a prior fix, I will fix both issues ASAP but the commonJS use is more impactful.

### Contributors to this release

- [Jason Saayman](https://github.com/jasonsaayman)

## [1.1.0] - 2022-10-06

### Fixed

- Fixed missing exports in type definition index.d.ts [#5003](https://github.com/axios/axios/pull/5003)
- Fixed query params composing [#5018](https://github.com/axios/axios/pull/5018)
- Fixed GenericAbortSignal interface by making it more generic [#5021](https://github.com/axios/axios/pull/5021)
- Fixed adding "clear" to AxiosInterceptorManager [#5010](https://github.com/axios/axios/pull/5010)
- Fixed commonjs & umd exports [#5030](https://github.com/axios/axios/pull/5030)
- Fixed inability to access response headers when using axios 1.x with Jest [#5036](https://github.com/axios/axios/pull/5036)

### Contributors to this release

- [Trim21](https://github.com/trim21)
- [Dmitriy Mozgovoy](https://github.com/DigitalBrainJS)
- [shingo.sasaki](https://github.com/s-sasaki-0529)
- [Ivan Pepelko](https://github.com/ivanpepelko)
- [Richard Kořínek](https://github.com/risa)

## [1.0.0] - 2022-10-04

### Added

- Added stack trace to AxiosError [#4624](https://github.com/axios/axios/pull/4624)
- Add AxiosError to AxiosStatic [#4654](https://github.com/axios/axios/pull/4654)
- Replaced Rollup as our build runner [#4596](https://github.com/axios/axios/pull/4596)
- Added generic TS types for the exposed toFormData helper [#4668](https://github.com/axios/axios/pull/4668)
- Added listen callback function [#4096](https://github.com/axios/axios/pull/4096)
- Added instructions for installing using PNPM [#4207](https://github.com/axios/axios/pull/4207)
- Added generic AxiosAbortSignal TS interface to avoid importing AbortController polyfill [#4229](https://github.com/axios/axios/pull/4229)
- Added axios-url-template in ECOSYSTEM.md [#4238](https://github.com/axios/axios/pull/4238)
- Added a clear() function to the request and response interceptors object so a user can ensure that all interceptors have been removed from an axios instance [#4248](https://github.com/axios/axios/pull/4248)
- Added react hook plugin [#4319](https://github.com/axios/axios/pull/4319)
- Adding HTTP status code for transformResponse [#4580](https://github.com/axios/axios/pull/4580)
- Added blob to the list of protocols supported by the browser [#4678](https://github.com/axios/axios/pull/4678)
- Resolving proxy from env on redirect [#4436](https://github.com/axios/axios/pull/4436)
- Added enhanced toFormData implementation with additional options [4704](https://github.com/axios/axios/pull/4704)
- Adding Canceler parameters config and request [#4711](https://github.com/axios/axios/pull/4711)
- Added automatic payload serialization to application/x-www-form-urlencoded [#4714](https://github.com/axios/axios/pull/4714)
- Added the ability for webpack users to overwrite built-ins [#4715](https://github.com/axios/axios/pull/4715)
- Added string[] to AxiosRequestHeaders type [#4322](https://github.com/axios/axios/pull/4322)
- Added the ability for the url-encoded-form serializer to respect the formSerializer config [#4721](https://github.com/axios/axios/pull/4721)
- Added isCancel type assert [#4293](https://github.com/axios/axios/pull/4293)
- Added data URL support for node.js [#4725](https://github.com/axios/axios/pull/4725)
- Adding types for progress event callbacks [#4675](https://github.com/axios/axios/pull/4675)
- URL params serializer [#4734](https://github.com/axios/axios/pull/4734)
- Added axios.formToJSON method [#4735](https://github.com/axios/axios/pull/4735)
- Bower platform add data protocol [#4804](https://github.com/axios/axios/pull/4804)
- Use WHATWG URL API instead of url.parse() [#4852](https://github.com/axios/axios/pull/4852)
- Add ENUM containing Http Status Codes to typings [#4903](https://github.com/axios/axios/pull/4903)
- Improve typing of timeout in index.d.ts [#4934](https://github.com/axios/axios/pull/4934)

### Changed

- Updated AxiosError.config to be optional in the type definition [#4665](https://github.com/axios/axios/pull/4665)
- Updated README emphasizing the URLSearchParam built-in interface over other solutions [#4590](https://github.com/axios/axios/pull/4590)
- Include request and config when creating a CanceledError instance [#4659](https://github.com/axios/axios/pull/4659)
- Changed func-names eslint rule to as-needed [#4492](https://github.com/axios/axios/pull/4492)
- Replacing deprecated substr() with slice() as substr() is deprecated [#4468](https://github.com/axios/axios/pull/4468)
- Updating HTTP links in README.md to use HTTPS [#4387](https://github.com/axios/axios/pull/4387)
- Updated to a better trim() polyfill [#4072](https://github.com/axios/axios/pull/4072)
- Updated types to allow specifying partial default headers on instance create [#4185](https://github.com/axios/axios/pull/4185)
- Expanded isAxiosError types [#4344](https://github.com/axios/axios/pull/4344)
- Updated type definition for axios instance methods [#4224](https://github.com/axios/axios/pull/4224)
- Updated eslint config [#4722](https://github.com/axios/axios/pull/4722)
- Updated Docs [#4742](https://github.com/axios/axios/pull/4742)
- Refactored Axios to use ES2017 [#4787](https://github.com/axios/axios/pull/4787)


### Deprecated
- There are multiple deprecations, refactors and fixes provided in this release. Please read through the full release notes to see how this may impact your project and use case.

### Removed

- Removed incorrect argument for NetworkError constructor [#4656](https://github.com/axios/axios/pull/4656)
- Removed Webpack [#4596](https://github.com/axios/axios/pull/4596)
- Removed function that transform arguments to array [#4544](https://github.com/axios/axios/pull/4544)

### Fixed

- Fixed grammar in README [#4649](https://github.com/axios/axios/pull/4649)
- Fixed code error in README [#4599](https://github.com/axios/axios/pull/4599)
- Optimized the code that checks cancellation [#4587](https://github.com/axios/axios/pull/4587)
- Fix url pointing to defaults.js in README [#4532](https://github.com/axios/axios/pull/4532)
- Use type alias instead of interface for AxiosPromise [#4505](https://github.com/axios/axios/pull/4505)
- Fix some word spelling and lint style in code comments [#4500](https://github.com/axios/axios/pull/4500)
- Edited readme with 3 updated browser icons of Chrome, FireFox and Safari [#4414](https://github.com/axios/axios/pull/4414)
- Bump follow-redirects from 1.14.9 to 1.15.0 [#4673](https://github.com/axios/axios/pull/4673)
- Fixing http tests to avoid hanging when assertions fail [#4435](https://github.com/axios/axios/pull/4435)
- Fix TS definition for AxiosRequestTransformer [#4201](https://github.com/axios/axios/pull/4201)
- Fix grammatical issues in README [#4232](https://github.com/axios/axios/pull/4232)
- Fixing instance.defaults.headers type [#4557](https://github.com/axios/axios/pull/4557)
- Fixed race condition on immediate requests cancellation [#4261](https://github.com/axios/axios/pull/4261)
- Fixing Z_BUF_ERROR when no content [#4701](https://github.com/axios/axios/pull/4701)
- Fixing proxy beforeRedirect regression [#4708](https://github.com/axios/axios/pull/4708)
- Fixed AxiosError status code type [#4717](https://github.com/axios/axios/pull/4717)
- Fixed AxiosError stack capturing [#4718](https://github.com/axios/axios/pull/4718)
- Fixing AxiosRequestHeaders typings [#4334](https://github.com/axios/axios/pull/4334)
- Fixed max body length defaults [#4731](https://github.com/axios/axios/pull/4731)
- Fixed toFormData Blob issue on node>v17 [#4728](https://github.com/axios/axios/pull/4728)
- Bump grunt from 1.5.2 to 1.5.3 [#4743](https://github.com/axios/axios/pull/4743)
- Fixing content-type header repeated [#4745](https://github.com/axios/axios/pull/4745)
- Fixed timeout error message for http [4738](https://github.com/axios/axios/pull/4738)
- Request ignores false, 0 and empty string as body values [#4785](https://github.com/axios/axios/pull/4785)
- Added back missing minified builds [#4805](https://github.com/axios/axios/pull/4805)
- Fixed a type error [#4815](https://github.com/axios/axios/pull/4815)
- Fixed a regression bug with unsubscribing from cancel token; [#4819](https://github.com/axios/axios/pull/4819)
- Remove repeated compression algorithm [#4820](https://github.com/axios/axios/pull/4820)
- The error of calling extend to pass parameters [#4857](https://github.com/axios/axios/pull/4857)
- SerializerOptions.indexes allows boolean | null | undefined [#4862](https://github.com/axios/axios/pull/4862)
- Require interceptors to return values [#4874](https://github.com/axios/axios/pull/4874)
- Removed unused imports [#4949](https://github.com/axios/axios/pull/4949)
- Allow null indexes on formSerializer and paramsSerializer [#4960](https://github.com/axios/axios/pull/4960)

### Chores
- Set permissions for GitHub actions [#4765](https://github.com/axios/axios/pull/4765)
- Included githubactions in the dependabot config [#4770](https://github.com/axios/axios/pull/4770)
- Included dependency review [#4771](https://github.com/axios/axios/pull/4771)
- Update security.md [#4784](https://github.com/axios/axios/pull/4784)
- Remove unnecessary spaces [#4854](https://github.com/axios/axios/pull/4854)
- Simplify the import path of AxiosError [#4875](https://github.com/axios/axios/pull/4875)
- Fix Gitpod dead link [#4941](https://github.com/axios/axios/pull/4941)
- Enable syntax highlighting for a code block [#4970](https://github.com/axios/axios/pull/4970)
- Using Logo Axios in Readme.md [#4993](https://github.com/axios/axios/pull/4993)
- Fix markup for note in README [#4825](https://github.com/axios/axios/pull/4825)
- Fix typo and formatting, add colons [#4853](https://github.com/axios/axios/pull/4853)
- Fix typo in readme [#4942](https://github.com/axios/axios/pull/4942)

### Security

- Update SECURITY.md [#4687](https://github.com/axios/axios/pull/4687)

### Contributors to this release

- [Bertrand Marron](https://github.com/tusbar)
- [Dmitriy Mozgovoy](https://github.com/DigitalBrainJS)
- [Dan Mooney](https://github.com/danmooney)
- [Michael Li](https://github.com/xiaoyu-tamu)
- [aong](https://github.com/yxwzaxns)
- [Des Preston](https://github.com/despreston)
- [Ted Robertson](https://github.com/tredondo)
- [zhoulixiang](https://github.com/zh-lx)
- [Arthur Fiorette](https://github.com/arthurfiorette)
- [Kumar Shanu](https://github.com/Kr-Shanu)
- [JALAL](https://github.com/JLL32)
- [Jingyi Lin](https://github.com/MageeLin)
- [Philipp Loose](https://github.com/phloose)
- [Alexander Shchukin](https://github.com/sashsvamir)
- [Dave Cardwell](https://github.com/davecardwell)
- [Cat Scarlet](https://github.com/catscarlet)
- [Luca Pizzini](https://github.com/lpizzinidev)
- [Kai](https://github.com/Schweinepriester)
- [Maxime Bargiel](https://github.com/mbargiel)
- [Brian Helba](https://github.com/brianhelba)
- [reslear](https://github.com/reslear)
- [Jamie Slome](https://github.com/JamieSlome)
- [Landro3](https://github.com/Landro3)
- [rafw87](https://github.com/rafw87)
- [Afzal Sayed](https://github.com/afzalsayed96)
- [Koki Oyatsu](https://github.com/kaishuu0123)
- [Dave](https://github.com/wangcch)
- [暴走老七](https://github.com/baozouai)
- [Spencer](https://github.com/spalger)
- [Adrian Wieprzkowicz](https://github.com/Argeento)
- [Jamie Telin](https://github.com/lejahmie)
- [毛呆](https://github.com/aweikalee)
- [Kirill Shakirov](https://github.com/turisap)
- [Rraji Abdelbari](https://github.com/estarossa0)
- [Jelle Schutter](https://github.com/jelleschutter)
- [Tom Ceuppens](https://github.com/KyorCode)
- [Johann Cooper](https://github.com/JohannCooper)
- [Dimitris Halatsis](https://github.com/mitsos1os)
- [chenjigeng](https://github.com/chenjigeng)
- [João Gabriel Quaresma](https://github.com/joaoGabriel55)
- [Victor Augusto](https://github.com/VictorAugDB)
- [neilnaveen](https://github.com/neilnaveen)
- [Pavlos](https://github.com/psmoros)
- [Kiryl Valkovich](https://github.com/visortelle)
- [Naveen](https://github.com/naveensrinivasan)
- [wenzheng](https://github.com/0x30)
- [hcwhan](https://github.com/hcwhan)
- [Bassel Rachid](https://github.com/basselworkforce)
- [Grégoire Pineau](https://github.com/lyrixx)
- [felipedamin](https://github.com/felipedamin)
- [Karl Horky](https://github.com/karlhorky)
- [Yue JIN](https://github.com/kingyue737)
- [Usman Ali Siddiqui](https://github.com/usman250994)
- [WD](https://github.com/techbirds)
- [Günther Foidl](https://github.com/gfoidl)
- [Stephen Jennings](https://github.com/jennings)
- [C.T.Lin](https://github.com/chentsulin)
- [mia-z](https://github.com/mia-z)
- [Parth Banathia](https://github.com/Parth0105)
- [parth0105pluang](https://github.com/parth0105pluang)
- [Marco Weber](https://github.com/mrcwbr)
- [Luca Pizzini](https://github.com/lpizzinidev)
- [Willian Agostini](https://github.com/WillianAgostini)
- [Huyen Nguyen](https://github.com/huyenltnguyen)
