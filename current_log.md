commit 020334a5a5fbb420478841cc8fd6d3c3546b56c3
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Tue Nov 5 21:40:55 2019 -0800

    Update bower

commit 95b071f2f77a90db537480b7e1ef68499ba1a526
Merge: 7e3d3f3 132e1d6
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Tue Nov 5 21:37:15 2019 -0800

    Merge branch 'update-dist' of https://github.com/yasuf/axios into update-dist

commit 7e3d3f3941d9dcedc549136f2b4f3686361b5ecd
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Tue Nov 5 21:23:42 2019 -0800

    Change version in package.json

commit 132e1d66562d3e227b46b86e44c8c21626c4f491
Merge: c98b268 bbfd5b1
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Sun Nov 3 23:29:43 2019 -0800

    Merge branch 'master' into update-dist

commit bbfd5b1395699ae6290a01f51e0e1b66897099fd
Author: Luke Policinski <Luke@LukePOLO.com>
Date:   Mon Nov 4 00:17:27 2019 -0500

    Adding options typings (#2341)

commit 55aaebcbf5e9e73a56f59e2caf86f035794b12f4
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Sun Nov 3 20:56:17 2019 -0800

    Document fix (#2514)

commit 86d77504c2712ffd787873d0642e62a4e4c5de10
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Sun Nov 3 20:54:19 2019 -0800

    Update docs with no_proxy change, issue #2484 (#2513)

commit b0afbedf1b0c4e3d4b9991028e61fa39b886ae13
Author: Marlon Barcarol <marlon.barcarol@gmail.com>
Date:   Mon Nov 4 03:29:51 2019 +0000

    Adding Typescript HTTP method definition for LINK and UNLINK. (#2444)

commit fa68fd30c3571797fcc6e5a2191e3e55399c4b78
Author: Harshit Singh <harshit.singh1101@gmail.com>
Date:   Mon Nov 4 08:00:49 2019 +0530

    Update README.md (#2504)

commit c98b268a3a0f3ab5d5ef6c354618a52bb6f95dea
Merge: fd4cd9d 0979486
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Mon Oct 28 23:34:04 2019 -0700

    Merge branch 'master' of https://github.com/axios/axios into update-dist

commit fd4cd9dbea0e890519f75f3f401be14b23c09e81
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Mon Oct 28 23:30:02 2019 -0700

    Update dist with newest changes, fixes Custom Attributes issue

commit 097948698a057235140cc275504c12d5d20281b8
Author: Felipe Martins <felipewmartins@gmail.com>
Date:   Fri Oct 25 11:34:47 2019 -0300

    Revert "Update Webpack + deps, remove now unnecessary polyfills" (#2479)
    
    * Revert "Update Webpack + deps, remove now unnecessary polyfills (#2410)"
    
    This reverts commit 189b34c45ababa279243d419c60a06ef3c1ab258.
    
    * Fix build (#2496)
    
    * Change syntax to see if build passes
    
    * Test commit
    
    * Test with node 10
    
    * Test adding all browsers in travis
    
    * remove other browsers when running on travis

commit 494d8173140debaf822c51bfe9324226cfefadb2
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Fri Oct 25 07:25:53 2019 -0700

    Change syntax to see if build passes (#2488)
    
    * Change syntax to see if build passes
    
    * Test commit
    
    * Test with node 10
    
    * Test adding all browsers in travis
    
    * remove other browsers when running on travis

commit 189b34c45ababa279243d419c60a06ef3c1ab258
Author: Avindra Goolcharan <aavindraa@gmail.com>
Date:   Mon Oct 21 14:56:29 2019 -0400

    Update Webpack + deps, remove now unnecessary polyfills (#2410)
    
    * Update deps
    
     * handles webpack 1 -> 4 migration
    
    * remove promise helpers from dev files
    
    assume `Promise` is available, or polyfilled by
    the consumer
    
    * Remove isArray util. `isArray` has good coverage, even
       in IE9. So lets remove the custom polyfill.
    
     https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
    
    also resolves a few lint issues
    
    * Remove trim util
    
    String.protoype.trim has good coverage (including IE9)
    
    https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    
    Also, the http adapter already uses the native method.

commit 29da6b24db08ff83e7efe2aab512de3d4d8d216d
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Wed Oct 16 03:53:10 2019 -0700

    Fix to prevent XSS, throw an error when the URL contains a JS script (#2464)
    
    * Fixes issue where XSS scripts attacks were possible via the URL
    
    * Fix error
    
    * Move throwing error up
    
    * Add specs and make regex cover more xss cases

commit ee60ee368ea0369f5e77b34f015bc37330f9ee75
Author: Crhistian Ramirez <16483662+crhistianramirez@users.noreply.github.com>
Date:   Tue Oct 15 20:32:19 2019 -0500

    Fixing missing words in docs template (#2259)

commit 6284abfa0693c983e9378b2d074c095262aac7bd
Author: IVLIU <liupyliupy@outlook.com>
Date:   Wed Oct 16 09:29:16 2019 +0800

    custom timeout prompt copy (#2275)
    
    * style: ui
    
    * feat: custom timeout txtx
    
    * feat: custom timeout txtx

commit ccca5e0e21fd1225ec1472a85547ff1436e0b506
Author: Yasu Flores <carlosyasu91@gmail.com>
Date:   Tue Oct 15 18:20:56 2019 -0700

    Add error toJSON example (#2466)

commit 19969b4fbd6b5b6da67825a69b0f317afa1327dd
Author: Wataru <taare-xxx09@ezweb.ne.jp>
Date:   Wed Oct 9 09:23:34 2019 +0900

    Fixing Vulnerability A Fortify Scan finds a critical Cross-Site Scrip… (#2451)
    
    * Fixing Vulnerability A Fortify Scan finds a critical Cross-Site Scripting
    
    * use var insted of const

commit 4f189ec80ce01a0275d87d24463ef12b16715d9b
Author: Maskedman99 <31368194+Maskedman99@users.noreply.github.com>
Date:   Fri Oct 4 19:17:49 2019 +0530

    Add license badge (#2446)
    
    MIT License badge added in README.md file

commit 85c9d4ffb093debaca82f76377f102ab2af913cb
Author: Felipe Martins <felipewmartins@gmail.com>
Date:   Sat Sep 28 20:51:20 2019 -0300

    fix: Fixing subdomain handling on no_proxy (#2442)

commit 00cd48027bdfe1998da7100a56b5d68cc57277c2
Author: Jeremie Thomassey <44839746+JitixPhotobox@users.noreply.github.com>
Date:   Thu Sep 26 14:33:49 2019 +0200

    Make redirection from HTTP to HTTPS work (#2426)
    
    When calling an HTTP resource redirecting to a HTTPS one with a keepAlive agent. We get the following error:
    ```
    TypeError [ERR_INVALID_PROTOCOL]: Protocol "https:" not supported. Expected "http:"
        at new ClientRequest (_http_client.js:119:11)
        at Object.request (https.js:281:10)
        at RedirectableRequest._performRequest (/Users/jthomassey/projects/ecom-shop-web/node_modules/follow-redirects/index.js:169:24)
        at RedirectableRequest._processResponse (/Users/jthomassey/projects/ecom-shop-web/node_modules/follow-redirects/index.js:260:10)
        at ClientRequest.RedirectableRequest._onNativeResponse (/Users/jthomassey/projects/ecom-shop-web/node_modules/follow-redirects/index.js:50:10)
        at Object.onceWrapper (events.js:277:13)
        at ClientRequest.emit (events.js:189:13)
        at HTTPParser.parserOnIncomingClient [as onIncoming] (_http_client.js:556:21)
        at HTTPParser.parserOnHeadersComplete (_http_common.js:109:17)
        at Socket.socketOnData (_http_client.js:442:20)
    ```
    
    This can be tested here :
    ```
    const http = require('http');
    const https = require('https');
    const axios = require('axios');
    
    axios.get('http://www.photobox.fr', { httpAgent: http.Agent({ keepAlive:true }), httpsAgent: https.Agent({ keepAlive:true }) })
      .then(response => {
        console.log(response);
        console.log(response.headers);
      })
      .catch(error => {
        console.log(error);
      });
    ```
    
    Axios delegate the redirection to the follow-redirect package which accept an option `agents` for both http and https agent see : https://github.com/follow-redirects/follow-redirects#per-request-options

commit 006b60425c68d8b60df7ae85407b26cf0832343d
Author: Tiago Rodrigues <tmcrodrigues@gmail.com>
Date:   Thu Sep 26 14:11:34 2019 +0200

    Add toJSON property to AxiosError type (#2427)
    
    I noticed the error object has a `toJSON` method but when I tried to use it in my typescript code it complained it didn't exist, even though I was using the `AxiosError` type.

commit 88dbb82d77155d3a8af37b35ef3add6b5fa34855
Author: Jihwan Oh <fureweb.com@gmail.com>
Date:   Thu Sep 26 09:18:44 2019 +0900

    Fix word 'sintaxe' to 'syntax' in README.md (#2432)
    
    - translate 'sintaxe' word from portuguese to english

commit 93e69625a69ef7bbcf14c9bcb2a1cba2d4b5a126
Author: Ya Hui Liang(Ryou) <46517115@qq.com>
Date:   Mon Sep 16 16:58:58 2019 +0800

    Fixing socket hang up error on node side for slow response. (#1752)
    
    * Fixing socket hang up error on node side for slow response.
    
    * eslint check

commit d74385f1c8f944a6d94ae0680d3841859a2fcb38
Author: Ahmed Tarek <ahmed.tokyo1@gmail.com>
Date:   Fri Sep 13 15:19:43 2019 +0200

    🐛Fix request finally documentation in README (#2189)

commit 1b07fb9365d38a1a8ce7427130bf9db8101daf09
Author: Joshua Melvin <joshua.melvin@outlook.com>
Date:   Fri Sep 13 08:35:59 2019 -0400

    Fixing issue 2195 - order of if/else blocks is causing unit tests mocking XHR. (#2201)

commit c454e9f526bad399bd2a92af7fa8bc97a6d1acd0
Author: Fabio Aiello <heloflyer@hotmail.com>
Date:   Fri Sep 13 05:31:49 2019 -0700

    updating spelling and adding link to docs (#2212)

commit e3a7116f14e7bbb7c3645df5d7910642c8fc2f5e
Author: Vamp <25523682+the-vampiire@users.noreply.github.com>
Date:   Fri Sep 13 12:28:14 2019 +0000

    upadating README: notes on CommonJS autocomplete (#2256)
    
    closes #2226. add note on how to gain typings / autocomplete / intellisense when using CommonJS (`require()`) imports

commit 488a4598a3eedc5bf99a6df0bbd07d1cbd8bb1a4
Author: Lucas <33911520+portolucas@users.noreply.github.com>
Date:   Fri Sep 13 09:19:16 2019 -0300

    Sintaxe alternative to send data into the body (#2317)

commit f7e2a995d65c9018c6f83eb39c2579051bde6867
Author: James George <jamesgeorge998001@gmail.com>
Date:   Fri Sep 13 17:40:55 2019 +0530

    docs: minor tweak (#2404)
    
    made the license section link up to the respective file.

commit c282e7ea8e5f714bfc19127c71edd4a6711534d1
Author: Felipe Martins <felipewmartins@gmail.com>
Date:   Thu Sep 12 23:45:06 2019 -0300

    Fix cancellation error on build master. #2290 #2207 (#2407)

commit f5704fce71151ee78f579f48c3ea4b0707cc23b2
Author: Sagar Acharya <sagarach65@gmail.com>
Date:   Fri Sep 13 07:15:36 2019 +0545

    Update response interceptor docs (#2399)

commit 6a4a85c57fcaba912eee61b87ba34d07323bc60c
Author: Avindra Goolcharan <aavindraa@gmail.com>
Date:   Sat Sep 7 08:05:26 2019 -0400

    Doc fixes, minor examples cleanup (#2198)
    
    * README.md COOKBOOK.md: minor fixes
    
     * simplify language
    
    * ECOSYSTEM: create a few categories
    
    * Examples: log port listening to
    
    * upgrade bootstrap 3 -> 4 in examples
    
    bootstrap 4 is slightly smaller then 3.2.0
    so it should also help load examples faster
    
    * categorize 0.19 items a little differently
    
    surface user/consumer changes first

commit a11cdf468303a365a6dc6e84f6dd0e4b3b8fd336
Author: Rafael Renan Pacheco <rafael.renan.pacheco@gmail.com>
Date:   Fri Sep 6 21:40:04 2019 -0300

    Fixing custom config options (#2207)
    
    - fixes #2203

commit e50a08b2c392c6ce3b5a9dc85ebc860d50414529
Author: bushuai <ibushuai@gmail.com>
Date:   Sat Sep 7 01:23:55 2019 +0800

    Fixing set `config.method` after mergeConfig for Axios.prototype.request (#2383)
    
    Inside Axios.prototype.request function, It's forced to set
    method to 'get' after `mergeConfig` if config.method exists, which makes the defaults.method not effective.

commit 89bd3abe9a98daa075be14587a616f8391040eb2
Author: DIO <dhrubesh97@gmail.com>
Date:   Fri Sep 6 21:15:18 2019 +0530

    Axios create url bug (#2290)
    
    * Fix #2234
    
    * added spacing --eslint
    
    * added test cases
    
    * removed unexpected cases after updating the code

commit b9931e0a95f7942f728c0de4ea7cbdef86bc360b
Author: Michael Foss <michael@mikefoss.com>
Date:   Fri Sep 6 11:42:10 2019 -0400

    Fix grammar in README.md (#2271)

commit f0f68afb613fcce97e81fbb3731ab0f65b9b9864
Author: Denis Sikuler <progwork@yandex.com>
Date:   Fri Sep 6 15:55:06 2019 +0300

    Fix a typo in README (#2384)

commit 6fe506fda290ba935c2641f68f1fcba7f4a16cd3
Author: multicolaure <43094923+multicolaure@users.noreply.github.com>
Date:   Thu Sep 5 17:43:55 2019 +0200

    Do not modify config.url when using a relative baseURL (resolves #1628) (#2391)
    
    * Adding tests to show config.url mutation
    
    Because config.url is modified while processing the request
    when the baseURL is set,
    it is impossible to perform a retry with the provided config object.
    
    Ref #1628
    
    * Fixing url combining without modifying config.url
    
    As config.url is not modified anymore during the request processing.
    The request can safely be retried after it failed with the provided
    config.
    
    resolves #1628

commit 98e4acd893fe024ae9e6074894c6164802b3af63
Author: Felipe Martins <felipewmartins@gmail.com>
Date:   Wed Sep 4 22:02:01 2019 -0300

    Fix travis CI build (#2386)

commit 2ee3b482456cd2a09ccbd3a4b0c20f3d0c5a5644
Author: Takahiro Ikeda <ikeadless@gmail.com>
Date:   Sat Jun 1 00:20:35 2019 +0900

    Fix typo in CHANGELOG.md - s/issue/issues (#2193)
    
    - issue link is not found.
    - typo: issue => issues

commit 8d0b92b2678d96770304dd767cd05a59d37f12cf
Author: Emily Morehouse <emilyemorehouse@gmail.com>
Date:   Thu May 30 10:10:06 2019 -0600

    Releasing 0.19.0

commit 3f7451ceb7b8386a0c233b869dddea1fea05b12f
Author: Emily Morehouse <emilyemorehouse@gmail.com>
Date:   Thu May 30 09:57:24 2019 -0600

    Update Changelog for release (0.19.0)

commit f28ff933e491ad7b1dd77af6ad3abe126109bd9e
Author: xlaguna <50924665+xlaguna@users.noreply.github.com>
Date:   Tue May 28 18:57:59 2019 +0200

    Add information about auth parameter to README (#2166)

commit 5250e6e168f22bf75f0643b21577ac7c4dc486b9
Author: Daniela Borges Matos de Carvalho <alunassertiva@gmail.com>
Date:   Tue May 28 17:57:09 2019 +0100

    Add DELETE to list of methods that allow data as a config option (#2169)

commit 6b0ccd13fa3fd87e256d5e220ddc6ce935fa72dd
Author: Renan <renancaraujo@users.noreply.github.com>
Date:   Tue May 28 13:55:33 2019 -0300

    Update ECOSYSTEM.md - Add Axios Endpoints (#2176)

commit 299e827c577c2f1461e17678282f4d19a753e6f2
Author: 유용우 / CX <uyu423@gmail.com>
Date:   Thu May 16 04:40:23 2019 +0900

    Add r2curl in ECOSYSTEM (#2141)

commit fd0c959355e85afa76d1728b7c7bd93a05e004a4
Author: drawski <d.rawski@gmail.com>
Date:   Wed May 15 21:35:09 2019 +0200

    Unzip response body only for statuses != 204 (#1129)

commit 92d231387fe2092f8736bc1746d4caa766b675f5
Author: Victor Hermes <me.victorhermes@gmail.com>
Date:   Tue May 7 17:17:16 2019 -0300

    Update README.md - Add instructions for installing with yarn (#2036)

commit ddcc2e4bc0282499afc1370e3686bacaff1faee3
Author: Josh McCarty <43768310+joshomccarty@users.noreply.github.com>
Date:   Tue May 7 16:16:14 2019 -0400

    Fixing spacing for README.md (#2066)

commit 48c43d5240e1ac6e6c44495e7428262d32a438f9
Author: Omar Cai <xcqvmywoj@yahoo.com.tw>
Date:   Wed May 8 04:01:44 2019 +0800

    Update README.md. - Change `.then` to `.finally` in example code (#2090)

commit b7a9744518f71edad2991b48035e8cade37955a6
Author: Tyler Breisacher <tbreisacher@hustle.com>
Date:   Tue May 7 12:26:33 2019 -0700

    Clarify what values responseType can have in Node (#2121)
    
    It seems that `responseType: 'blob'` doesn't actually work in Node (when I tried using it, response.data was a string, not a Blob, since Node doesn't have Blobs), so this clarifies that this option should only be used in the browser

commit 0d4fca085b9b44e110f4c5a3dd7384c31abaf756
Author: Gadzhi Gadzhiev <resuremade@gmail.com>
Date:   Tue May 7 22:20:34 2019 +0300

    Destroy stream on exceeding maxContentLength (fixes #1098) (#1485)

commit 047501f7083665e0924f2680846fd8721e6de50d
Author: Suman Lama <lamasuman2@gmail.com>
Date:   Tue May 7 12:14:57 2019 -0700

    Makes Axios error generic to use AxiosResponse (#1738)

commit 283d7b306ce231f092d28e01713905e5c1600d14
Author: Weffe <rogelio_negrete@live.com>
Date:   Mon Mar 4 11:16:10 2019 -0800

    docs(ECOSYSTEM): add axios-api-versioning (#2020)

commit 2eeb59af4de41e07c7dd1eec09af0230960c029c
Author: grumblerchester <grumblerchester@users.noreply.github.com>
Date:   Fri Feb 8 20:27:36 2019 -0800

    Fixing Mocha tests by locking follow-redirects version to 1.5.10 (#1993)

commit e122c80c9ddb17e4dad2b6225da2ed9e95e986c7
Author: Emily Morehouse <emilyemorehouse@gmail.com>
Date:   Sun Feb 3 22:41:08 2019 -0700

    Add issue templates

commit 71032ab5bd6ccadad04aeed286d2816ca2e84b43
Author: Dmitriy Eroshenko <airs0urce0@gmail.com>
Date:   Mon Feb 4 07:16:37 2019 +0300

    Update README.md. - Add Querystring library note (#1896)
    
    * Update README.md. Querystring libraries note
    
    * Typo in README.md
    
    Co-Authored-By: airs0urce <airs0urce0@gmail.com>
    
    * Update README.md
    
    Co-Authored-By: airs0urce <airs0urce0@gmail.com>

commit da3a85526297b78a00b71c960b0607688b8447be
Author: Cody Chan <int64ago@gmail.com>
Date:   Mon Feb 4 11:54:49 2019 +0800

    Add react-hooks-axios to Libraries section of ECOSYSTEM.md (#1925)

commit 75c8b3f146aaa8a71f7dca0263686fb1799f8f31
Author: Ken Powers <ken@kenpowers.net>
Date:   Mon Sep 17 12:25:07 2018 -0400

    Allow uppercase methods in typings. (#1781)

commit 81f0d28eb5f8f3ec606fe0e282d4fbaea109c868
Author: Manoel <manoel.lobo@gmail.com>
Date:   Mon Sep 17 11:24:46 2018 -0300

    Fixing .eslintrc without extension (#1789)

commit a74ab87df22a04932bcb1cc91d05dd0b2fa4ae9e
Author: Ali Servet Donmez <asd@pittle.org>
Date:   Mon Sep 17 16:19:34 2018 +0200

    Consistent coding style (#1787)

commit 81eaa3db4cf51bd911f98de5aa1ad130b3c55c8e
Author: Anatoly Ryabov <m1neral@yandex.ru>
Date:   Tue Sep 4 10:53:57 2018 +0300

    Fixing building url with hash mark (#1771)
    
    This commit fix building url with hash map (fragment identifier) when parameters are present: they must not be added after `#`, because client cut everything after `#`

commit 21ae22dbd3ae3d3a55d9efd4eead3dd7fb6d8e6e
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Mon Aug 27 08:26:38 2018 -0700

    Preserve HTTP method when following redirect (#1758)
    
    Resolves #1158
    
    This modifies http.js to uppercase the HTTP method, similar to xhr.js, before passing the request off to the transport. This causes follow-redirects to preserve the HTTP method when automatically making a request to the next URL.

commit 9005a54a8b42be41ca49a31dcfda915d1a91c388
Author: Ben Standefer <benstandefer@gmail.com>
Date:   Wed Aug 22 21:10:40 2018 -0700

    Clarify in README that default timeout is 0 (no timeout) (#1750)
    
    Clarify in README that default timeout is 0 (no timeout)

commit 7db0494579eef8698320dd8a54f1f983cde49897
Author: Alexander Trauzzi <atrauzzi@gmail.com>
Date:   Tue Aug 21 09:24:53 2018 -0500

    Add `getUri` signature to TypeScript definition. (#1736)
    
    * Add `getUri` signature to TypeScript definition.
    
    This is in support of #1624.
    
    * Make configuration optional.

commit b681e919c40fbf7abd109d0cb4f0caf2fd5553e5
Author: Ayush Gupta <ayushg3112@gmail.com>
Date:   Mon Aug 20 14:32:23 2018 +0530

    Adding isAxiosError flag to errors thrown by axios (#1419)

commit c0b40650d1c61d1e61c7853de806deeb3cb8ad12
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Fri Aug 10 12:34:53 2018 -0600

    Fix failing SauceLabs tests by updating configuration
    
    - Remove code coverage from SauceLabs CI, as it causes tests to hang.
    - Update Safari browser tests to handle Safari 9-11 with proper OS
    settings

commit 527381198e8112dd298918b3d9d6c643763a59c3
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Thu Aug 9 12:39:17 2018 -0600

    Releasing 0.19.0-beta.1

commit 56ac637d7d2f2f08e7b80e892d68cee7ae7ae830
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Thu Aug 9 12:35:34 2018 -0600

    Update changelog for 0.19.0-beta.1 release

commit 4f98acc57860721c639f94f5772138b2af273301
Author: Anthony Gauthier <antho325@hotmail.com>
Date:   Tue Aug 7 13:52:30 2018 -0400

    Add getUri method (#1712)
    
    * Added getUri method
    
    * Removed usage of "url"
    
    * added method to README

commit 38de25257cb41557cc308b42259ee460140a1c37
Author: Chance Dickson <me@chancedickson.com>
Date:   Tue Aug 7 12:52:04 2018 -0500

    Adding support for no_proxy env variable (#1693)
    
    * Adding support for no_proxy env variable
    
    * Adds support for the no_proxy environment variable commonly available
      with programs supporting the http_proxy/https_proxy environment
      variables.
    * Adds tests to test the no_proxy environment variable.
    
    * Adding documentation for the proxy env variables
    
    * Adds documentation to README.md for the supported, conventional
      http_proxy, https_proxy, and no_proxy environment variables.

commit b9f68bdf001c9179934d00f56984d83bd065b788
Author: Steven <steven@ceriously.com>
Date:   Mon Aug 6 22:41:21 2018 -0700

    Add badge to display install size (#1538)

commit 6b44e80adebf66984b7ad41fd71fcaac28f3fed8
Author: Tim Johns <timjohns@yahoo.com>
Date:   Mon Aug 6 22:33:55 2018 -0700

    Added toJSON to decorated Axios errors to faciliate serialization (#1625)

commit b4c5d35d2875191dfa8c3919d4227dce8e2ad23f
Author: Jacob Wejendorp <jacob@wejendorp.dk>
Date:   Tue Aug 7 07:25:23 2018 +0200

    Fixing accept header normalization (#1698)
    
    Fixes override behavior for `accept` header, when case does not match
    the one used in defaults.js

commit 90add808a49528a953e16d58fcb9241cf0026352
Author: Nicolas Del Valle <nicolas.delvalle@gmail.com>
Date:   Tue Aug 7 02:19:01 2018 -0300

    Update README.md (#1709)

commit 6a414cb9a3d39bd0d8338b9625cd40c039b7c5fb
Author: Dave Stewart <info@davestewart.co.uk>
Date:   Tue Aug 7 06:18:16 2018 +0100

    Update ECOSYSTEM.md (#1690)
    
    Add Axios Actions package

commit 0b4e70d2ba9ee8bd951adf9fe26593025e299298
Author: Benedikt Rötsch <axe312ger@users.noreply.github.com>
Date:   Mon Aug 6 10:07:00 2018 +0200

    adjust README to match IE support

commit 503418718f669fcc674719fd862b355605d7b41f
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Sat Jul 28 11:09:17 2018 -0700

    Remove XDomainRequest special status handling

commit 33747ee8fb349a59368f62c9415664d53c84baf4
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Sat Jul 28 11:04:23 2018 -0700

    Remove usages of isOldIE in tests

commit 7b6f541e9dd03ec8554b9f0c0739f4966c4a7e68
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Sat Jul 28 10:56:37 2018 -0700

    Remove IE10 launcher from karma config

commit 962c38b2a6780fb89dc66d3f2d5ed341d19a22b2
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Sat Jul 28 10:54:51 2018 -0700

    Remove isOldIE check in tests

commit a9831131c307a050a27d29d75925d7d4ad162da5
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Sat Jul 28 09:46:33 2018 -0700

    Remove HTTP 1223 handling
    
    The 1223 error was fixed in IE 10. See https://blogs.msdn.microsoft.com/ieinternals/2012/03/01/internet-explorer-10-consumer-preview-minor-changes-list/

commit 1c2881cbe6b1b57e48ae2e9b3c5dcb9bae81220e
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Sat Jul 21 10:29:11 2018 -0700

    Remove btoa polyfill tests

commit e9c481fa5e49f823d35167c263465aa09feff2ca
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Sat Jul 21 10:27:58 2018 -0700

    Delete btoa polyfill

commit 5c754e6e07b536826d0a3b4e010d839482f3dd2c
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Sat Jul 21 10:27:39 2018 -0700

    Remove ie8/9 special CORS treatment and btoa polyfill

commit 0bb9aaf72643de7b44a25780ca723007f6251d32
Author: Rikki Gibson <rikkigibson@gmail.com>
Date:   Sat Jul 21 10:27:12 2018 -0700

    Remove ie9 custom launcher

commit 98080381fa78dcffa91a15e6d25617583d13e533
Author: Justin Beckwith <justin.beckwith@gmail.com>
Date:   Thu Jul 5 22:41:13 2018 -0700

    test: use mocha instead of nodeunit (#1655)

commit 0c4bf3cdbd937984505403d7ec15b1cbb8cedb05
Author: Anthony Gauthier <antho325@hotmail.com>
Date:   Thu Jul 5 14:08:41 2018 -0400

    Added axios-curlirize (#1653)
    
    * Added axios-curlirize to Ecosystem documentation

commit ef2240a6660eaadb20f058c4a933cb7a60517a96
Author: Jim Lynch <mrdotjim@gmail.com>
Date:   Thu Jul 5 11:02:41 2018 -0400

    Update README.md (#1484)
    
    adding in the necessary require statement (in nodejs).

commit 7d9a29ee4c597adacd8dcec6a6e3bdfe4983ab09
Author: Khaled Garbaya <khaledgarbaya@gmail.com>
Date:   Thu Jul 5 08:51:11 2018 +0200

    Fixing http adapter to allow HTTPS connections via HTTP (#959)

commit 84388b038954d584d6738b169e7b6928ffc9b6fa
Author: Sako Hartounian <sakohartounian@yahoo.com>
Date:   Wed Jul 4 23:48:07 2018 -0700

    cleaner definitions with union types. (#1551)

commit 787c808c0401b766d2769097cef864dd1cfb536b
Author: Mark van den Broek <mvdnbrk@gmail.com>
Date:   Thu Jul 5 08:47:17 2018 +0200

    Fix: Removes usage of deprecated Buffer constructor. (#1555) (#1622)

commit d74238e1513a57ce3bd2b3683f0e595ac00fa8d7
Author: Guillaume Briday <guillaumebriday@gmail.com>
Date:   Mon Jul 2 05:10:04 2018 +0200

    Adding second then on axios call (#1623)
    
    Inspired by this issue : https://github.com/axios/axios/issues/792#issuecomment-289306590

commit 405fe690f93264d591b7a64d006314e2222c8727
Author: arpit <arpit2438735@gmail.com>
Date:   Sun Jun 17 20:41:31 2018 +0530

    Fix:Closing curly braces

commit 8cb7d667fb73c85792d178ffae64e09dee2a3edb
Author: arpit <arpit2438735@gmail.com>
Date:   Sun Jun 17 20:33:06 2018 +0530

    [NS]: Send `false` flag isStandardBrowserEnv for Nativescript

commit 73cab975f04be433bcafe7b60cb5aecf22c13fb1
Author: Stephan Schneider <stephanschndr@gmail.com>
Date:   Thu Jun 14 11:56:20 2018 +0200

    typings: allow custom return types
    
    response interceptor might change the type from AxiosResponse to anything they like

commit 0b3db5d87a60a1ad8b0dce9669dbc10483ec33da
Author: Tim Garthwaite <tim.garthwaite@jibo.com>
Date:   Wed Apr 11 11:23:38 2018 -0400

    Fixing defaults to use httpAdapter if available (#1285)
    
    * Fixing defaults to use httpAdapter if available
    * Use a safer, cross-platform method to detect the Node environment

commit 961ecd129cf755a989727c09ebf0d95f99052f52
Author: Martti Laine <martti@codeclown.net>
Date:   Wed Apr 11 17:23:01 2018 +0200

    Correctly catch exception in http test (#1475)

commit ec97c686efcc4a8968d632dab018e77215c5fe6d
Merge: dd16944 4e8039e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Apr 10 15:28:12 2018 -0700

    Merge pull request #1395 from codeclown/instance-options
    
    Fixing #385 - Keep defaults local to instance

commit 4e8039ef65d3daa35b1c5a1cd13beaf4c283249a
Author: Martti Laine <martti@codeclown.net>
Date:   Tue Apr 10 22:29:02 2018 +0200

    Remember socketPath in mergeConfig

commit dd16944ecf70d8939ce77d79b57463e193d023a6
Author: Shane Fitzpatrick <fitzpasd@gmail.com>
Date:   Sun Apr 8 00:19:46 2018 -0700

    Adding better 'responseType' and 'method' type definitions by using a string literal union type of possible values (#1148)

commit 8e3b50c56418b9070e22bc59fc9346ae4a7726c9
Author: Justin Beckwith <justin.beckwith@gmail.com>
Date:   Sun Apr 8 00:18:56 2018 -0700

    docs: es6ify the docs a little (#1461)

commit 7b11cc7181b4536233299efe98c6e7779d13e95e
Author: Justin Beckwith <justin.beckwith@gmail.com>
Date:   Sun Apr 8 00:18:30 2018 -0700

    docs: specify maxContentLength is in bytes (#1463)

commit ae1c2c30061f6c8d90c43cee3ea906f3151d0de8
Author: Justin Beckwith <beckwith@google.com>
Date:   Sat Apr 7 15:04:23 2018 -0700

    chore: update to latest version of a few dev dependencies

commit 4d90e231f060c7f298903a852b95340129253d27
Author: Justin Beckwith <beckwith@google.com>
Date:   Sat Apr 7 15:00:39 2018 -0700

    chore: update to latest version of sinon

commit f620a0d4af59796404b40c48cfbbd41cbac143de
Author: Justin Beckwith <beckwith@google.com>
Date:   Sat Apr 7 14:58:27 2018 -0700

    chore: update to latest version of typescript

commit aa61bc85eba22fd0aa1db150dfcaf2dbc57c0d46
Author: Justin Beckwith <beckwith@google.com>
Date:   Sat Apr 7 14:56:20 2018 -0700

    chore: update a few dev dependencies

commit 78926c308e17e22c216017e59c296aaf77d92f29
Author: Justin Beckwith <beckwith@google.com>
Date:   Sat Apr 7 14:45:59 2018 -0700

    chore: update runtime dependencies

commit aaed16ca3c4f789b8755eb33edf6a2ffa07ec255
Author: Justin Beckwith <justin.beckwith@gmail.com>
Date:   Sat Apr 7 14:29:15 2018 -0700

    Revert "fix: update a bunch of dependencies" (#1464)
    
    This change broke the saucelabs tests for IE9.  Instead of updating all the things at once, I'm going to do one PR per dependency, making sure I don't break stuff along the way :) This reverts commit 152b0635136801f1fdc0864d7b8dba3c12d86cb2.

commit 143bbbe1b96f7819d6df5f1c249ba0964cf84819
Author: Martti Laine <martti@codeclown.net>
Date:   Sat Apr 7 15:54:56 2018 +0200

    Spec for mergeConfig, finalize logic

commit ff61caacb78da139b3a1b199df2c4b40cd55a3cc
Author: Martti Laine <martti@codeclown.net>
Date:   Sat Apr 7 13:40:21 2018 +0200

    Slight refactor/namings/comment on mergeConfig

commit 8c178233e18033dc7d8f3285530e9e33d009227b
Merge: 0d110da 22c2baf
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Apr 6 22:13:53 2018 -0700

    Merge pull request #1460 from JustinBeckwith/linty
    
    chore: upgrade eslint and add fix command

commit 22c2baf20563c767945e28ab3c54d51a6a1887c5
Author: Justin Beckwith <beckwith@google.com>
Date:   Fri Apr 6 21:50:20 2018 -0700

    chore: upgrade eslint and add fix command

commit 0d110da98caa9a3e1823a9dae0d5f4df09bc01ec
Merge: b2ce0de ecded5e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Apr 6 21:45:50 2018 -0700

    Merge pull request #1458 from JustinBeckwith/nopgklock
    
    chore: ignore package-lock.json

commit b2ce0de29ef0eaa91195576363edea6ca0481881
Merge: cb89fae 152b063
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Apr 6 21:44:03 2018 -0700

    Merge pull request #1457 from JustinBeckwith/updatey
    
    fix: update a bunch of dependencies

commit ecded5e58f1015f0f69b4aae76efc310f51ca496
Author: Justin Beckwith <beckwith@google.com>
Date:   Fri Apr 6 21:21:45 2018 -0700

    chore: ignore package-lock.json

commit 152b0635136801f1fdc0864d7b8dba3c12d86cb2
Author: Justin Beckwith <beckwith@google.com>
Date:   Fri Apr 6 21:19:49 2018 -0700

    fix: update a bunch of dependencies

commit cb89fae28f2372955ffdbb153034f612efc31b6c
Author: Lim Jing Rong <jjingrong@users.noreply.github.com>
Date:   Sat Apr 7 11:52:06 2018 +0800

    docs: Added ES6 example in README (#1091)
    
    The alternative way I added is more common and requested, as seen from issues
    #362 , #350. Should be helpful for the beginners ( I was personally stuck for a bit too )

commit 524f5bf10a29d5ebd702e0867ccd63809bfd6c74
Author: Yutaro Miyazaki <yutaro@studio-rubbish.com>
Date:   Sat Apr 7 12:44:20 2018 +0900

    fix: Fix type error when socketPath option in AxiosRequestConfig

commit cb630218303095c0075182b542ccb2f72d20dd9d
Merge: e990a91 c65065a
Author: Justin Beckwith <justin.beckwith@gmail.com>
Date:   Fri Apr 6 12:38:04 2018 -0700

    fix: capture errors on request data streams

commit e990a91c34bd81a5cb9261c7a0284dfd8169c0ae
Merge: 9a6abd7 88c24d8
Author: Justin Beckwith <justin.beckwith@gmail.com>
Date:   Fri Apr 6 12:37:38 2018 -0700

    docs: clarify config order of precedence

commit 88c24d85ee0d18a9d0c09ef229a76c4a796ccf89
Author: Justin Beckwith <beckwith@google.com>
Date:   Fri Apr 6 11:38:58 2018 -0700

    docs: clarify config order of precedence

commit b1c378606f09a38d7e6713595add07676882b8f2
Author: Martti Laine <martti@codeclown.net>
Date:   Tue Apr 3 22:29:15 2018 +0200

    Prevent undefined values in mergeConfig

commit 506d4e894157cd5b94432c4d7904d832cf0b951f
Author: Martti Laine <martti@codeclown.net>
Date:   Tue Apr 3 22:19:38 2018 +0200

    Unit tests for deepMerge

commit 6083d639c54cb093862bfee3f55d45e6456aa217
Author: Martti Laine <martti@codeclown.net>
Date:   Tue Apr 3 21:53:45 2018 +0200

    Rename mergeConfig arguments

commit 82030ae054ba10bbd25ef00b304990632780f11d
Author: Martti Laine <martti@codeclown.net>
Date:   Tue Apr 3 21:53:17 2018 +0200

    Use deepMerge in deepMerge

commit 72c66dfdecbcc165c52fcd19d1f8444ad8c011c6
Author: Martti Laine <martti@codeclown.net>
Date:   Fri Mar 23 20:21:02 2018 +0100

    Refactor and introduce deepMerge

commit c65065ac0f3f1af3986e881bc197362621fd550c
Author: Justin Beckwith <justin.beckwith@gmail.com>
Date:   Thu Mar 15 22:12:42 2018 -0700

    capture errors on request data streams

commit 9a6abd789f91a87d701116c0d86f1cfbc3295d66
Merge: 4fbf084 7340c5d
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Mar 10 09:13:04 2018 -0800

    Merge pull request #869 from johntron/master
    
    Adds option to specify character set in responses (with http adapter)

commit d1154eae3fe10c48809099aa5ec07c3c5d124e1d
Merge: d782047 0445d6c
Author: Martti Laine <martti@codeclown.net>
Date:   Fri Mar 9 13:58:35 2018 +0200

    Merge branch 'instance-options' of github.com:codeclown/axios into instance-options

commit d78204712a88f9e7c8ebad728143dee56ca995f3
Author: Martti Laine <martti@codeclown.net>
Date:   Fri Mar 9 13:58:08 2018 +0200

    Clean up PR

commit 4fbf08467459845b0551dd60e3fd2086b1d19c4a
Merge: b14cdd8 fa3c6d2
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Mar 8 09:35:58 2018 -0800

    Merge pull request #1040 from pbarbiero/pbarbiero/improved-timeout-handling
    
    Decorate resolve and reject to clear timeout in all cases

commit b14cdd842561b583b30b5bca5c209536c5cb8028
Merge: 0499a97 f9373e9
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Mar 8 07:56:53 2018 -0800

    Merge pull request #1401 from ascott18/patch-1
    
    [Typescript] Fix missing type parameters on delete/head methods

commit f9373e96f29baebd90dd89aa3a0cd35fc918f27b
Author: Andrew Scott <ascott18@gmail.com>
Date:   Wed Mar 7 22:17:44 2018 -0800

    Added tests for additional type parameters

commit fbb29e07cc22dfe45919d9499c0ea43326a35579
Author: Andrew Scott <ascott18@gmail.com>
Date:   Wed Mar 7 22:13:02 2018 -0800

    Fixing missing type parameters on delete/head

commit 0499a970d7064d15c9361430b40729d9b8e6f6bb
Merge: d4dc124 980065d
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 7 11:50:16 2018 -0800

    Merge pull request #1399 from mattridley/master
    
    Fixing #537 Rejecting promise if request is cancelled by the browser

commit 980065dd28cb167747fb3254d407b8d941e25d98
Author: mattridley <matt.r@joinblink.com>
Date:   Mon Mar 5 16:26:44 2018 +0000

    Reverting committed dist changes

commit 762044e4539947bdaaf4e8731d39c669c6ef6d82
Author: mattridley <matt.r@joinblink.com>
Date:   Mon Mar 5 16:11:55 2018 +0000

    Fixing #537 Rejecting promise if request is cancelled by the browser

commit 0445d6c39ead139a9e7fb8ef0bca43bda3bc0724
Merge: 5bfd2ea d4dc124
Author: Martti Laine <martti@codeclown.net>
Date:   Fri Mar 2 12:32:47 2018 +0200

    Merge branch 'master' into instance-options

commit 5bfd2ea9f63e59efaef3f1a659b55bbb9778fce2
Author: Martti Laine <martti@codeclown.net>
Date:   Thu Mar 1 23:53:38 2018 +0200

    Fixing #385 - Keep defaults local to instance

commit d4dc124f15c8dc69861b9cf92c059dbda46ae565
Merge: a105872 3ca0499
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Thu Feb 22 20:03:46 2018 -0700

    Merge pull request #1276 from dericcain/patch-1
    
    Added a simple async/await example

commit 3ca049924eb492a74c7d2665ebb791ac4c623e44
Author: Deric Cain <deric.cain@gmail.com>
Date:   Wed Feb 21 08:46:48 2018 -0600

    Actually added the Async example
    
    Also, added notes about using Async/Await with caution

commit a105872c1ee2ce3f71ff84a07d9fc27e161a37b0
Merge: d59c70f b692057
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Mon Feb 19 23:39:06 2018 -0700

    Merge pull request #1122 from Nilegfx/bugfix/allow-method-in-instance-config
    
    Fixing default method for an instance always overwritten by get

commit b6920570c517013ec62ea502edd6f78fbe8332a8
Merge: 6566598 d59c70f
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Mon Feb 19 23:33:44 2018 -0700

    Merge branch 'master' into bugfix/allow-method-in-instance-config

commit d59c70fdfd35106130e9f783d0dbdcddd145b58f
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Mon Feb 19 16:23:58 2018 -0700

    Releasing v0.18.0

commit 48a790222c3b6a640bf3f280162c1ccf73108b58
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Mon Feb 19 15:59:10 2018 -0700

    Prepping for release: updating CHANGELOG.

commit 5b2ea2e54c08862314477bd3ac860c1819d25abb
Merge: 23ba296 f7310ca
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Sat Feb 17 09:28:47 2018 -0700

    Merge pull request #1364 from MiguelMadero/mmadero/documents-timeout
    
    Documents default

commit 23ba29602cf941d943772cbccee1fd260f5e0d02
Merge: b6b0865 7a355ff
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Fri Feb 16 19:58:48 2018 -0700

    Merge pull request #1342 from alpancs/instance-bug-fix
    
    fix cannot send post method

commit b6b0865352743c4c61d7e80d9708f98fa876a253
Merge: 821d5e2 f1a0feb
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Fri Feb 16 18:42:33 2018 -0700

    Merge pull request #1363 from mdlavin/patch-1
    
    Add reference to axios-fetch in ECOSYSTEM.md

commit 821d5e245ad4bf9536142121ac6cd86259019196
Merge: ccc7889 4ea77b7
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Fri Feb 16 18:35:48 2018 -0700

    Merge pull request #1366 from emilyemorehouse/fix/1070
    
    Follow up to #1070 - adding documentation and tests

commit 4ea77b70b70501c0a701db837e77024de1e2fcf4
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Fri Feb 16 17:18:58 2018 -0700

    Follow up to #1070:
    - Adding information in README for socketPath when used with a proxy
    - Adding an HTTP test for socketPath option

commit ccc78899bb6f595e3c44ec7ad6af610455859d78
Merge: 40b8299 85a48b2
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Fri Feb 16 17:05:48 2018 -0700

    Merge pull request #1070 from Starfox64/master
    
    Adding support for UNIX Sockets

commit f7310ca083afe7270d6fbf16ec33fc977573a684
Author: MiguelMadero <git@miguelmadero.com>
Date:   Wed Feb 14 17:49:39 2018 -0800

    Documents the timeout default

commit f1a0feb2cd9b97f00fcea3a48c461c63a0a43ff6
Author: Matt Lavin <matt.lavin@gmail.com>
Date:   Wed Feb 14 12:03:37 2018 -0500

    Add reference to axios-fetch in ECOSYSTEM.md
    
    Add reference to a Fetch implementation based on an Axios client

commit 40b829994c2e407109a38a4cf82703261aa3c22c
Merge: f26e0c0 839b9ab
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Sun Feb 11 13:30:28 2018 -0600

    Merge pull request #1357 from emilyemorehouse/fix/1286
    
    Companion for #1286 and #1287 - also updating follow-redirects version in package.json

commit 839b9ab3e7eddb0941029b176825e1e1e89eec57
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Sun Feb 11 13:24:50 2018 -0600

    Fixes #1286 - also updating follow-redirects version in package.json to ensure that maxBodyLength option is supported

commit f26e0c0e7afd7b6b675744c75f613e60215d829f
Merge: 14057dc 89bf42b
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Sun Feb 11 13:25:55 2018 -0600

    Merge pull request #1287 from mividtim/mividtim/follow-redirects-max-length
    
    Set maxBodyLength on follow-redirects to match maxContentLength on AxiosOptions

commit 14057dc0bd9811a9fda773588f66de9f4aa0f617
Merge: 604e8dd 547f3f3
Author: Emily Morehouse <emily@cuttlesoft.com>
Date:   Wed Feb 7 20:23:28 2018 -0700

    Merge pull request #1273 from jcrben/master
    
    adding codetriage badge

commit 7a355ff4327038bbac1c194b30b999fe66e009d9
Author: Alfan Nur Fauzan <alpancs@gmail.com>
Date:   Wed Feb 7 12:47:24 2018 +0700

    fix cannot send post method

commit 604e8dd86012392d8f588a3a8526a0d8a1ddb95f
Merge: b004db4 a8de2cf
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Jan 22 08:41:09 2018 -0800

    Merge pull request #1314 from penance316/master
    
    Adding example of cancelling a POST request to readme

commit a8de2cf485cef106427bd7705ea30ddcd5e6f6ac
Author: Nero <penance316@users.noreply.github.com>
Date:   Mon Jan 22 16:36:45 2018 +0000

    update example according to feedback from PR

commit b004db40d42267666ba39804d84f440e5feb9dff
Merge: 138108e ade3c70
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Jan 22 08:14:48 2018 -0800

    Merge pull request #1188 from 38elements/patch-1
    
    Removing unused dependencies

commit c51054f24d49ecf76c6249c9e7a2d37a7d01376a
Author: Nero <penance316@users.noreply.github.com>
Date:   Mon Jan 22 13:00:21 2018 +0000

    add example of cancelling a POST request to readme
    
    it seems when cancelling a post request we need to specify cancellation token as an axios parameter and not as a data item.

commit 89bf42b946a6bf5344801cf72a60b0a15cab49e1
Author: Tim Garthwaite <tim.garthwaite@jibo.com>
Date:   Thu Jan 11 12:54:29 2018 -0500

    Fix typo

commit e452f761f7c9edbd9e4e73493373f427b0fb5141
Author: Tim Garthwaite <tim.garthwaite@jibo.com>
Date:   Thu Jan 11 10:44:40 2018 -0500

    Don't set maxBodyLength in follow-redirects if maxContentLength is -1

commit bbfa7bfaccff368dd3666f32fb47773f863ec242
Author: Tim Garthwaite <tim.garthwaite@jibo.com>
Date:   Wed Jan 10 19:01:56 2018 -0500

    Fixing maxBodyLength exceeded error form follow-redirects when axios's maxContentLength is not exceeded

commit 138108ee56bd689305ae505a66b48d5e9c8aa494
Merge: 6e60501 66280b0
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Jan 10 21:09:16 2018 -0800

    Merge pull request #1279 from robaxelsen/docs-ecosystem-adding-library
    
    Adding redux-saga-requests to ecosystem in docs

commit 66280b037e50d1b5943e8e5c9c7626cdeca3dc61
Author: Robert Axelsen <rob@rob.ee>
Date:   Tue Jan 9 20:39:43 2018 +0100

    Adding redux-saga-requests to ecosystem in docs
    
    Closes #1100.

commit 6e605016f03c59b5e0c9d2855deb3c5e6ec5bbfc
Merge: db44a8f 7ee6ec5
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Jan 8 08:29:53 2018 -0800

    Merge pull request #1272 from aaronang/github-templates
    
    Fix Markdown formatting for issue and pull request template

commit d8cce2017d41d6fcdb83ff06d2b7f6d0bb370b20
Author: Deric Cain <deric.cain@gmail.com>
Date:   Mon Jan 8 06:15:16 2018 -0600

    Added a simple async/await example
    
    Since `async/await` is not widely used, and I have seen quite a few questions on how to actually use `async/await` with Axios, I figured it would be nice to have it in the readme, front and center.

commit 547f3f31fa289ab0c6e840340f0501954d8a76f1
Author: Ben Creasy <bcreasy@brightidea.com>
Date:   Sat Jan 6 23:03:53 2018 -0800

    adding codetriage badge

commit 7ee6ec5a84162e8dbc97a613829534a09cea7c94
Author: Aaron Ang <aaron.ang@parc.com>
Date:   Sat Jan 6 22:30:43 2018 -0800

    Fix Markdown formatting for issue and pull request template
    
    [skip ci]

commit db44a8f316da7e1f058eaed3556e9a391a2ffd3e
Merge: 84a00b2 d07e648
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Jan 6 15:15:48 2018 -0800

    Merge pull request #1254 from evanshortiss/ts-instance-fix
    
    Fixing type definitions so AxiosInstance can be invoked

commit 84a00b2227cbda8175afb9dbc5dac7eab47f691e
Merge: ae218d0 521a429
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Jan 6 15:13:57 2018 -0800

    Merge pull request #1192 from punit-gupta01/master
    
    Fixing interface of axios instance

commit ae218d0131ecbd683310272c10b0273fd1d97de4
Merge: 8be4d65 a1e895d
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Jan 5 08:33:57 2018 -0800

    Merge pull request #1198 from liutao/patch-1
    
    Update buildURL.js

commit 8be4d65cdd22d7ce4f7d069f790463a20290858a
Merge: d7f021b 145b63e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Jan 5 08:30:15 2018 -0800

    Merge pull request #1264 from m1guelpf-forks/patch-1
    
    Update license date

commit 145b63e8e694bd2fc81db62c6e8f680d41d25615
Author: Miguel Piedrafita <github@miguelpiedrafita.com>
Date:   Mon Jan 1 00:57:34 2018 +0100

    Update license date

commit 521a429f2d9a801dd10520af37c765bb0fde20e0
Author: Punit Gupta <punit.gupta@wingify.com>
Date:   Thu Dec 21 15:24:34 2017 +0530

    fix(index.d.ts): Remove redundant types

commit d07e648c3059dd5eae5f8efb135bbf40bc585e8e
Author: Evan Shortiss <evanshortiss@gmail.com>
Date:   Wed Dec 20 21:45:48 2017 -0800

    Fixing type definitions so AxiosInstance can be invoked

commit a1e895d6709bda84a203010e4dfe2a331bafbb4f
Author: 刘涛 <liutaofe@gmail.com>
Date:   Thu Nov 23 16:22:55 2017 +0800

    Update buildURL.js
    
    Two if statements is unnecessary, we can replace with "if ... else ..."

commit 423923217ef0d78747ef90c49abbcd7c2eae3854
Author: Punit Gupta <punit.gupta@wingify.com>
Date:   Mon Nov 20 21:53:47 2017 +0530

    Fixing interface of axios instance

commit ade3c705d4f81da1cd1a1b16a0914900c7c364ce
Author: 38elements <38elements@users.noreply.github.com>
Date:   Sat Nov 18 00:42:43 2017 +0900

    Removing unused dependencies
    
    PhantomJS is not used in axios.

commit d7f021b8d4cc50bfa0653011bc02452d234d1255
Merge: ad1195f f029369
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 11 21:28:23 2017 -0800

    Merge pull request #1177 from dhcmrlchtdj/fix-typing
    
    Fixing typing issues #1154 #1147

commit f0293696e72f3169b22258e0eb8b9985ac0cdd29
Author: niris <nirisix@gmail.com>
Date:   Sun Nov 12 12:30:02 2017 +0800

    Fixing typing issues #1154 #1147

commit ad1195f0702381a77b4f2863aad6ddb1002ffd51
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 11 15:24:16 2017 -0800

    Releasing 0.17.1

commit 599eb9890c6ef8c50f4f3d2a15575fa0648c6935
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 11 15:22:47 2017 -0800

    Updating changelog

commit 587f0210ce257d3f737f180fa1272e9eb266a287
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 11 15:21:46 2017 -0800

    Updating changelog

commit b7d8d126dad7341addcd7b063f7b261955ec9152
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 11 15:09:02 2017 -0800

    Removing unnecessary condition

commit 1fa01fd674154038152b1f3ecd448ad7d4e03031
Merge: 026db21 468e909
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 11 14:14:20 2017 -0800

    Merge pull request #1160 from owap/undefined-window
    
    Move window defined check before window.XMLHttpRequest check

commit 026db2140d53c6aed43495207f1897ac7c88fd6d
Merge: 7ea8f3d 1005e3b
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 11 12:20:54 2017 -0800

    Merge pull request #1165 from psachs21/patch-1
    
    Updating typings

commit 7ea8f3d9f71ab150ab62f1531eb95dbcb8308753
Merge: 1ee5494 1e58b69
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 11 12:09:40 2017 -0800

    Merge pull request #1173 from posva/patch-1
    
    security: upgrade follow-redirects

commit 1e58b69df16180fb702a051519fbf24bc83b6102
Author: Eduardo San Martin Morote <posva@users.noreply.github.com>
Date:   Tue Nov 7 18:00:42 2017 +0100

    security: upgrade follow-redirects
    
    This would prevent tools like nsp to complain about a security issue from axios. It's something that got fixed in the package debug, and in order to benefit from that fix, it's necessary to upgrade to at least follow-redirects@1.2.5

commit 1005e3bf14fac3c08f6d9cb1420c935a24758cee
Author: Paul Sachs <psachs21@users.noreply.github.com>
Date:   Fri Nov 3 11:57:12 2017 -0400

    Updating typings
    
    The first argument in `axios.interceptors.response.use` is optional, in the case that you just want to intercept an error.
    
    Ex:
    
    ```ts
    axios.interceptors.response.use(undefined, error => {
    ...
    });
    ```

commit 468e90993d4ee556a4cf414fb1d6b6f7b99ed98a
Author: Andrew J. Pierce <apierce@openwhere.com>
Date:   Thu Nov 2 18:47:24 2017 -0400

    Move `window` defined check before window.XMLHttpRequest check

commit 1ee5494038f74198f70e53835960948f9654ed0f
Merge: fbb5d4d 63548c0
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Nov 1 09:38:39 2017 -0700

    Merge pull request #1156 from clarkdo/master
    
    refactor: !isArray(obj) is always true

commit 63548c00c0314a835402bf1f30883d33e7b19dc1
Author: Clark Du <clark.duxin@gmail.com>
Date:   Wed Nov 1 15:47:58 2017 +0800

    refactor: !isArray(obj) is always true

commit fbb5d4d0d1d4dd1cdbb02f30d05738e0b8e5316b
Merge: 8bea343 b01ce19
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Oct 24 07:58:13 2017 -0700

    Merge pull request #1080 from MarshallOfSound/patch-1
    
    Allow overriding the used transport

commit 8bea343f3d2c01a20430e649a0b1371473d382ba
Merge: 3f90738 1f333ca
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Oct 24 07:51:08 2017 -0700

    Merge pull request #1125 from keenondrums/master
    
    Update AxiosTransformer type in index.d.ts

commit 3f90738f48d124ceae57f0c8207fc3b78ad289fb
Merge: 2c0e318 48ece5a
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Oct 24 07:47:16 2017 -0700

    Merge pull request #1131 from jmmk/axios-response-request
    
    Add request field to AxiosResponse type definition

commit 2c0e3183215d9a5fbc2ee8f35f459ac0e4d9f99c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Oct 21 11:00:45 2017 -0700

    Releasing 0.17.0

commit c24b1cc5de354cb0d123e8ef05e4d24153762729
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Oct 21 10:57:53 2017 -0700

    Updating changelog

commit add023c25c2bd0103495b86fe5cf2dbacfadd75f
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Oct 20 08:02:01 2017 -0700

    Update build status badge URL

commit ada06d1522d3270043bae732174fbaa4061bc99e
Merge: 94f1e21 7133141
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Oct 20 07:31:26 2017 -0700

    Merge branch 'master' of github.com:axios/axios

commit 94f1e21ba398a3d379aedfdb65b49e48e27e210f
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Oct 20 07:31:15 2017 -0700

    Fix SauceLabs config

commit 7133141cb9472f88220bdaf6e6ccef898786298d
Merge: 638804a b0dccc6
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Oct 20 07:16:23 2017 -0700

    Merge pull request #1061 from d-fischer/ts-generic-response
    
    Update TypeScript typings with generic type parameters

commit 638804aa2c16e1dfaa5e96e68368c0981048c4c4
Merge: 26b0639 f06ee73
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Oct 17 21:22:42 2017 -0700

    Merge pull request #1135 from kuitos/master
    
    Adding axios-extensions to the ecosystem

commit f06ee7390f30abadb26826e371f40e3f960a3fba
Author: Kuitos <kuitos.lau@gmail.com>
Date:   Wed Oct 18 11:26:49 2017 +0800

    Adding axios-extensions to the ecosystem

commit 48ece5adbd45ea693a1c496fac7a9349b3e951e0
Author: Michael McLellan <jmikem825@gmail.com>
Date:   Sat Oct 14 23:25:18 2017 -0400

    Add request field to AxiosResponse type

commit 1f333ca645a49273bdae6c7f264727b04df95395
Author: Andrei Goncharov <frantic1993@gmail.com>
Date:   Wed Oct 11 15:12:51 2017 -0600

    Update index.d.ts

commit 6566598603953b159ec23227e100c7013c39efea
Author: ahmed ayoub <ahmed.mahmoud@zalando.de>
Date:   Tue Oct 10 21:17:37 2017 +0200

    allowing default method for an instance

commit 26b06391f831ef98606ec0ed406d2be1742e9850
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Sep 28 21:09:47 2017 -0700

    Update links

commit 17e44c8ec9692516ef3d8794b1b42e0ae7543ed1
Merge: 51b3ad6 e8edb1e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Sep 27 21:22:09 2017 -0700

    Merge pull request #982 from ibci/use-XMLHttpRequest-for-IE10+
    
    Use XMLHttpRequest in IE10+ instead of XDomainRequest

commit 51b3ad65269ee83e2c8b4409414ce4d02f9f86de
Merge: ab974a7 4c54a92
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Sep 27 20:53:40 2017 -0700

    Merge pull request #987 from siddharthkp/master
    
    Add bundlesize to test

commit ab974a708d7dbaab49f4319f5aa9eef28d16a384
Merge: 7f60dd8 69d5a4c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Sep 27 20:51:51 2017 -0700

    Merge pull request #1055 from fridzema/patch-1
    
    Tiny fix

commit 7f60dd8441ba9a202c3151445a2431ea8dce6e0d
Merge: 07a7b7c b26f351
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Sep 27 20:50:53 2017 -0700

    Merge pull request #1056 from jin5354/patch-1
    
    Update ECOSYSTEM.md

commit b01ce193a567dcf3a7c2c62cff5d582f264daae2
Author: Samuel Attard <samuel.r.attard@gmail.com>
Date:   Sun Sep 10 02:04:00 2017 +1000

    Allow overriding the used transport
    
    This allows users of axios inside `electron` to provide the [`net`](https://electron.atom.io/docs/api/net/) module as the http transport instead of using nodes http/https modules.  This gives a whole bunch of things to Electron users including automatic proxy resolution.

commit 85a48b2eaaae185f98dec8ef83d14db5332d11e1
Author: Starfox64 <louisdijon21@yahoo.fr>
Date:   Mon Sep 4 17:06:19 2017 +0200

    Adding support for UNIX Sockets

commit b0dccc6f1696446c79af54b306151c384afc5d51
Author: Daniel Fischer <fischer.daniel94@googlemail.com>
Date:   Tue Aug 29 20:53:49 2017 +0200

    Updated TypeScript typings with generic type parameters for request methods & AxiosResponse

commit b26f351b6d15475a18312e7b6915a38814cbc224
Author: An Yan <xiaoyanjinx@gmail.com>
Date:   Tue Aug 22 10:48:25 2017 +0800

    Update ECOSYSTEM.md
    
    add axios-cache-plugin to ECOSYSTEM.md

commit 69d5a4c2c068cdc8cfab47594387434e0c292b74
Author: Robert Fridzema <fridzema@gmail.com>
Date:   Mon Aug 21 14:56:27 2017 +0200

    Tiny fix

commit 7340c5d5fb48411ac49723b203273834cea90a5e
Author: John Syrinek <john.syrinek@gmail.com>
Date:   Mon Apr 24 15:48:51 2017 -0500

    Adds option to specify character set in responses when using http adapter

commit 07a7b7c84c3ea82ea3f624330be9e0d3f738ac70
Author: Julien Roncaglia <fox@vbfox.net>
Date:   Mon Aug 14 13:38:44 2017 +0200

    Adding a way to disable all proxy processing (#691)
    
    * Adding a way to disable all proxy processing
    
    When the proxy field in configuration is === false all proxy processing is
    disabled. This specifically disable the 'http_proxy' environment variable
    handling.
    
    Fixes #635
    Related to #434
    
    * Change readme wording
    
    From review comment on PR (#691)

commit 62db26b58854f53beed0d9513b5cf18615c64a2d
Author: George Chung <Gerhut@GMail.com>
Date:   Sun Aug 13 23:30:27 2017 +0800

    add axiosist to ECOSYSTEM.md (#963)

commit fa3c6d22f7a5e0a963119109fccb8d86ad981c03
Author: pbarbiero <pbarbiero@gmail.com>
Date:   Sat Aug 12 08:50:21 2017 -0500

    Decorate resolve and reject to clear timeout

commit db4acb2ec99509942b2664eb0fae3e309ffcfc54
Author: Ken Mayer <ken@bitwrangler.com>
Date:   Sat Aug 12 06:02:43 2017 -0700

    Documentation change for transformRequest (#955)

commit a7c97429423a55f14cc5116963f6cdba4e0e5e81
Author: Thomas Landauer <thomas@landauer.at>
Date:   Sat Aug 12 15:02:22 2017 +0200

    Added link to caniuse.com (#954)

commit b9ad308879ca5cef46eae9fe213ef593fe86e093
Author: jdrydn <james@jdrydn.com>
Date:   Sat Aug 12 14:01:05 2017 +0100

    Update ECOSYSTEM.md (#941)

commit fb08e956035773712056781cadc47c0c9b6d3c09
Author: Tyler Brown <tyler@tybro.io>
Date:   Sat Aug 12 08:58:10 2017 -0400

    Duplicate header handling (#874)
    
    * Update parseHeaders to match node http behavior
    
    Node ignores duplicate entries for certain HTTP headers.
    
    It also always converts the `set-cookie` header into an array.
    
    * add tests for new duplicate header handling
    
    * clarify comment

commit 2b8562694ec4322392cb0cf0d27fe69bd290fcb2
Author: Haven <baoyx007@gmail.com>
Date:   Sat Aug 12 20:15:27 2017 +0800

    Fixing baseURL not working in interceptors (#950)
    
    * Fixing baseURL not working in interceptors
    
    * add test for  modify base URL in request interceptor

commit 6508280bbfa83a731a33aa99394f7f6cdeb0ea0b
Author: Michael Marvick <mmarvick@gmail.com>
Date:   Sat Aug 12 06:12:20 2017 -0500

    Updating Typescript typing for AxiosError to include `request?` param (#1015)

commit f1fb3de38fc96287763aeb7c5fee23858c851955
Author: Raymond Rutjes <raymond.rutjes@gmail.com>
Date:   Mon Jul 10 09:50:43 2017 +0200

    refactor(http): use ClientRequest "aborted" value (#966)

commit 4c54a9265a92785825db976431a1e25599204029
Author: Siddharth Kshetrapal <siddharth.kshetrapal@gmail.com>
Date:   Sat Jul 1 19:03:17 2017 +0530

    Add bundlesize to test

commit e8edb1e29aaea23c06333efae998b59d9dc4b9cf
Author: ibci <ibcisaac@hotmail.com>
Date:   Tue Jun 27 13:20:45 2017 -0700

    Update xhr.js

commit 46e275c407f81c44dd9aad419b6e861d8a936580
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Jun 3 12:28:26 2017 -0700

    Releasing 0.16.2

commit e04081597754a3981e9d3c68aa8d359fc6dbe60b
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Jun 3 12:26:34 2017 -0700

    Updating Changelog

commit 3579da4cb0ebc8d29907f256cfd05e12d9c3216a
Merge: d1278df e4e3212
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed May 31 22:29:57 2017 -0700

    Merge pull request #930 from luciy/master
    
    Convert the method parameter to lowercase

commit e4e32120cec8ba53fc1f69415d6a8ac10b9c9756
Author: 杨春旭 <407466029@qq.com>
Date:   Wed May 31 22:53:11 2017 +0800

    Convert the method parameter to lowercase

commit d1278dfe353d772c689a7884913a46f122538cd2
Merge: 1beb245 c849467
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue May 30 19:31:42 2017 -0700

    Merge pull request #887 from fgnass/no-buffer-in-browser
    
    No buffer in browser

commit 1beb245f3a9cdc6da333c054ba5776a2697911dd
Author: Martin Joiner <martin@martinjoiner.co.uk>
Date:   Sun May 28 21:03:40 2017 +0100

    Fixing typo in comment blocks of createError() and enhanceError() functions (#857)

commit c8494677bb578e5217a127efe811dd2a039c48aa
Author: Felix Gnass <fgnass@gmail.com>
Date:   Thu May 4 23:43:59 2017 +0200

    use Buffer global in http.js
    
    Since the http adapter is never used in the browser it's safe to use
    the Buffer global and its isBuffer() method directly.

commit c82753ce545657e82bd0856b4ed7176fc31fc2bf
Author: Felix Gnass <fgnass@gmail.com>
Date:   Thu May 4 23:41:52 2017 +0200

    Use is-buffer instead of Buffer.isBuffer
    
    The is-buffer module checks if an object is a Buffer without causing
    Webpack or Browserify to include the whole Buffer module in the bundle.

commit f31317aeca8f7fa385d6aee94ef6ec8ac9d7c072
Merge: 5c8095e 1e76ea3
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Apr 15 09:18:43 2017 -0700

    Merge pull request #830 from mzabriskie/feature/include-request-in-errors
    
    Include underlying request in errors

commit 1e76ea36f3d631cb68779d28d445a9da58dac189
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Apr 8 21:44:41 2017 +0200

    Adding documentation for error.request

commit 22ce6db383bc61adabfd79e5bfe16a7f6c7cebbb
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Apr 8 21:44:15 2017 +0200

    Adding request to error objects when it is available

commit e0d59eb29bba887cb4376d1c37614dd1c2741327
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Apr 8 21:43:04 2017 +0200

    Adding failing tests that verify errors contain the request

commit 5c8095e48329dacaec1f8d43a9b84ed275fbd0ef
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Apr 8 11:51:20 2017 -0700

    Releasing 0.16.1

commit 982183c0e4b7d9e3293e2096863314407e4b85e0
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Apr 8 11:50:04 2017 -0700

    Updating changelog

commit fa582233af21c9f6340aad16801c0ef04c6a0e06
Merge: a18f039 88cc84c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Apr 8 11:26:05 2017 -0700

    Merge pull request #828 from mzabriskie/feature/return-last-request-in-redirects
    
    Return the last request made in axios response

commit a18f0398684c803a24503799a12f3c728cc57d63
Merge: 19644ba df6b46c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Apr 8 11:18:36 2017 -0700

    Merge pull request #829 from jcready/patch-3
    
    Update follow-redirects dependency

commit df6b46c076869caf935780e136fc05fbf944ef0f
Author: Wyatt Cready <jcready@gmail.com>
Date:   Sat Apr 8 14:15:07 2017 -0400

    Add caret

commit 04982a2ef99b2d46cbf1058d9f4a220675063fe0
Author: Wyatt Cready <jcready@gmail.com>
Date:   Sat Apr 8 11:30:02 2017 -0400

    Update follow-redirects dependency
    
    Using the follow-redirects 1.0.0 causes this reported write after end issue: https://github.com/olalonde/follow-redirects/issues/50. It looks like the problem with follow-redirects was fixed in 1.1.0 https://github.com/olalonde/follow-redirects/commit/9eec6f0fb8d1c51dbd9be732ce1e2c794a01b652 but if axios is going to update the dependency it might as well update to the latest version now.

commit 19644bac7bc87a994c77346a1374258f54f713b7
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Apr 8 14:04:10 2017 +0200

    Adding documentation for Buffer data

commit 188334439f9698c8ddd58697f75e7f0b745c9acc
Author: Jeremy Fowler <jeremy.f76@gmail.com>
Date:   Sat Apr 8 06:55:34 2017 -0500

    support node buffers less than 8192 bytes (#773)

commit bbfbeff4bc910cd8cba543a2d519ecd919137566
Author: Ross Olson <Ross@rossolson.com>
Date:   Sat Apr 8 04:29:37 2017 -0700

    Minor grammar/line length changes (#547)

commit a784774981f06795748faafd36ba2dde90248420
Author: Khaled Garbaya <khaledgarbaya@gmail.com>
Date:   Sat Apr 8 13:19:24 2017 +0200

    Adding comment about header names (#778)
    
    Header names are lower cased by axios Which make sense since the header names are case insensitive.

commit 88cc84c91e614dfe15528c9fc4c71596a1710697
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Apr 8 12:57:48 2017 +0200

    Adding documentation for response.request

commit 84d9a41850fd194193a9d37eac6e0ee84d5d9f74
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Apr 8 12:47:20 2017 +0200

    Adding code to assign the last request to axios response

commit e5beab045c6bb7092ee264a6d7cabbb9936e05b4
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Apr 8 12:44:41 2017 +0200

    Adding test checking the request in axios response is the last in a redirect

commit 08eb98582e4eb9b4009f35285b231c2c1e8e7faa
Merge: 21b43ed 23c4dfc
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Apr 7 21:26:16 2017 -0700

    Merge pull request #818 from carlosromel/patch-1
    
    Update README.md

commit 21b43edd1daae34b2dd5f2a4492b08c6d96b7a66
Merge: a8dab57 34b63f8
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Apr 7 21:05:52 2017 -0700

    Merge pull request #826 from mzabriskie/github-templates
    
    Adding templates for issues and pull requests

commit 34b63f8ce2745b766f90469113fd625a1fa4d16c
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Apr 8 00:16:52 2017 +0200

    Adding additional instruction line

commit bb57daab1a09fcb661f653c55381ed5a1e494cb2
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Apr 8 00:13:25 2017 +0200

    Adding templates for issues and pull requests

commit 23c4dfcf559be56e9370fe98206c87ef156c661e
Author: Carlos Romel Pereira da Silva <carlos.romel@gmail.com>
Date:   Wed Apr 5 12:56:59 2017 -0300

    Update README.md

commit a8dab5767cf2e9a25b148f977ef566c7cee6a124
Merge: 19b7948 bf2163c
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Apr 3 14:17:30 2017 -0700

    Merge pull request #741 from model3volution/Update/readme
    
    adding sample code to GET images

commit 19b794848047e51f5d8689cf48820c986df49d25
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Mar 31 19:29:37 2017 -0700

    Releasing 0.16.0

commit e6ffc521d296ed47ca49fed8a0f93746a2bc8bb8
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Mar 31 19:25:22 2017 -0700

    Updating Upgrage Guide

commit 8d675bb47a3bddadfc040837154b8725f4e6ae35
Merge: 5b904d5 efc1f11
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Mar 31 18:46:43 2017 -0700

    Merge branch 'master' of github.com:mzabriskie/axios

commit 5b904d5f58aa96e850b39252a62abaeb8582ca2f
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Mar 31 18:46:36 2017 -0700

    Updating changelog

commit efc1f11f7cec729faf75b29221913a41ac381739
Merge: 2fe9562 0104ad6
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sun Mar 26 21:12:57 2017 -0700

    Merge pull request #781 from TomyJaya/TomyJaya-patch-1
    
    Removing extra colon in README.md's proxy.auth

commit 2fe95621b0e4839f489210452ffc6d2cb0f90343
Merge: 5630d3b 8cdfcd0
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sun Mar 26 21:06:24 2017 -0700

    Merge pull request #461 from theikkila/master
    
    Add OPTIONS-method as a shortcut

commit 8cdfcd02849057d901b2140b7d398f34a0e2685e
Author: Teemu Heikkilä <teemu@emblica.fi>
Date:   Sun Mar 26 10:39:53 2017 +0300

    Fix options params, Change the order, Add documentation for instance also

commit 0104ad6c64c6d29cdbd801f923868994d6bf4f0a
Author: Tomy Jaya <tomy.jaya.1990@gmail.com>
Date:   Wed Mar 22 14:11:18 2017 +0800

    Removing extra colon in README.md's proxy.auth

commit 5630d3be55cd591cd279927616f895356a10a361
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Mar 18 12:24:44 2017 -0700

    Fixing IE logo URL

commit 202a890b930fbacd2ca8dcb5dcddf114f1d19963
Merge: 3704d57 d3f6380
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Mar 18 12:19:18 2017 -0700

    Merge pull request #696 from simshanith/formdata-documentation
    
    Updating transformRequest documentation to include FormData

commit 3704d57ed47712e0470586f743a4780dd884c6de
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Mar 14 19:23:05 2017 -0700

    Removing Promise from axios typings in favor of built-in type declarations

commit bf2163c68e26e9c508d6e16ea38545d016473c52
Author: Michael Liendo <model3volution@gmail.com>
Date:   Sun Mar 5 11:52:57 2017 -0600

    adding sample code to GET images

commit fe810b1e3c132fea761378441a9b63916e5a6758
Merge: e411b98 b053f4b
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 22:55:07 2017 -0800

    Merge pull request #654 from k-italy/master
    
    Fixing condition of suppressing DOMException caused by XHR Level 2 Incompatible Browsers

commit b053f4b1b928ff2df9829d63cf7f00a1469613d9
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 22:54:44 2017 -0800

    Fixing typo

commit e411b98c29f0a24554255f16803fd813ece8b091
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 22:49:10 2017 -0800

    Update README.md

commit b1b986ddfec52248e00f2323a444f026903da588
Merge: 6d7e6fa 75a6438
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 22:46:02 2017 -0800

    Merge pull request #671 from 38elements/adapter
    
    Fixing docs for adapters

commit 75a64389ba003ab9e3e1358c2f020ebc79d43329
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 22:43:23 2017 -0800

    Adding link to adapters/README.md

commit 6d7e6fa222a67914f76f6d72588bae8cad14741c
Merge: 2f98d8f f034c56
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 22:38:26 2017 -0800

    Merge pull request #670 from 38elements/test
    
    Updating test for adapter

commit 2f98d8fcdba89ebd4cc0b098ee2f1af4cba69d8d
Merge: 161c616 5df39d8
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 22:04:54 2017 -0800

    Merge pull request #731 from Viktor6713/master
    
    Proper detection of react-native in isStandardBrowserEnv function

commit 5df39d8fa056e7eadf5aaceedb778b2568a4a73c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 21:52:42 2017 -0800

    Check that navigator is defined

commit 161c616211bf5a0b01219ae6aa2b7941192ef2c1
Merge: 4e6b28c 5780e16
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 21:08:23 2017 -0800

    Merge pull request #676 from sloansparger/node-qs-readme-typo
    
    Fixing missing closing paren in node querystring example in README

commit 4e6b28c40bec9680f0b575c5f866649e3bb719a9
Merge: 84b0684 4f07508
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 21:04:45 2017 -0800

    Merge pull request #677 from Gerhut/patch-1
    
    Adding axios-debug-log to ECOSYSTEM.md

commit 4f0750887152c8b5795d17597a071a9362e533b7
Merge: 4545b08 84b0684
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 21:03:55 2017 -0800

    Merge branch 'master' into patch-1

commit 84b068461066a9407695e565b45cc6bfa4a83ba7
Merge: b8f9335 7529be2
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 21:02:07 2017 -0800

    Merge pull request #685 from johnmhenson/fix-typo
    
    Fixing typo

commit b8f9335a971fb23cd317eada7aeb2b1c39e89364
Merge: 609b24b a8a4e0b
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 21:01:01 2017 -0800

    Merge pull request #733 from jacobbuck/ecosystem-axios-method-override
    
    Adding axios-method-override to ECOSYSTEM.md

commit 609b24bf266b10e84766b72fb293e1633261a248
Merge: 36d97e5 4d357d1
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 20:58:16 2017 -0800

    Merge pull request #702 from capaj/patch-1
    
    Clarifying status of cancelable promises proposal

commit 36d97e525d4bd1468131ade87495fdc39d28c56d
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Mar 1 20:40:55 2017 -0800

    Fixing broken test

commit a8a4e0bdcd5a05ab4682567fa8dc584e2d47b191
Author: Jacob <jacobbuck@users.noreply.github.com>
Date:   Mon Feb 27 10:03:25 2017 +1300

    Add axios-method-override to ECOSYSTEM.md

commit 603bd2f66c225b3fa8e3317978d06cccdb1f78cc
Author: Viktor <viktor.nfsc@gmail.com>
Date:   Sat Feb 25 12:14:43 2017 +0100

    added proper detection of react-native in isStandardBrowserEnv function

commit 4d357d15a3bd4552b22cd2ac5d5536013fc42f23
Author: Jiri Spac <capajj@gmail.com>
Date:   Tue Feb 14 08:38:25 2017 +0100

    clarified proposal state

commit d3f63807fefe65738fe6b3b795a30c8574676ef2
Author: Shane Daniel <shane@plethora.com>
Date:   Sat Feb 11 12:45:01 2017 -0800

    Updating transformRequest documentation to include FormData

commit 7529be298c61fa5c806738cde69f3e765a3c6d5d
Author: John Henson <johnmhenson@gmail.com>
Date:   Sun Feb 5 21:22:40 2017 -0500

    Fix typo - forEachMethodNoData
    
    forEachMehtodNoData => forEachMethodNoData

commit 4545b085c51bdc48d0ed2a824592e009dcffa5cc
Author: George Chung <Gerhut@GMail.com>
Date:   Thu Feb 2 14:31:04 2017 +0800

    Add axios-debug-log to ECOSYSTEM.md

commit 5780e16e8a5c67f8b869f698a7170aafa9be2575
Author: Christopher Sparger <sloansparger@gmail.com>
Date:   Wed Feb 1 21:52:23 2017 -0600

    Fixing missing closing paren in node querystring string example in README

commit cb2e356315a57facb4b2ae01c57489c710cc1473
Author: 38elements <mh19820223@gmail.com>
Date:   Mon Jan 30 15:35:41 2017 +0900

    Fixing document for adapter

commit f034c564660ddfbee2bad6d78a212297eb94bfd2
Author: 38elements <mh19820223@gmail.com>
Date:   Mon Jan 30 13:49:50 2017 +0900

    Updating test for adapter

commit 142bce1fb002f8240c4076e0a1b18b0c86489d65
Author: Itaru Kitagawa <itaruxkita@gmail.com>
Date:   Mon Jan 16 14:28:38 2017 +0900

    See config.responseType instead of request.responseType when suprressing DOMException

commit 68ec2abc4a74777f746824b5595d58e07b44c119
Author: Yo'av Moshe <bjesus@gmail.com>
Date:   Wed Jan 11 01:22:51 2017 +0200

    Fixing example in README
    
    It's missing an `)`

commit 253131c31ae1269099efb865eb0469a218e1ab2d
Author: Akshat Garg <coolakshat24@gmail.com>
Date:   Sun Jan 8 19:25:01 2017 +0530

    Update the links of the browser logos in Readme (#616)
    
    Change the links of the logos of different browsers according to the original repository.
    
    Fixes #615

commit 322be107301c5c725b13e3c0c00108e55655f540
Merge: fe7d09b 13bc0e0
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Dec 8 20:01:01 2016 -0700

    Merge pull request #577 from IgorDePaula/master
    
    Fix upload progress event example

commit fe7d09bb08fa1c0e414956b7fc760c80459b0a43
Author: Lochlan Bunn <bunn@lochlan.io>
Date:   Thu Dec 8 15:23:45 2016 +1000

    Fixing combineURLs to support an empty relativeURL (#581)
    
    * Fixing combineURLs to support an empty relativeURL
    
    When combining the base and relative URLs, we should forego force
    appending a slash to the base when the relative URL is empty.
    This leads to a semantic url.
    
    * Fixing combineURLs, allowing single slash relatives

commit 13bc0e032faaca301863a118316dda7be30bc40f
Author: Igor De Paula <principe.borodin@gmail.com>
Date:   Mon Dec 5 14:28:24 2016 -0200

    Fix upload progress event example

commit cfe33d4fd391288158a3d14b9366b17c779b19e3
Merge: 4976816 eaba787
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Nov 28 21:35:50 2016 -0800

    Merge pull request #561 from dominykas/remove-protection-prefix
    
    Removing PROTECTION_PREFIX support

commit eaba7875fceabb9a5a6c84c4848bba8c39eab9f9
Author: Dominykas Blyžė <hello@dominykas.com>
Date:   Mon Nov 28 11:16:55 2016 +0000

    remove PROTECTION_PREFIX support

commit 4976816808c4e81acad2393c429832afeaf9664d
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sun Nov 27 13:52:12 2016 -0800

    Releasing 0.15.3

commit 9ff461ab8a886daf8abf11b6e44d5720168bc9fe
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sun Nov 27 13:50:16 2016 -0800

    Updating changelog

commit 6d0e19343a6180fb8f5c50d843dd15feeb1f49f3
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 26 18:17:21 2016 -0800

    Fixing bug with custom intances and global defaults

commit 5faebabcd8f065e312b5c92081433d6ae1ef8c8f
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Nov 17 22:17:53 2016 -0800

    Update README.md

commit 858e64c9a42ec53eba397a40c4ee16c9a2c88ea4
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Nov 17 22:13:56 2016 -0800

    Update README.md

commit 63ee3573c2132bd3ef090e0214f069bd0bc7ad28
Author: Denis <carriere.denis@gmail.com>
Date:   Thu Nov 10 01:21:56 2016 -0500

    Renaming axios.d.ts to index.d.ts

commit 949d08df71c87cac1754087128eb845be9a6ba2c
Merge: d963368 e167b82
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 5 10:01:26 2016 -0700

    Merge pull request #521 from DjebbZ/patch-1
    
    Adding a note that several requests can cancelled with the same token.

commit e167b82a8681433a98dfa5b6ccdaafb723fa8c5e
Author: Khalid Jebbari <khalid.jebbari@gmail.com>
Date:   Sat Nov 5 17:50:28 2016 +0100

    Add a note that several requests can cancelled with the same token.
    
    I asked the question in #516, pretty sure it will help other people too.

commit d963368960e2e1b3ec6a2eb78ff8fd085e4e229c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Oct 29 22:57:53 2016 -0700

    Adding get, head, and delete to defaults.headers

commit 46a9639ef2597c4be79cde6d5d7d86dc0046d862
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Oct 29 21:58:06 2016 -0700

    Fixing sporadically failing tests

commit 417913bf8b0b8c3530e3df122b4581cd83f0feb5
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Oct 28 21:19:27 2016 -0700

    Fixing issue with btoa and IE

commit f40de498e6af74d9ef45d1321118549f64584764
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 24 21:41:18 2016 -0700

    Adding Edge, Safari, and IE9 back to SauceLabs

commit fd13bad53a3375b296ff1423170b99ed70376f9e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 24 18:24:56 2016 -0700

    Updating deps

commit 3ddeae60e5bf858bee601118641eba60e52da8f2
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 24 18:24:36 2016 -0700

    Getting rid of TypeScript output files

commit df6d3ce6cf10432b7920d8c3ac0efb7254989bc4
Author: Marc Mignonsin <web@sparring-partner.be>
Date:   Wed Oct 19 11:02:42 2016 +0200

    Support proxy auth (#483)
    
    * Adding proxy auth

commit b78f3fe79298a000f056ff40bbd1447c2d667cc5
Merge: b21a280 7c89704
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Oct 18 12:09:51 2016 -0500

    Merge pull request #493 from mgmcdermott/master
    
    Default to using "http:" protocol in http adapter

commit 7c89704262913cebd98f7a27918b92c87c48c9e1
Author: Michael McDermott <michael.mcdermott@adp.com>
Date:   Tue Oct 18 10:59:38 2016 -0400

    Default to using "http:" protocol in http adapter
    
    Fixes #490

commit b21a280df0475c89b8cd0ca7ac698a16eca46ec0
Merge: 3af7560 ce1ecda
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Oct 18 08:59:19 2016 -0500

    Merge pull request #491 from Jarlotee/patch-1
    
    Fix proxy bugs

commit 3af756049f102be2eebafdbb108f10173380a68d
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 17 18:29:32 2016 -0700

    Releasing 0.15.2

commit 25a5e779b66fc56264e8eabdfc7d6b662a45d42a
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 17 18:27:55 2016 -0700

    Updating changelog

commit 3fcf54ff361d4563445e295212c362d5b1e6c518
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 17 18:20:13 2016 -0700

    Fixing issue with calling cancel after response has been received

commit ce1ecdae7a035c144b3726e976c3d1a98caa7bd0
Author: Jared Lotti <Jarlotee@users.noreply.github.com>
Date:   Mon Oct 17 15:24:17 2016 -0400

    forgot to add optional port

commit 5c4ca4ccc4ae33bfa9e06c2fd62f6d23b2fe6b66
Author: Jared Lotti <Jarlotee@users.noreply.github.com>
Date:   Mon Oct 17 15:18:18 2016 -0400

    fix proxy bugs

commit 3f8b128da4ab11e34f0b880381f9395b2ab0e22f
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Oct 14 23:35:21 2016 -0700

    Releasing 0.15.1

commit ffd72e646a6e8a42730502dfff420e3d987203b5
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Oct 14 23:33:31 2016 -0700

    Updating changelog

commit 81e566b905a7da462532be1bdf81b076e33be30e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Oct 14 23:24:59 2016 -0700

    Fixing UMD build

commit e8c5c49ea2f2cf4fd45eaf81270a6d23546e2c93
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 10 21:39:50 2016 -0700

    Releasing 0.15.0

commit 94a335942806a754be11ef754cca84fe976c8baa
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 10 21:38:33 2016 -0700

    Updating changelog

commit 12341d88c08eda84919c07c858a4d3168521613c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 10 18:11:00 2016 -0700

    Temporarily removing Edge from Sauce Labs

commit 2f7be51ae82ff608606d19561f23c3e715410056
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Oct 10 18:04:17 2016 -0700

    Updating README.md

commit 4882ce5359c0ea5238de1cda21fb40a0584f9858
Merge: d982cf9 8f30490
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Oct 10 10:31:44 2016 -0600

    Merge pull request #452 from nickuraltsev/cancel
    
    Adding support for request cancellation

commit 2e0adc1cae76eb214800ce64cfb5d27c032c8556
Author: Teemu Heikkilä <theikkila@L001.local>
Date:   Thu Sep 29 18:54:17 2016 +0300

    Add OPTIONS-method as a shortcut

commit d982cf99324124582721d1cd15a99cb975e93716
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Sep 26 17:50:38 2016 -0700

    Update COOKBOOK.md
    
    Fixes #457

commit 8f304903863800f1efe9d4fd15f7611d1b0d4e15
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Sep 23 16:26:42 2016 -0700

    Attempting to fix Travis build

commit e9fbe959d2b4a44766eec2e871bf00f8cfa0c245
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Sep 23 15:58:25 2016 -0700

    Updating dispatchRequest to use isCancel instead of instanceof

commit 032916e1165895edfa82dd50118f8c2bb16b55e2
Merge: 216e2a6 b718ebf
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Sep 23 15:54:47 2016 -0700

    Merging master

commit b718ebfb2190d9c9899a7a7d19c48af6296d30da
Merge: b8f6f50 b274587
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Sep 21 23:09:51 2016 -0600

    Merge pull request #437 from rubennorte/adapters-in-global-defaults
    
    Moving default adapter to global defaults

commit 216e2a6787fa836d0aeb0b000c2849ba88e2f462
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Sep 21 18:47:37 2016 -0700

    Adding axios.isCancel method

commit 920769d0d74b6f37c64e715051aa7ed1ee50fc74
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Sep 20 19:54:24 2016 -0700

    Improve docs

commit 5efca1ebbc9df85ff88758a9523480eccca531d7
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sun Sep 18 14:16:27 2016 -0700

    Updating docs

commit 2033ef3ad01ae3c83dc0e39adddf682852b17939
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Sep 17 12:49:14 2016 -0700

    Adding TypeScript definitions for cancel tokens

commit 72dd897bb584e2730980f5d211cf783186a2482b
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Sep 17 11:52:56 2016 -0700

    Adding cancellation support

commit df50698d5a9bb03ffd87c6519350bfb2cf3f61ad
Merge: b2bc335 b8f6f50
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Sep 15 21:09:29 2016 -0700

    Merge branch 'master' into cancel

commit b2bc3354ac22e76e129ef8ae5b9656fa555fa061
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Sep 15 21:06:32 2016 -0700

    Adding Cancel and CancelToken classes

commit b8f6f5049cf3da8126a184b6b270316402b5b374
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Mon Sep 12 20:50:41 2016 +0200

    Fixing forEach test

commit 166d68ca1cb8f2604fed4ff60b40a443dc8a12e2
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Sep 12 11:47:47 2016 -0700

    Highlight breaking changes in 0.14.0

commit 436d14b97626728e4ad45c9c9015ab9ec238de1c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Sep 12 11:38:28 2016 -0700

    Fixing issue with responseURL property
    
    `responseURL` is not supported in IE

commit 4c4e648f409de9cddc1b392b7695d5e4864fa561
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Sep 12 11:26:40 2016 -0700

    Replacing Object.hasOwnProperty with Object.prototype.hasOwnProperty

commit de7d02318bd506f621722d5e7514746a319912ea
Merge: 086a855 7241be2
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 12 11:49:22 2016 -0600

    Merge pull request #416 from woodb/changelog-breaking-changes
    
    Added note about breaking changes in v0.13.0

commit 086a855b830b7e2895e5278ef200d08280b48480
Merge: 8554896 977512d
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 12 11:47:47 2016 -0600

    Merge pull request #438 from 3846masa/3846masa/cookiejar
    
    Add @3846masa/axios-cookiejar-support to ECOSYSTEM

commit 85548964a63273d57c74bdaf0806ef25bd8ec570
Merge: 6cc03f0 8813068
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 12 11:44:32 2016 -0600

    Merge pull request #440 from kenvunz/patch-2
    
    Add exception for file protocol request

commit 6cc03f06a7081ca17fe1d83ede308cbfb890226b
Merge: 755a9b3 077153a
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 12 11:43:10 2016 -0600

    Merge pull request #445 from tony-kerz/tk/has-own-prop
    
    [for-each] has-own-prop issue node

commit 077153a0a73cceeba917a985078319b5a8e9be48
Author: Tony L. Kerz <anthony.kerz@gmail.com>
Date:   Sun Sep 11 09:15:22 2016 -0400

    [for-each] has-own-prop issue node

commit 88130689589872cd6f19866680162abb46a39d7a
Author: kenvunz <ken@gladeye.co.nz>
Date:   Thu Sep 8 12:49:11 2016 +0700

    Add exception for file protocol request
    
    Without this patch, it's not possible using `axios` for fetching local content for `cordova/phonegap` applications

commit 977512da64415b31fc49d4b7f85715de7a858d2f
Author: 3846masa <3846masahiro+git@gmail.com>
Date:   Tue Sep 6 14:21:17 2016 +0900

    Updating ECOSYSTEM

commit b2745873a170d8150cb7fbdcfbb4acaad802db57
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sun Jul 10 18:01:40 2016 +0200

    Moving default adapter to global defaults

commit 755a9b345953b1eb08f18ca1bc7c5b54cedf9858
Merge: 0b8c86e 58a734e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Aug 30 09:06:09 2016 -0700

    Merge pull request #431 from andykog/patch-1
    
    README.md: Add missing comma

commit 58a734e652dc52b0c5675df93349979b6d150b35
Author: Andy Kogut <mail@andykog.com>
Date:   Tue Aug 30 18:57:45 2016 +0300

    README.md: Add missing comma

commit 0b8c86e2979557e41beaa1f42ce4504266c9081f
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Aug 29 22:30:43 2016 -0600

    Updating README

commit c96348660dacddd32676924d4f1bde535c45fb77
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Aug 27 11:29:52 2016 -0700

    Releasing 0.14.0

commit 66ec8c0a32c21157456c335100b7e7b05583bc25
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Aug 27 11:26:53 2016 -0700

    Updating Changelog and Upgrade Guide

commit 8bbe4c86b605e185d19778f6042be8f859a46306
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Aug 27 09:37:15 2016 -0700

    Update README.md

commit 20666942d60f92e9d79d8c266972343ca6358e13
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Aug 24 15:48:14 2016 -0700

    Adding proxy to TypeScript definitions

commit 65ffdaefe81c632cf79bf17add0bd64cdd87a653
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Aug 24 15:42:03 2016 -0700

    Fixing build failure

commit 93ae90ae6e1d99cdbae383875bc54977ba6c2769
Author: Hubert Boma Manilla <b4bomsy@gmail.com>
Date:   Wed Aug 24 17:05:26 2016 +0100

    Adding support for http_proxy and https_proxy environment variables

commit 96d7ac2a0c01b625202aad36ff758e69cf717a07
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Aug 23 18:29:25 2016 -0700

    Replacing progress with onUploadProgress and onDownloadProgress in TypeScript definitions

commit 63f41b53aa45f1295c5ad9035b7a7734422e6d7a
Author: Dylan Lundy <dylanjameslundy@gmail.com>
Date:   Tue Aug 23 14:22:59 2016 +0930

    Splitting progress event handlers into upload and download handlers

commit 59080e68d983782445eded3a39f426161611e749
Merge: fa5ce95 0dfd53f
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Aug 18 20:42:03 2016 -0700

    Merge pull request #419 from nickuraltsev/ts
    
    Updating TypeScript definitions

commit 0dfd53f1518e4b3b9dc16acbf3924d09c3a66d58
Merge: 1bd9b19 fa5ce95
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Aug 18 20:34:23 2016 -0700

    Merging master

commit 1bd9b195a55d7c6604aab295ad835e1f35c93fb6
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Aug 18 20:14:13 2016 -0700

    Modifying Gruntfile to install typings before running TypeScript tests

commit 232521623917a9da30cc117d86fba92208bba697
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Aug 18 20:01:54 2016 -0700

    Updating TypeScript definition tests

commit 48549c8de72ad802d265c041ff5aa8f9c6a971dc
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Aug 16 19:03:28 2016 -0700

    Updating TypeScript definitions for axios.all and axios.spread

commit 7241be2160bad7da55f9b06d266c0699ee4b76f6
Author: Brandon Wood <woodb@users.noreply.github.com>
Date:   Tue Aug 16 13:05:52 2016 -0500

    Added note about breaking changes in v0.13.0
    
    Additionally, I moved the breaking changes to the top of the list so that they
    were more obvious.

commit 9a5e77bf6ebef500f3c1cf190bdedcbac62491fd
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Aug 16 10:49:32 2016 -0700

    Adding TypeScript definitions for adapters

commit 0664d9895a7d595599c2834b18d4e572f2686e26
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Aug 16 09:34:23 2016 -0700

    Adding TypeScript definitions for interceptors

commit fa5ce95fdcee5c3a6c0ffac0164f148351ae3081
Merge: 6132d96 1525e87
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Aug 12 22:16:30 2016 -0500

    Merge pull request #407 from axelboc/patch-2
    
    Fixing doc on accessing response with then/catch

commit 6132d9630d641d253f268c8aa2e128aef94ed44f
Merge: 8abe0d4 e861a6c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Aug 12 17:02:59 2016 -0700

    Merge pull request #406 from pracucci/master
    
    Fixing xsrf header on missing xsrfCookieName

commit e861a6cf756d25598c32ee8531a4d8c7e54fbb8d
Author: Marco Pracucci <marco.pracucci@spreaker.com>
Date:   Thu Aug 11 10:47:53 2016 +0200

    Added test to ensure that XHR adapter does not read cookies if xsrfCookieName is null

commit 8f0973c6b92068571ad137d426a288abb962c429
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Aug 9 23:23:08 2016 -0700

    Fixing failing test

commit 5176dfdec52033d73333613b8884aa74a7f0b005
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Aug 9 23:17:11 2016 -0700

    Converting TypeScript definitions to ES2015 module syntax

commit 1525e8771b9d2461cdbdd2e7181a11bb881e3cca
Author: Axel Bocciarelli <axelboc@gmail.com>
Date:   Tue Aug 9 13:24:24 2016 +1000

    Fixing doc on accessing response with then/catch
    
    Docs were suggesting that accessing the response with `catch` was the same as accessing it with `then`. Split the two cases and point to the Handling Errors section. Also mention the case where a rejection callback is specified as second parameter of `then`.

commit 85b90158907ba7fa21a02edb4bb26bfa08bafa61
Author: Marco Pracucci <marco.pracucci@spreaker.com>
Date:   Mon Aug 8 14:31:11 2016 +0200

    Fixing xsrf header on missing xsrfCookieName

commit 8abe0d4007dd6b3fae5a1c4e019587b7a7f50930
Merge: 8332392 1ffcbb0
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Aug 4 09:18:16 2016 -0700

    Merge pull request #397 from madebyherzblut/fix-auth-header
    
    Fixing issue with auth config option and Authorization header

commit 1ffcbb0369cd241077f610600cc6e61e092afba1
Author: Christian Schuhmann <chris@madebyherzblut.com>
Date:   Wed Aug 3 12:16:55 2016 +0200

    Fixing Authorization header with basic auth
    
    The http adapater did not remove a custom Authorization header when auth is set.

commit 8332392bfdf55602d4e0cd120f00d58b381063a4
Merge: 0578445 f504dba
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sun Jul 24 23:15:03 2016 -0700

    Merge pull request #387 from rubennorte/feature/allow-http-and-https-agents
    
    Replace 'agent' option with 'httpAgent' and 'httpsAgent'

commit f504dbaba8aba2843f05a13be7d218f4d7469cbc
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Mon Jul 25 00:07:44 2016 +0200

    Adding documentation for httpAgent and httpsAgent in README

commit 4c790d5a7a7df7a11e094a431a00e64bff65a19f
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Fri Jul 22 21:09:54 2016 +0200

    Replacing 'agent' option with 'httpAgent' and 'httpsAgent'

commit 0578445929019efe370dae56cd6f39647e8a73c1
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Jul 16 11:15:46 2016 -0600

    Moar tests

commit 377efb89aed819ed1cd416b69f057632ad5664a5
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Jul 16 11:13:15 2016 -0600

    Releasing 0.13.1

commit af07c3145b85423b7ecb20234c43f1255c0667b8
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Jul 16 11:12:43 2016 -0600

    Releasing 0.13.1

commit 98d489558e6ac0829d9eb8e6ca3a4d6800fd7a7a
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Jul 16 11:10:58 2016 -0600

    Transform response data on error
    closes #378

commit ff919487e13430098d3da37a37cc04c3f24b59c4
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Jul 13 13:42:23 2016 -0600

    0.13.0

commit 76186e0a75904c5cdfb0978587943b4ad1a627f8
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Jul 13 13:41:30 2016 -0600

    Releasing 0.13.0

commit f51bb27ce8a4cdc6804fcb6eda44d7d73e4de3ff
Merge: 8f3a430 157efd5
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Jul 13 12:58:30 2016 -0600

    Merge pull request #372 from rubennorte/promise-adapters
    
    Changing adapter signature to receive config and return promises

commit 157efd5615890301824e3121cc6c9d2f9b21f94a
Author: Rubén Norte <rubennorte@gmail.com>
Date:   Sat Jul 9 21:30:16 2016 +0200

    Changing adapter signature to receive config and return promises

commit 8f3a4301ab1abb0f6224401dc9bf1810471e1227
Merge: 54f3a5d 235c19c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Jul 8 08:39:10 2016 -0700

    Merge pull request #368 from rubennorte/feature/improve-error-handling
    
    Enhance adapter errors

commit 235c19c876c2d3933bf776b396859053b012a7a5
Author: Rubén Norte <ruben.norte@softonic.com>
Date:   Thu Jul 7 16:01:20 2016 +0200

    Implementing adapter error enhacement

commit 75f9b8c5fd3680e6f2bb704b3062544ccae16817
Author: Rubén Norte <ruben.norte@softonic.com>
Date:   Thu Jul 7 15:59:51 2016 +0200

    Adding failing test for adapter errors

commit 54f3a5dd93b2c83a4c04675b1b59a5189a9646f7
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Jun 28 08:58:18 2016 -0600

    Updating SauceLabs matrix

commit 181f4e78b95522d07917c7a46869d502f451d159
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Jun 27 12:48:09 2016 -0600

    Attempting to fix SauceLabs timeouts

commit 2b45762a9b8f780b16f9202c63a843685dea6248
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Jun 24 21:20:29 2016 -0700

    Update ECOSYSTEM.md

commit 3b0ba3d9359a15f621a74f5d4f9caa27774a78b5
Merge: 1725e08 cdec7d4
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Jun 24 21:19:40 2016 -0700

    Merge pull request #359 from nettofarah/patch-1
    
    Add axios-vcr

commit cdec7d4c6f2d0afe074b8c975b0604e5499f2cfb
Author: Netto Farah <nettofarah@gmail.com>
Date:   Fri Jun 24 18:56:54 2016 -0700

    Add axios-vcr

commit 1725e0808dea179cf820408a45609714c5156850
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 23 16:30:08 2016 -0600

    Fixing broken test

commit 61617543268b024e42996e20ff0435b94a893c5d
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 23 15:42:36 2016 -0600

    Instances created from axios.create have same API as default axios
    closes #217

commit 46eee269da70c33420ff3f8490836674f2a44ceb
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 23 15:19:10 2016 -0600

    Fixing custom instance defaults
    closes #341

commit 10eb23865101f9347570552c04e9d6211376e25e
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 23 15:11:35 2016 -0600

    Move transform response logic from adapters to dispatcher

commit e833a2f7e4a5ec32516e3f17763374c0377a4323
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 23 14:55:22 2016 -0600

    Invoke request transformers after request interceptors
    closes #352

commit f21784ccb8b2a579df58128581d19905a7bb0d95
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 23 14:04:27 2016 -0600

    Removing restriction on withCredentials being overridden
    closes #343

commit 7a12f3660270c16e239e1862b7b65a5140f3ea0f
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 23 13:59:03 2016 -0600

    Only use  if it's a function

commit e97123dc52f6f7fb59a08036c34bf0e3d397196b
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Jun 22 23:33:20 2016 -0700

    Temporarily removing Safari and Edge from Saucelabs

commit 29a1e108719ce1f510149f83bbadd9b0578a5323
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Jun 22 23:27:33 2016 -0700

    Adding sauce_connect.log to .gitignore and .npmignore

commit a59fee5346852e821725af89c0e54693fd3c8172
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Jun 22 23:25:25 2016 -0700

    Updating dev dependencies

commit adc23cb355d8c4b1472b827c570643946d1ded8d
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Jun 14 19:15:46 2016 -0700

    Increasing Karma timeouts

commit a7e4e69f6fb0694a089a358aa2191aa1ed8c6fc0
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Jun 14 15:22:03 2016 -0700

    Update README.md

commit f2c554e4b56719d5fe78c6a6be94a7735971421a
Merge: 120e8f5 6f2186d
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Jun 13 22:26:29 2016 -0600

    Merge pull request #345 from nickuraltsev/errors2
    
    Improve error handling

commit 6f2186d863be5c886e6e78d4c96cba8c9f232541
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Jun 13 18:58:55 2016 -0700

    Modify createError and enhanceError functions to accept response as parameter

commit 91dae3c4ad4f75c16bb077fec0a3914d63730659
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Jun 13 13:56:08 2016 -0700

    Improve error handling

commit 120e8f5557975668ba2bbc2ac78b0dee3998e4e9
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jun 5 07:38:16 2016 -0600

    Updating README

commit 0e2f4f14171ccd161e85478c7b1aba61c3b431a2
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Jun 1 14:42:14 2016 -0600

    Moving Axios class into core/

commit 203cbc2da0ef0f68d517ba2a6176df1d48efc2fb
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Jun 1 13:54:38 2016 -0600

    Moving settle & transformData from helpers/ -> core/

commit eea790b8de15956c04f5c9968e6a7053f8bd6426
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Jun 1 13:16:16 2016 -0600

    Adding README to modules

commit 4d1269cb4a9773db128f459046b6c4c2a0926859
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue May 31 22:22:00 2016 -0700

    Releasing 0.12.0

commit 4873e8187ae59539e9e01b40921fcdfd2c9b8537
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue May 31 22:20:07 2016 -0700

    0.12.0

commit ad260b575ca032bd72f35ebf978ae6d6abdf7f03
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue May 31 18:51:21 2016 -0700

    Updating README.md

commit 5c5a94007c3c1807e0fd3c99457e1603b0d02511
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue May 31 18:29:32 2016 -0700

    Adding test for maxRedirects option

commit 4e7ca3dea349e6076e7f1e70a5fcb7206a4f0cc0
Merge: da62e87 a04077a
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue May 31 17:53:45 2016 -0700

    Resolving conflicts and modifying http adapter to not change status code error range

commit da62e873a5f6a07c857aeec4cae3024077a017c9
Merge: 9c6076b 112f98d
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue May 31 09:37:40 2016 -0600

    Merge branch 'master' of github.com:mzabriskie/axios

commit 9c6076b87beb974006edb35b5452ee3ee4efd08a
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue May 31 09:37:19 2016 -0600

    Updating ECOSYSTEM

commit 112f98dc18affc7e1ddcf5f82177c10f094a8f11
Merge: c311466 2b8d89a
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue May 24 20:40:25 2016 -0600

    Merge pull request #317 from nickuraltsev/urlsearchparams
    
    Adding support for URLSearchParams

commit c311466a2c1ad9afa1bced687db44d8aa3bd4ffd
Merge: 05a522f 600653e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed May 18 19:56:20 2016 -0700

    Merge pull request #327 from mzabriskie/pr/303
    
    Fixing handling of compression errors

commit 600653e293e94bcc039f0fb29cde55826407d755
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed May 18 19:47:12 2016 -0700

    Adding test for compression error handling

commit 94a2128549ed2e2bd5d36378d8b9a203e6552cc3
Merge: 716e487 05a522f
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed May 18 19:44:21 2016 -0700

    Resolving merge conflicts

commit 2b8d89a65e0d3de0bcc643af35bae593a98eaf13
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed May 18 18:47:34 2016 -0700

    Modifying isURLSearchParams function to use instanceof instead of duck typing

commit 05a522fc123f8e9f5b1424c35f42bbfa9ec95307
Merge: 0d9996b 9a18c39
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue May 17 15:16:04 2016 -0600

    Merge pull request #326 from josh-egan/patch-1
    
    Update README with request method on static api

commit 9a18c393cb70c338d34f782c3f595e778e2f22d8
Author: Joshua Egan <josh-egan@users.noreply.github.com>
Date:   Tue May 17 15:07:49 2016 -0600

    Update README with request method on static api

commit 0d9996b1a0cd4396c774fa052ff73cc9116054ec
Author: Joshua Egan <josh-egan@users.noreply.github.com>
Date:   Tue May 17 14:54:34 2016 -0600

    Adding request function to exported singleton
    
    #316

commit 2e949495f0177bd4f4faab8ce031aa32bef50f47
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue May 17 09:59:06 2016 -0600

    0.11.1

commit f5a990a1f1887009698b09b68d1e7300ad3a86a5
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue May 17 09:57:50 2016 -0600

    Releasing 0.11.1

commit a8a55876bf39c41aa3f2fa02396e741f20913b28
Merge: f1d6b3c 5a20ede
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue May 17 09:48:08 2016 -0600

    Merge pull request #321 from reggi/patch-1
    
    export Axios fixes #320

commit f1d6b3cf346e6abf249f00f787b75b9df7df139c
Merge: 580ef52 b1e6e75
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue May 17 07:38:13 2016 -0600

    Merge pull request #325 from kimrgrey/issue#323
    
    Used instanceof to determine FormData in utils.isFormData. Fix #323.

commit b1e6e753fff37c56b0241307a0a76191469f5c2c
Author: Sergey Tsvetkov <sergey.a.tsvetkov@gmail.com>
Date:   Tue May 17 15:52:15 2016 +0300

    Used instanceof to determine FormData in utils.isFormData. Fix #323.

commit 5a20edeb0c6d175c22b3baf77d86bcda032cf3cf
Author: Thomas Reggi <socialtr@gmail.com>
Date:   Fri May 13 15:37:05 2016 -0400

    added semicolon

commit 7548f2f79d20031cd89ea7c2c83f6b3a9c2b1da4
Author: Thomas Reggi <socialtr@gmail.com>
Date:   Fri May 13 15:28:58 2016 -0400

    export Axios fixes #320

commit f20490eb6b7d37478bd9906649ce085e0a269c6c
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat May 7 12:26:28 2016 -0700

    Adding support for URLSearchParams

commit 580ef523d5ac20e4b6357183593a83bd3f4f7dc6
Merge: ea37522 f32b5a6
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue May 3 22:40:39 2016 -0700

    Merge pull request #313 from icracked/master
    
    Only set empty handlers for IE CORS support if using XDomainRequest

commit f32b5a6ce4778aa94fd270f409eee0482e44c4c9
Author: stevenp <steven.peterson@gmail.com>
Date:   Wed May 4 00:24:18 2016 -0500

    Only set empty handlers for IE CORS support if using XDomainRequest

commit ea375220a26fc8b0ec837e7526e678cd737eabda
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon May 2 22:04:03 2016 -0700

    Excluding .md files from npm package

commit 371c31a463c5de16167abb7df6aea52432325d12
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Apr 28 11:58:53 2016 -0600

    Updating README

commit 82d34ac743022aaf0c4e68650b39d2f7edab73a4
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Apr 26 21:13:02 2016 -0700

    Releasing 0.11.0

commit 4b150f26dffaec6e663662ae8038aef16792171e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Apr 26 20:42:06 2016 -0700

    0.11.0

commit aeac3e132ee3de1eca15af9bd964face570e729c
Merge: fa9444e 4d83ba9
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Apr 26 14:25:19 2016 -0600

    Merge pull request #299 from nickuraltsev/array-buffer-fix
    
    Fixing issue with ArrayBuffer

commit fa9444e0babdbf87cc6e04eb72da420c0f2ffbc5
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Apr 26 13:18:58 2016 -0700

    Allow custom HTTP status code error ranges (#308)
    
    Adding support for custom HTTP status code error ranges

commit a04077a17db282c476c348e67994a95db2d015f6
Author: dublx <luis.faustino@gmail.com>
Date:   Fri Apr 22 15:47:16 2016 +0100

    Choose between follow-redirects or core

commit 093593cbcafa0d829e3d84e363bc76c0c961996e
Merge: 2ebdd2d d88bc12
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Apr 21 10:43:54 2016 -0600

    Merge pull request #296 from nickuraltsev/stream
    
    Adding support for Stream with HTTP adapter

commit 2ebdd2de205e53f96511874da9b693c87f9d841c
Merge: 2797f10 256f87e
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 20 23:05:44 2016 -0600

    Merge pull request #280 from nickuraltsev/ecosystem
    
    Adding ECOSYSTEM.md and Resources section

commit 2797f10ea5d2cd963a8e5c80da319848bad9f499
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 20 22:51:55 2016 -0600

    0.10.0

commit f569894ebc84171704b388047b8a3ce2f8c0cbfd
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 20 22:51:24 2016 -0600

    Releasing 0.10.0

commit 6554493bdd3225ff87a26aa548dc562978f6d596
Merge: 7cf19f6 8a60a4e
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 20 22:28:10 2016 -0600

    Merge branch 'master' of github.com:mzabriskie/axios

commit 7cf19f64c4143603bf1482d08905048f95eb7849
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 20 22:28:01 2016 -0600

    Reverting #234

commit 716e487038fca364648f61c6c432063f1d2c41c0
Author: Josh <josh@kaze.co.za>
Date:   Wed Apr 20 01:26:45 2016 +0200

    Fixing handling of compression errors

commit 8a60a4eb8b0e12993875a944e3db6f75c1318975
Merge: 5c58b83 0ec09f7
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Apr 18 13:09:05 2016 -0700

    Merge pull request #300 from jergason/patch-1
    
    Fixing typo in readme

commit 0ec09f7be9bc0797e62d5e11664caf09c9228b5a
Author: Jamison Dance <hi@jamison.dance>
Date:   Mon Apr 18 14:04:03 2016 -0600

    Fix typo in readme

commit 4d83ba91f5d4f2bf10a60961c0c6ad6d7202c567
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Apr 18 11:22:11 2016 -0700

    Fix issue with ArrayBuffer

commit d88bc12e59ecfb8c2e1e77f7ecb545154575e389
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Apr 14 21:04:22 2016 -0700

    Update README.md

commit d23f9d5d4782e5849362895f8b648ed587999706
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Apr 14 17:38:35 2016 -0700

    Add support for Stream

commit 5c58b831cc9090a6ca499f9d86305c915ce08448
Merge: 4de17bc 9d22e9a
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Wed Apr 13 10:08:42 2016 -0700

    Merge pull request #294 from jackytck/cookbook-patch
    
    Fixing typo

commit 9d22e9a9bb820b60902854c67a172dde2a6f6991
Author: Jacky Tang <jackytck@gmail.com>
Date:   Thu Apr 14 00:13:16 2016 +0800

    Fixing typo

commit 9e7b1b59933cb5777152252b80b9fd5c0403d178
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Apr 12 19:49:12 2016 -0700

    Add isFunction and isStream helpers

commit 4de17bca095345854a1a39a60af8d85f55961900
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Apr 8 16:41:51 2016 -0700

    Fix request path for proxied requests

commit 775ca3e732935f2c562a232e4c64ad8fbc491647
Author: msangui <msangui@gmail.com>
Date:   Mon Oct 26 13:10:27 2015 -0300

    Added proxy option to http.js

commit 6bb376d9f1ae456df47e1b6babdf7f6174e03130
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Apr 7 14:24:32 2016 -0600

    Updating CONTRIBUTING

commit df29a221c25de23d3b9acdb20fe1e698ec575068
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Apr 7 14:21:31 2016 -0600

    Updating CONTRIBUTIN

commit f269a702fef49e8cb6224aeb447a97316e20bca2
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Apr 7 14:13:03 2016 -0600

    Automating release process

commit a913ea56c153d6ec6a70b523e683fe7ffa724476
Merge: 7c039e8 ab361ac
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Mar 31 20:08:58 2016 -0700

    Merge pull request #200 from AurelioDeRosa/patch-1
    
    Expose XHR instance

commit 256f87e9542ec841693a0af3e260527790a39530
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Mar 31 13:04:30 2016 -0700

    Add Resources section to README.md

commit 7331c2b09930ec9e6b86b91b60e5f6ef98f3c25a
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Mar 31 12:51:35 2016 -0700

    Add ECOSYSTEM.md

commit 7c039e89945c67c8ed036847c1b01556a95bb84c
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 30 11:43:37 2016 -0600

    Adding Gitter badge

commit 34dbdff84613346e6948d2ab316dc84ef1208482
Merge: 92e15fa 8972ea5
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Mar 28 22:09:50 2016 -0600

    Merge pull request #279 from Deamon87/patch-1
    
    Fixing xhr for webworker env

commit 8972ea52086d2f4db20591f59904a40240498123
Author: Deamon87 <dmitolm@gmail.com>
Date:   Tue Mar 29 03:09:15 2016 +0300

    Fixing xhr.js for WebWorker env
    
    More fixes.

commit aaca1244eb2d1229cb093acc16fb9a3c06f16d42
Author: Deamon87 <dmitolm@gmail.com>
Date:   Tue Mar 29 02:43:51 2016 +0300

    Fix xhr for webworker env
    
    Fix xhr for webworker env

commit 92e15fa0d1847210ae04017c078c9248c29b82fe
Merge: 8dab9d1 21cf932
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 26 11:10:47 2016 -0600

    Merge pull request #275 from bomsy/maxcontentlength
    
    Adding a `maxContentLength` content option

commit 8dab9d1e7e69b76db4b8216f390a0cd207f75d52
Merge: 104276f d166954
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 26 11:09:12 2016 -0600

    Merge pull request #271 from nickuraltsev/peer-dep
    
    Fixing issues with peer deps

commit 21cf932d0f18ed4092d377394aed7791630697bf
Merge: fefa23a 57a1ed4
Author: bomsy <b4bomsy@gmail.com>
Date:   Fri Mar 25 23:53:32 2016 +0000

    Merge branch 'maxcontentlength' of https://github.com/bomsy/axios into maxcontentlength

commit fefa23a8dd0a3d860c2bcda7b4c9edf5d0e39929
Author: bomsy <b4bomsy@gmail.com>
Date:   Tue Mar 22 18:28:51 2016 +0000

    Adding config option to restrict based on the size of the response co…

commit 104276ffa774760d0b00cb1312621d5b1993e483
Merge: e22cbae c622b35
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 24 00:02:45 2016 -0600

    Merge pull request #274 from nickuraltsev/travis-fix
    
    Fixing issue with Travis

commit c622b35f38c3072c3aeb5e51f3a2116e67286e0e
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Mar 22 23:46:36 2016 -0700

    Updating configuration to use Firefox for testing PRs

commit 57a1ed46dac67118b154f3a615a91e11aad9e07c
Author: bomsy <b4bomsy@gmail.com>
Date:   Tue Mar 22 18:28:51 2016 +0000

    Adding config option to restrict based on the size of the response co…

commit 4f61a78436581be42efdd1d1f2b2786c1b33b2bb
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Mar 21 23:35:15 2016 -0700

    Fixing issue with Travis

commit d166954dc1bac199f27a485029458ddc9afa92c6
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Mon Mar 21 17:48:46 2016 -0700

    Fixing issues with peer deps

commit e22cbae49447f1c88680cc3d97888b6949f6a41f
Merge: 2306657 ff5cd29
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 15 13:01:00 2016 -0600

    Merge pull request #267 from rupertrutland/patch-1
    
    Fix typo in readme

commit ff5cd292e339cb997a2c8fa6958b915a9eaecb28
Author: rupertrutland <rupertrutland@gmail.com>
Date:   Tue Mar 15 19:46:45 2016 +0100

    Fix typo in readme

commit 230665748239c95e60a83b5285e0ab43ef74fb1b
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 9 18:55:38 2016 -0700

    Adding Edge to supported browsers

commit 4d2f9c21d48f8370a16af9e0b890cd0ce137b158
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 9 16:17:10 2016 -0700

    Gettings tests passing for IE9

commit dcbb35226245483930a1f2969927a3b348bb2558
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Mar 7 13:21:27 2016 -0700

    Moving test helpers and auto-loading them

commit 0da38da92154684d368e5ecbb6b6e60dbb5d8136
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Mar 7 10:50:46 2016 -0700

    A bit of code cleanup

commit ab361ac169bc39524e2b5d9fa1be64a93fef0546
Author: Aurelio De Rosa <a.derosa@audero.it>
Date:   Fri Jan 22 00:52:18 2016 +0000

    Expose XHR instance
    
    Fixes gh-64

commit 701d66d9d01e59b5a1f0e0fbe32e305339d0e455
Merge: 84755d1 5fc59a6
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 5 23:56:39 2016 -0700

    Merge branch 'barbedt-master'

commit 5fc59a65aa9df399c19f756a0020b132e7e2dcb2
Merge: 84755d1 261e416
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 5 23:56:02 2016 -0700

    Resolving merge conflicts

commit 84755d1325c228553883a89a5d6e348dcb67e305
Merge: 3c25942 1696d1c
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 5 23:40:13 2016 -0700

    Merge pull request #251 from ruchigoyal2005/master
    
    IE9 fix for cross domain calls

commit 3c2594292ac67c53aae403818e4e728c946b8b78
Merge: 955d5a0 ca06170
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 5 23:35:10 2016 -0700

    Merge pull request #249 from ctimmerm/ie8-onreadystatechange
    
    Fixing IE8 support by bringing back onreadystatechange

commit 955d5a02e4c72310ac82a26421c3d2bffbaae067
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 5 23:29:29 2016 -0700

    Run ALL the tests 😸

commit 11ca70cfb6e5370310efe4099ab18582452374a2
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 5 23:25:13 2016 -0700

    Updating dependencies

commit dc07ef2559fff614fb8df04114a78555c7eea51a
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 5 23:17:39 2016 -0700

    Fixing tests for IE

commit 6d84717cbaaa905a19cf8fee6e65c3bf7977c860
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Mar 5 23:15:53 2016 -0700

    Updating dependencies

commit 7462c49a139be51f543f774dc8a9a4044110077b
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 10:41:42 2016 -0700

    Updating README

commit ab2fba805e5377d0208848101ba05e603a331f18
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 10:39:11 2016 -0700

    Updating README

commit 371b82a2a07d8a2a9669f687618aa6119d7a32e1
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 10:35:05 2016 -0700

    Cleaning up tests a bit

commit c181d8ade9a402fb85c6c7202ee06e5e39dac151
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 01:23:51 2016 -0700

    Removing IOS and Android from Saucelabs

commit 529d89f4fc2cacc523dfaedb18c42db269f48326
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 01:10:20 2016 -0700

    Trying to fix capture timeout by increasing time limit

commit 425d93502bd79c9afd67f4ed18fd865cf0b306da
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 00:56:29 2016 -0700

    Adding IOS and Android to Saucelabs

commit 34222f27e4020ad5bd59e23ee8aa87e5f1899f1e
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 00:33:08 2016 -0700

    Adding IE and Edge to Saucelabs

commit 425aefec9f8a94e4e8c9106f947b52ee2a8c609c
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 00:31:58 2016 -0700

    Adding Saucelabs browser matrix to README

commit 68a6eb8522612f66b63c08f77d9f2323282e6986
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 00:27:33 2016 -0700

    Adding Safari to saucelabs

commit ea673057aa9256e269e3b84869556da1a9329713
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 4 00:20:58 2016 -0700

    Trying to get a green run on saucelabs

commit 03f291177d0c43e9ff71bf9f6ae67f6bc43506e0
Merge: b17e109 32080df
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 3 23:35:43 2016 -0700

    Merge branch 'master' of github.com:mzabriskie/axios

commit b17e109eeaf8782a015ff65fea468e3c5662fd05
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 3 23:35:33 2016 -0700

    Hooking things up to saucelabs
    closes #180

commit 6f32ca772b49d58ad00131e37eb612c637ddd234
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 3 23:34:38 2016 -0700

    Increasing timeout so test doesn't fail in Safari

commit 62ad1f2b0bc3b32697f55e5829af0c7d774cb541
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 3 23:16:42 2016 -0700

    Making validation of invalid character error less strict

commit e7aa98f9f599581ed012ba77685f0619cc87557c
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 3 22:44:16 2016 -0700

    Improving tests in anticipation for saucelabs support

commit e2fbc68960ece3301d8f31fb0b45c1831f9a121f
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 3 22:43:38 2016 -0700

    Removing console.log

commit 70417759433e0293f2ffe5ca1e0278945b104ae0
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 3 22:43:16 2016 -0700

    Changing btoa ponyfill to improve testing

commit 32080df31b9e93ecfbfe9b4faf58ceec06212ce3
Merge: 6d3d266 ed4a4dc
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 2 18:17:51 2016 -0700

    Merge pull request #227 from rogeriochaves/master
    
    Handle timeout on XHR requests

commit 6d3d266616e9003b0367302ed372e9b486582f26
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 2 13:41:14 2016 -0700

    Adding code of conduct and collaborator guide

commit 8d51b68bc4f8423b9ad2198e3abf0bd2ad2a6229
Merge: a383bd5 116f5fc
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 2 12:31:09 2016 -0700

    Merge pull request #252 from ajcrites/basic-auth-245
    
    Fixing 245: Basic auth for node http adapter

commit a383bd5cf4a5f2d3a4acc54bce7911416dbb5578
Merge: e23f765 1c32e2a
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 2 12:28:06 2016 -0700

    Merge pull request #250 from staticinstance/staticinstance-patch-248
    
    patch for issue 248 (send null instead of undefined)

commit e23f765cdcc90ad2a526cfa7588c1d3952e8a946
Merge: dbd2c11 53ddefe
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 2 11:54:11 2016 -0700

    Merge pull request #254 from ericmdantas/tsc-import
    
    doc(readme): uses latest syntax for Typescript import

commit ed4a4dc9a930c517b86bced08ed63393dcdfa8cc
Author: Rogério Chaves <rogeriocfj@gmail.com>
Date:   Wed Mar 2 15:16:01 2016 -0300

    Uses the same timeout error message on XHR adapter than HTTP adapter

commit 53ddefe8adb9624e3a71e8643fd1c8d81a4331b6
Author: Eric Mendes Dantas <ericdantas0@gmail.com>
Date:   Tue Mar 1 07:54:11 2016 -0300

    doc(readme): uses latest syntax for Typescript import

commit 1696d1ca5501314a3dcf97b7ceb761de23861d46
Author: goyalr <ruchi.goyal@dowjones.com>
Date:   Mon Feb 29 15:48:12 2016 -0500

    IE9 fix for cors api calls are timing out prematurely

commit 29f5b9b66d2bd7fefa05b4b3dc035bae1e2b5b0d
Author: goyalr <ruchi.goyal@dowjones.com>
Date:   Fri Feb 26 13:03:59 2016 -0500

    Fixed axios promise rejection for cors api calls in IE9

commit 116f5fca886b5fd9733c1d1548c5f76e220efb21
Author: Andrew Crites <ajcrites@gmail.com>
Date:   Sun Feb 28 22:51:20 2016 -0500

    Fixing 245:
    
    Formatting and adding tests

commit 76cb7eeba9c14fec8069eca097bea3cfd21891e2
Author: Andrew Crites <ajcrites@gmail.com>
Date:   Sun Feb 28 22:42:02 2016 -0500

    Fixing 245:
    
    Parse basic auth from URL and submit with http adapter

commit 1c32e2ab8d0e65bdb9de40b945497f14f9c4de2f
Author: Michael Bradley <mbradleyis@gmail.com>
Date:   Fri Feb 26 13:34:20 2016 -0800

    remove trailing spaces

commit 68a45b5e3e6c063018763774e43e7895b3000b07
Author: Michael Bradley <staticinstance@users.noreply.github.com>
Date:   Fri Feb 26 08:59:40 2016 -0800

    use multi line ternary operator
    
    https://github.com/felixge/node-style-guide#use-multi-line-ternary-operator

commit a63e7cd8ca20b613db4a4b11b664ad67ecc997c2
Author: Michael Bradley <staticinstance@users.noreply.github.com>
Date:   Fri Feb 26 08:55:54 2016 -0800

    Fix for https://github.com/mzabriskie/axios/issues/248
    
    undefined is not valid JSON, make the value null instead.
    
    JSON.parse(undefined) will throw an exception while JSON.parse(null) is acceptable.
    
    http://stackoverflow.com/a/14946821/5012948

commit dbd2c11454c07c5040895e4cbfafad0a83095ab7
Merge: 1d782c7 ddc9658
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Feb 25 09:12:55 2016 -0700

    Merge pull request #234 from samueleaton/master
    
    switches check order of xhr/http for electron

commit ca0617061e77f8fca502cacd0cced92242b3712e
Author: Colin Timmermans <colintimmermans@gmail.com>
Date:   Thu Feb 25 10:53:12 2016 +0100

    Fixing IE8 support by bringing back onreadystatechange
    
    Fixes #241

commit 1d782c7baf439f775a512db40b61d24a64fdf4de
Merge: a763c3d ca12c05
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Feb 24 14:43:59 2016 -0700

    Merge pull request #221 from 1000ch/fix-typo
    
    Fix typo

commit a763c3d28a6bade9932a656afa7c895ff58ca8b6
Merge: 235f343 5602a32
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Feb 19 09:22:10 2016 -0700

    Merge pull request #235 from incrediblesound/patch-1
    
    Small grammar fix in UPGRADE_GUIDE.md

commit 5602a32586d72b3a2a994a9209f28db916cb1640
Author: James H Edwards <james.howe.edwards@gmail.com>
Date:   Tue Feb 16 09:16:45 2016 -0800

    Update UPGRADE_GUIDE.md
    
    removed superfluous 'the'
    
    original line "...the polyfill has been removed, and you will need to supply the it yourself if your environment needs it."
    new line      "...the polyfill has been removed, and you will need to supply it yourself if your environment needs it."
    
    Nothin else has been changed.

commit ddc965831c373c8c38baf7fc3e8b1c6ce85ea904
Author: samueleaton <sameaton11@gmail.com>
Date:   Mon Feb 15 22:38:56 2016 -0700

    switches check order of xhr/http for electron

commit 893c061dd60feb6daf31ab18dc0675ca39752c29
Author: Rogério Chaves <rogeriocfj@gmail.com>
Date:   Fri Feb 5 16:26:58 2016 -0200

    Handle timeout on XHR requests

commit ca12c058824c480dda7a65ca5aceb395287ca095
Author: 1000ch <shogo.sensui@gmail.com>
Date:   Tue Feb 2 21:09:25 2016 +0900

    fix typo

commit 235f34312ca2aa09e8e3830dd05242fc99169383
Merge: e26055a 8cce065
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 29 03:15:21 2016 -0700

    Merge pull request #216 from kvzivn/patch-1
    
    Update README.md

commit 8cce065414473fe0bf4ffb2da84517e00e854826
Author: Kevin Ivan <info@kevinivan.com>
Date:   Fri Jan 29 09:32:50 2016 +0100

    Update README.md
    
    Everyone can not clone from there.

commit e26055a63bbd583021fbf1f383523cea0f8ebf36
Merge: 70ef49e 02a1f2d
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Jan 25 10:06:21 2016 -0700

    Merge pull request #212 from marcelometal/patch-1
    
    Fixed typo in README.md

commit 02a1f2d9a03edbf0a2546bb584ad61213ad465bb
Author: Marcelo Jorge Vieira <metal@alucinados.com>
Date:   Mon Jan 25 14:55:06 2016 -0200

    Fixed typo in README.md
    
    Replaced 'instace' with 'instance'

commit 70ef49eeb93b7cdc0e3579a263268ffd64cfa108
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jan 24 15:27:30 2016 -0700

    Bit of code cleanup

commit 5176623d6c70e9d66c17f7867703a8e9990554bd
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jan 24 15:18:24 2016 -0700

    Releasing 0.9.1

commit 3edcfa25b7cda1319e03356a30ceea1b6f9402e7
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jan 24 15:03:11 2016 -0700

    Updating README

commit 7a16f72895754fda7e80635d5c160357f4a7aaed
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 22 16:27:54 2016 -0700

    Improving logic for handling timeout in node
    closes #124

commit d31ebc4c508a53facc62da00383a7e88082830c4
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 22 14:40:44 2016 -0700

    Normalize response status for HTTP 204 in MSIE

commit c73389e69d5dafddd7dddd43a3c1958c4b0190ec
Merge: bee0b28 1f2d790
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 22 14:00:09 2016 -0700

    Merge pull request #202 from savantaparna/master
    
    Fixing #201 by treating status code 1223 as a success code.

commit bee0b28fdeaa48971d99e3f652ca4ee0a0c3b330
Merge: a473744 252876c
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 22 09:57:46 2016 -0700

    Merge pull request #205 from latentflip/fix-204
    
    Fixing reject not being called on xhr network errors.

commit 252876c2c0a1976861497a0c315a929a710094ff
Author: Philip Roberts <phil@latentflip.com>
Date:   Fri Jan 22 16:39:41 2016 +0000

    Fixing reject not being called on xhr network errors.
    
    Fixes #204

commit 1f2d79038c6ef1ca7904ee41ffe27a3b3a629711
Author: savantaparna <tibco@pdxudev01.devtst.go2uti.com>
Date:   Thu Jan 21 17:46:13 2016 -0800

    Fixing #201 by treating status code 1223 as a success code.

commit a473744e050ebfd0ae785ba16fbd7a5bd264a93d
Merge: 7ec97dd f44d9ce
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Jan 19 08:32:08 2016 -0700

    Merge pull request #198 from gschambers/redirect-hostname
    
    Fixes redirect behavior to correctly set host
    /port

commit f44d9ce67725234b2afbe10ee4a1a39402e7b8ef
Author: Gary Chambers <mail@garychambers.me.uk>
Date:   Tue Jan 19 14:51:14 2016 +0000

    Fixing redirect behaviour

commit 7ec97dd26b3af7bb0995eef178c4edd8989c3152
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Jan 18 11:18:39 2016 -0700

    Releasing 0.9.0

commit 6f13a7591ba7c4e2cdfa7ea282c7488df24144ec
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Jan 18 11:04:10 2016 -0700

    Only strip Content-Type header if data is undefined

commit dea613ae4bbea3ca8cf0fc79cd640e3e90162820
Merge: 20e724a 71aadd6
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jan 17 22:07:56 2016 -0700

    Merge pull request #195 from vandosant/master
    
    Fixing #184 Content type removed if data is false

commit 71aadd604db0fa706911f6e506a9973750a5d3d4
Author: vandosant <sjskender@gmail.com>
Date:   Sun Jan 17 21:25:21 2016 -0700

    Fixing #184 Content type removed if data is false

commit 20e724af80c82efced7cd67d451e44c850496f90
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jan 17 17:10:57 2016 -0700

    Adding failing test for #184

commit 5ac6e8de48cf99b4c06a7a7baf31ca073a4d94b2
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jan 17 16:02:49 2016 -0700

    Updating dev dependencies

commit b9bb6ae7aacc7ec6053ae0551be7a403a33a5b18
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jan 17 15:29:10 2016 -0700

    Adding support for custom adapters

commit be241d55df5cae4c8de75b04b32a06823cfd3d20
Merge: 6265b54 ef6bfe8
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jan 17 14:35:46 2016 -0700

    Merge pull request #185 from jtangelder/improve-ie
    
    Improve XDomainRequest implementation

commit ef6bfe8cb2d22e691a7f1d3dcd9dc0e1039b9b23
Author: Jorik Tangelder <j.tangelder@gmail.com>
Date:   Sun Jan 3 12:17:43 2016 +0100

    fix linting errors

commit 85a3f7ba829d25aa56bc8bc9b425ebb7871c9e29
Author: Jorik Tangelder <j.tangelder@gmail.com>
Date:   Sun Jan 3 12:08:51 2016 +0100

    Add manual tests
    
    This would help testing browser support.

commit 986647be59259125750fd44dbb429658d67dc156
Author: Jorik Tangelder <j.tangelder@gmail.com>
Date:   Sun Jan 3 12:08:09 2016 +0100

    improve IE support
    
    removes ActiveXObject support, and improves detection of XDomainRequest.

commit 8425fbe5563f6da0ac0e3bef4215283e870c350f
Merge: 84027a3 6265b54
Author: Jorik Tangelder <j.tangelder@gmail.com>
Date:   Sun Jan 3 11:09:31 2016 +0100

    Merge remote-tracking branch 'refs/remotes/mzabriskie/master'

commit 6265b5440953930c8788a090f2e49b84272b0569
Merge: cdedbf0 82847f7
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Dec 24 12:39:50 2015 -0700

    Merge pull request #183 from mzabriskie/refactor-config
    
    Fixing config weirdness

commit 82847f737ef9d468493720b8bc3664fb0ddc7757
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Dec 24 11:44:46 2015 -0700

    Fixing config weirdness

commit cdedbf0bb1a0cfaf11f6c7f714a8df5718523f16
Merge: 9a5dec2 0545573
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Dec 24 09:46:26 2015 -0700

    Merge pull request #182 from anthwinter/master
    
    Only use XDomainRequest <= IE 9

commit 0545573798fe9c036bcf8da0a83c4d16c3252b1e
Author: Anth Winter <anthwinter@gmail.com>
Date:   Thu Dec 24 12:05:55 2015 +0000

    Added condition to check for IE version before using XDomainRequest

commit ff4b5edcbf29990361725e65adf33662e82959aa
Author: Anth Winter <anthwinter@gmail.com>
Date:   Thu Dec 24 12:03:51 2015 +0000

    Added IE version check helper function

commit 9a5dec2dc5aef6eaa0bc4f72f714656bcf29dac3
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 20:43:32 2015 -0700

    Releasing 0.8.1

commit f28a4a82487ff00ffd738f730c4e2d84eb44aaa0
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 20:06:57 2015 -0700

    Using more strict eslint rules

commit 2b147fb0b7d3f941534f1dfa0269722038fa10ec
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 20:06:16 2015 -0700

    Moving bind into it's own file

commit d127adfe00c319c6e292463c0787d8513aff1106
Merge: 7140230 0e4b339
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 14:55:30 2015 -0700

    Merge pull request #174 from aukevanleeuwen/fix-for-issue-171
    
    Fixing #171, don't fail on error responses with json payloads

commit 0e4b3399c10cbec6c3201e01b8afae6cb1e85c6c
Author: Auke van Leeuwen <auke.van.leeuwen@finalist.nl>
Date:   Mon Dec 14 22:14:22 2015 +0100

    Fixing #171, don't fail on error responses with json payloads

commit 714023082fa91d4e04b0fb79de4520e84c23be33
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 13:00:45 2015 -0700

    Removing TODO

commit c1810838c84348ba53653b5bccb1b7bce217908e
Merge: 4d40883 fd2339c
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 12:59:30 2015 -0700

    Merge pull request #173 from ryoia/master
    
    got rid of the colon after Basic, test passed

commit fd2339cf5cbc71f61cd8459d220c5a4c698e87fd
Author: Julia Gao <juliagao2005@gmail.com>
Date:   Mon Dec 14 12:37:19 2015 -0700

    got rid of the colon after Basic, test passed

commit 4d408837c17636071bd60aa37aa750d418e31cb9
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 12:19:25 2015 -0700

    Adding failing test for #169

commit 9ede644b98b03a29c66dfd5d90ab3d6a6f64ef5c
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 12:16:57 2015 -0700

    Better tests for btoa

commit 77b8966b479a150f920cecca2b2a26584bb6430a
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 12:16:11 2015 -0700

    Making btoa polyfill more standard

commit c5665674208e8056c82df0e729eaf652a02df7ac
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 14 12:15:53 2015 -0700

    Better import statement

commit f9c46c5c1da731c150febd347708f229e9bc74ab
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 11 13:52:23 2015 -0700

    Adding tests for interceptors on custom instances

commit 4ffeba3cdee37ecc26713c98661de4d4c0caeffc
Merge: dc1524a 415ff77
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 11 13:23:03 2015 -0700

    Merge pull request #168 from samjulien/master
    
    Adding check for withCredentials in XHR adapter (#138)

commit 415ff773cc01cd52a9eeafc2c9c28cc0d94f8db3
Author: Sam Julien <Sam.Julien@energytrust.org>
Date:   Fri Dec 11 12:16:57 2015 -0800

    Add check for withCredentials in XHR adapter (#138)

commit dc1524abf7bc8358aca4db1c5c53007b8ecb6734
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 11 13:02:39 2015 -0700

    Adding failing test for #138

commit 085f95f9ce1955009c49683d517b7f7bdb2597f9
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 11 12:38:23 2015 -0700

    Better formatting

commit 908d12b8ef41af4de5226b7e88eb971798d99207
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 11 12:09:10 2015 -0700

    Releasing 0.8.0

commit f94ea82f93d9f9a5538fc94e69a436bb2e8046e2
Merge: bce07e5 5d9ca93
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 11 12:06:08 2015 -0700

    Merge branch 'master' of github.com:mzabriskie/axios

commit bce07e53aa681367082ce9f683de366918647cd6
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 11 12:05:56 2015 -0700

    Releasing 0.8.0

commit 5d9ca93bd31e7274195d23bae46f8b73fb4076b6
Merge: 07b177f 2ab201f
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 11 11:45:51 2015 -0700

    Merge pull request #160 from nickuraltsev/base-url
    
    Add support for baseURL parameter

commit 07b177f3475f6be5935c721c30097e7867bed629
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 11 11:39:22 2015 -0700

    Removing unwanted user/pass for auth

commit d81db4ab2b782e9c6b9d89cc242697da2ccb2e42
Merge: 4bbde9a 603e7c8
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Dec 10 22:14:12 2015 -0700

    Merge pull request #167 from idan/add-basic-auth
    
    Add support for HTTP Basic auth via Authorization header

commit 603e7c84a001a754056b7497e9a68a9bc7706877
Author: Idan Gazit <idan@gazit.me>
Date:   Thu Dec 10 17:22:39 2015 +0200

    Polyfilling btoa where appropriate
    
    Includes testing of the polyfills.

commit af170334bdd02e39882a88a7cbd9690d5bc78606
Author: Idan Gazit <idan@gazit.me>
Date:   Thu Dec 10 17:21:31 2015 +0200

    Dropping support for auth.user/pass
    
    Only accept `username` and `password` as arguments

commit 3138600caf40c6f6c0df56d9b34de80fddd2918a
Author: Idan Gazit <idan@gazit.me>
Date:   Thu Dec 10 17:19:26 2015 +0200

    Adding btoa polyfill

commit 0d8b5b6d94bd3eb249d9a35db96203093606863f
Author: Idan Gazit <idan@gazit.me>
Date:   Wed Dec 9 13:21:18 2015 +0200

    Adding tests for basic auth

commit 95df032fbd21ddf50e4147ad7a16bb8390423429
Author: Idan Gazit <idan@gazit.me>
Date:   Wed Dec 9 13:21:07 2015 +0200

    Abandoning URL embedded identities for Basic auth
    
    Use an `Authorization` header instead, which is a safer choice than URL embedded identities (aka `http://user:pass@example.com`). [Chrome 19 dropped support][chromium128323] for URL embedded identities in XMLHttpRequest for security reasons.
    
    Added documentation note about how this will overwrite any existing `Authorization` header that the user may have set.
    
    [chromium128323]: https://code.google.com/p/chromium/issues/detail?id=128323

commit e270c70d4dba6b24263aa298debaa6ca5f92c299
Author: Idan Gazit <idan@gazit.me>
Date:   Wed Dec 9 11:55:15 2015 +0200

    Documenting the HTTP Basic auth request config

commit 19cbca0c714d06fe26e521759ceec27f4dda396a
Author: Harry Lachenmayer <harrylachenmayer@gmail.com>
Date:   Tue Oct 20 19:49:56 2015 +0100

    Add HTTP basic authentication for Node.

commit 32a904394fb7596cee9342816b7d570fcc29a447
Author: Harry Lachenmayer <harrylachenmayer@gmail.com>
Date:   Tue Oct 20 19:42:19 2015 +0100

    Add HTTP basic authentication.

commit 2ab201f049357ea2cb3c8b4286795bafcbf3891b
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sun Nov 22 01:32:59 2015 -0800

    Update README.md: baseURL parameter

commit 435636c714954b5903c57dae1d7f983dd4585d60
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 21 23:51:59 2015 -0800

    Add support for baseURL parameter

commit 20a25a278373d2e7c19e3fc5b204cee7e42c4218
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 21 19:29:53 2015 -0800

    Add isAbsoluteURL helper

commit e253b0ef3ef17d900ec9d1814a4bba8e00c1c70b
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Nov 21 17:41:02 2015 -0800

    Add combineURLs helper

commit 4bbde9ae6c81a47234c50120efa84d29ff39f771
Merge: 7fa6915 837da53
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sat Nov 21 14:24:05 2015 -0700

    Merge pull request #140 from vineethawal/xDomainRequestSupport
    
    XDomainRequest support

commit 837da5319cf0aa2724ec64400830d1b5ee009bca
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Sun Nov 22 01:32:38 2015 +0530

    remove console.log -_-

commit 5c3b144a649ec380d855c823ef130273b12a3232
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Sun Nov 22 01:27:34 2015 +0530

    import isURLSameOrigin at top

commit 0be4467e055fa35cadea1f220191035c5deef353
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Sun Nov 22 00:28:19 2015 +0530

    buildUrl -> buildURL

commit 729ff051122e328fe34bbad720286b47903f17da
Merge: 1eac0b1 7fa6915
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Sun Nov 22 00:17:24 2015 +0530

    Merge branch 'master' of github.com:mzabriskie/axios into xDomainRequestSupport
    
    Conflicts:
            package.json

commit 7fa69152e952b26c6655a3ee3775b0f90050e5d3
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Nov 20 12:17:14 2015 -0700

    Restoring buildURL

commit 54be2807291db6f0f214fb56c35db15618fbeec4
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Nov 20 12:16:45 2015 -0700

    Fixing file system case issue

commit 7da605cf3a469bd0953cc2a27fcbff4e3ab4f123
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Nov 20 11:59:03 2015 -0700

    Use locally installed grunt for running tests

commit b404124b474ae181842742ebc8f6a6928cdf9e65
Merge: d1940f5 433dd0d
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Nov 20 11:37:48 2015 -0700

    Merge branch 'master' of github.com:mzabriskie/axios

commit d1940f52bc05a90507df54771a5331da05b0d3c5
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Nov 20 11:37:41 2015 -0700

    Restoring buildURL tests

commit b1d919462216c7040a48dd15ac2fa39b4df80df0
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Fri Nov 20 11:36:50 2015 -0700

    Fixing file system case issue

commit 1eac0b1b218748ffa499039a5ca7e6edf1600b36
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Fri Nov 20 15:58:49 2015 +0530

    buildUrl helper reference fix in xhr

commit b1f2df42a2dff90b9319d9b9c6aaa01a6033b6bb
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Fri Nov 20 15:36:49 2015 +0530

    undo dist files changes

commit 0dbeea3b6eb1f26395698b4ca2f22b9c7551e947
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Fri Nov 20 15:34:29 2015 +0530

    undo dist files changes

commit 4db0578fa29ccd872c583d7b5a0d6f3cb27a86af
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Fri Nov 20 15:25:52 2015 +0530

    undo dist files changes

commit 17c1cb92e28ebb704f432ee18968a42de0ab63d5
Merge: e5e14da 677e63a
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Fri Nov 20 15:21:42 2015 +0530

    Merge branch 'xDomainRequestSupport' of github.com:vineethawal/axios into xDomainRequestSupport

commit e5e14daab6f643b7ed95d01e6ebb4713ae9f3691
Merge: a768ac0 433dd0d
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Fri Nov 20 15:21:04 2015 +0530

    Merge branch 'master' of github.com:mzabriskie/axios into xDomainRequestSupport
    
    Conflicts:
            lib/adapters/xhr.js

commit 433dd0d0371a2fdc4903aabf1d41c9dd1615b6dd
Merge: ae3adcd 32dfc1d
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Nov 19 15:37:58 2015 -0700

    Merge pull request #149 from Kosta-Github/Kosta/unzip
    
    Adding transparent decompression if `content-encoding` is set

commit ae3adcd28b71ec235003997d16e50710a317efea
Merge: cd2567c 2781ff6
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Nov 19 15:32:55 2015 -0700

    Merge branch 'master' of github.com:mzabriskie/axios

commit cd2567cd793df0d22bc8eade51c8c85b08e6af1a
Merge: 3d65057 02a9333
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Nov 19 15:32:22 2015 -0700

    Merge branch 'moonion-master'

commit 02a93330edcd5bcfc20172e744ab1c828760ad71
Merge: 3d65057 2e4c928
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Nov 19 15:32:05 2015 -0700

    Resolving conflicts

commit 2781ff650c49debcb73c6f7821614aab392bd2f1
Merge: 3d65057 cf192f4
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Nov 19 15:28:39 2015 -0700

    Merge pull request #146 from skarbovskiy/master
    
    follow redirects

commit 3d65057d7111d7873cf4fad40805cd9ebe327574
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Nov 19 15:18:47 2015 -0700

    Making isURLSameOrigin/cookies safe to use in all envs

commit 2e4c9285d77f16a8a92019ceb99e61c41ae5974a
Author: moonion <alex@moonion.com>
Date:   Wed Nov 18 16:04:18 2015 +0200

    add config.paramsSerializer to http adapter

commit 32dfc1d9e06b76663107a385c9d96c3c8fd11628
Author: Konstantin Baumann <konstantin.baumann@autodesk.com>
Date:   Thu Nov 12 11:34:07 2015 +0100

    add test case for `transparent decompression` for `content-encoding` being set in the response headers

commit b3a4ff03e27fde35ba666c0c8b16b6505d906ff6
Author: Konstantin Baumann <konstantin.baumann@autodesk.com>
Date:   Thu Nov 12 11:16:57 2015 +0100

    uncompress the response body transparently if required

commit cf192f495e84c36c255474cbb09f37af6391bd99
Author: george.skarbovskiy <george.skarbovskiy@gmail.com>
Date:   Fri Nov 6 12:56:21 2015 +0200

    follow redirects

commit 677e63aa5562fc2db5223d94744d1f884506f45e
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Mon Nov 2 11:24:26 2015 +0530

    Update axios.js

commit a768ac07cdd228b46c8c26536bcad51193cdfb4b
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Thu Oct 29 15:40:45 2015 +0530

    remove extra conditions

commit 44cccc450cd76862ed21449cd18bbb7820008ca1
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Thu Oct 29 12:59:10 2015 +0530

    add test case

commit a59bc8d2ae218484cdcb1d7e6a295a4ff93225a1
Author: Vineet Hawal <vineet.hawal@housing.com>
Date:   Thu Oct 29 12:51:37 2015 +0530

    add xDomainRequest adapter

commit affe3aaa9a3673f58d8e521dc7d3875fd64c1c97
Merge: ed4a39a d6bcd62
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Oct 28 14:52:50 2015 -0600

    Merge pull request #139 from ctimmerm/slice-arguments
    
    Don't call slice on arguments

commit ed4a39a5c18646cf5bac2fdf4346f8263ceb6f2d
Merge: a090b05 1e2cb9b
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Oct 28 13:39:05 2015 -0600

    Merge pull request #127 from ctimmerm/ie8-arguments-foreach
    
    Don't use utils.forEach to loop over arguments

commit a090b052200b88c3c6bdf62d20a0e7c62ab029e6
Merge: 11c12b2 7843bfd
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Oct 28 04:26:11 2015 -0600

    Merge pull request #136 from nickuraltsev/update-docs
    
    Update README.md: instantiation

commit d6bcd62e4b2c54cd79b854e7b8e24eb48772e1de
Author: Colin Timmermans <colintimmermans@gmail.com>
Date:   Wed Oct 28 11:25:40 2015 +0100

    Don't call slice on arguments
    
    Calling slice on arguments can prevent optimizations in some JS engines
    (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments).

commit 7843bfdfdabf086076d09562bf0e8aaeb8ac1fba
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Tue Oct 27 23:44:14 2015 -0700

    Update README.md: instantiation

commit 1e2cb9bdca0e19298aa7c242a7db4b45427967ea
Author: Colin Timmermans <colintimmermans@gmail.com>
Date:   Tue Oct 13 19:14:58 2015 +0200

    Don't use utils.forEach to loop over arguments
    
    This fixes IE8 support, where we cannot relialably detect an arguments
    object.

commit 11c12b2c65cecfd9f0ef17a7392177bdc8f6df90
Merge: 68b1b37 14ede9e
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Oct 27 14:48:02 2015 -0600

    Merge pull request #121 from azendoo/custom-encode-params-method
    
    Add support third-party library to serialize url params

commit 68b1b37fd7260b31a213596a6b89c1e759cd1db8
Merge: 4d432cf 4ac0fbd
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Oct 27 14:43:21 2015 -0600

    Merge pull request #123 from nickuraltsev/master
    
    Make axios instantiable

commit 4d432cf113c0ea79079bd5fb68d86a926c606ead
Merge: 4fc70c9 84a0dde
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Oct 27 14:38:10 2015 -0600

    Merge pull request #128 from Kosta-Github/allow_arraybuffer_response
    
    fixing http adapter WRT `responseType === 'arraybuffer'`

commit 4fc70c9108217c2f9759bd0939a7eeb1bffc26ff
Merge: 84027a3 025620a
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Oct 27 14:37:22 2015 -0600

    Merge pull request #132 from jtangelder/patch-1
    
    Don't include a process shim in the build

commit 14ede9e18efe0330d0c9f7795567563e939be1bd
Author: David Fournier <fr.david.fournier@gmail.com>
Date:   Sat Oct 3 11:24:49 2015 +0200

    Add support third-party library to serialize url params

commit 025620a895ba24254c14b60f70adcc42b0cc0e62
Author: Jorik Tangelder <j.tangelder@gmail.com>
Date:   Mon Oct 26 10:39:33 2015 +0100

    Don't include a process shim in the build

commit 4ac0fbd1c1dc0c5f9ac290b635d6eee3783e355b
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Fri Oct 23 08:40:46 2015 -0700

    Rename axios.createNew to axios.create

commit 96afe324b345f1f5b0ae92a5bbd6aed1780b33f5
Merge: b10874f 84027a3
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Thu Oct 22 19:12:07 2015 -0700

    Merge remote-tracking branch 'mzabriskie/master'

commit 84a0ddecd479d667fb8a23bc2041cde386b51b4c
Author: Konstantin Baumann <konstantin.baumann@autodesk.com>
Date:   Thu Oct 15 17:28:38 2015 +0200

    http adapter: return a `Buffer` instead of a `String` in case of `responseType === 'arraybuffer'`

commit 84027a31b4b4232ddcfce2bbb927a675f70c7fd1
Merge: fcd2121 2e0a765
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Oct 11 20:35:34 2015 -0600

    Merge pull request #126 from louislarry/patch-1
    
    Update axios.d.ts, add Response.statusText

commit 2e0a76511a74591b461af58dc063e3cb5bfe3ccd
Author: Louis Larry <louis.larry@gmail.com>
Date:   Mon Oct 12 09:08:42 2015 +0700

    Update axios.d.ts, add Response.statusText

commit fcd2121c8b7eb1338c44af4b4ecc16af4e32869f
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Oct 7 14:36:35 2015 -0600

    Fixing test coverage reporting

commit b10874fa67ed77dd6ecbe1fd1f6eb2045ce9854f
Author: Nick Uraltsev <nick.uraltsev@gmail.com>
Date:   Sat Oct 3 09:38:16 2015 -0700

    Make axios instantiable

commit 4f732e8caabce9c9a48bf95d8a2e9869d5507aeb
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 29 00:43:31 2015 -0600

    Add banner to all dist/

commit e8136b1f746d87d9ac620cb50c26722db555169a
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 29 00:38:15 2015 -0600

    Releasing 0.7.0

commit 87d83646759593a77802caf2e6805db5827336cd
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 29 00:15:28 2015 -0600

    Updating README

commit 219a1c29aba0d29d2f1898578ca9e354ae44642d
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 29 00:04:00 2015 -0600

    Supporting a fetch like API

commit b92fa960262b74a14ecc24598ee68bc58d86979b
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 28 23:51:20 2015 -0600

    Updating ignores

commit 256c5a6555c786bfe05f4881faf8000efae96288
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 28 23:49:50 2015 -0600

    Updating ignores

commit b689bde4dda853c0128e8b0f749476e60c601a22
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 28 23:46:12 2015 -0600

    Updating README

commit 76ab0ae1a794aac9b06217af935c72281c0e7c30
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 28 23:31:43 2015 -0600

    Updating README

commit 915bef962dfbe1f7ea22560599d4b8bed7daee4c
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 28 23:31:14 2015 -0600

    Updating devDependencies

commit 95f0f00c778ea503b94dd07c2eec91f2b5b5bb43
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 28 18:40:20 2015 -0600

    Fixing axios to treat single string argument as URL
    closes #116

commit eca2ac88ebd28db1ebff3757574974a6fcdd0bf6
Merge: 6aa766e a9d2f84
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 28 18:34:10 2015 -0600

    Merge branch 'master' of github.com:mzabriskie/axios

commit 6aa766e5e92688dc8946902907dbcd3ee9278767
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 28 18:33:46 2015 -0600

    Adding support for web workers, and react-native
    closes #70, closes #98

commit a9d2f84a620f5b5d253feda58b0e1269978bf16b
Merge: 67a0fc3 d983566
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Sep 27 10:00:09 2015 -0600

    Merge pull request #114 from llambda/master
    
    Add grunt-cli and phantomjs dev deps

commit d9835663bfd7ec2605495d7b56a7d84c94fa2f52
Author: Grant Miner <xxgsoftware@gmail.com>
Date:   Sun Sep 27 10:55:07 2015 -0500

    Add grunt-cli and phantomjs, allows for "npm install" and then "npm run test" on a fresh clone.

commit 67a0fc3978f4cd787926235bef79a3054b2da786
Merge: 39c75a4 1ccd416
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Sep 24 13:28:13 2015 -0600

    Merge pull request #112 from bananaoomarang/timeout-fix
    
    Added defaults.timeout to default config.

commit 1ccd4161c7b525bb5efb444232ffe7f15c590d60
Author: Milo Mordaunt <milomord@gmail.com>
Date:   Thu Sep 24 15:53:41 2015 -0300

    Added defaults.timeout to default config.

commit 39c75a47e1cae15221e0e008894ee6cf4d9e9521
Merge: c221d03 381ae95
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Sep 23 12:00:07 2015 -0600

    Merge pull request #105 from thomasguillory/fix/ts-definition
    
    FIX typescript definition to correctly type promise callbacks

commit c221d039a91e14057f11e5c7a5e1e21fcddae5ec
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Sep 23 11:59:21 2015 -0600

    Updating README

commit 68867fba55761e4f891fdf4c7bceffe9192087ca
Merge: 2a6d7c2 a130e78
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 21 16:45:17 2015 -0600

    Merge pull request #106 from theverything/return-from-spread
    
    return result from callback

commit 2a6d7c2a38f2f77980e1c65a04ac4d1abf7cf9a4
Merge: c573a12 11c0b0a
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 21 16:44:06 2015 -0600

    Merge pull request #102 from nlf/master
    
    allow passing an agent through to node http requests, closes #68

commit c573a12b748dd50456e27bbf1fd3e6561cb0b3d2
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 21 16:25:00 2015 -0600

    Fixing issue with minified bundle in IE8
    closes #87

commit f18f12250dcc5f2703922bd65cb20247ba4ee5b8
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 21 16:21:27 2015 -0600

    Updating example for how to run examples

commit 9bf29e1c730da39d2b7ddb64dd0e32ed5c79a2ed
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 21 16:17:51 2015 -0600

    Adding UPGRADE_GUIDE

commit 5eac34f1cd147f4f5c9d4072370197d62ade7eb8
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 21 16:17:34 2015 -0600

    Fixing AMD example

commit cd0cd1805434dea0d250d195a466a1236b98e502
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 21 14:20:35 2015 -0600

    Releasing 0.6.0

commit 2936cdce1415b684b86247e60e2d5f8a3f5daf5b
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 21 13:58:35 2015 -0600

    Reverting default X-Requested-With header for xhr
    for more details see https://remysharp.com/2011/04/21/getting-cors-working

commit 23abc2a5e48db98b89b413905ed9bf71dc8a92ac
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 21 13:44:51 2015 -0600

    Updating dependencies

commit a130e787c3bb872cff9350ed22cbfa35d3a47b75
Author: Jeffrey Horn <j3ffhorn@gmail.com>
Date:   Wed Sep 2 10:43:27 2015 -0700

    return result from callback
    
    returning the result of the callback allows you to chain the promise
    like you would expect

commit 381ae95a1b5503e710133c84525a33cbbb2a2355
Author: Thomas Guillory <thomas.guillory@dashlane.com>
Date:   Wed Sep 2 14:33:41 2015 +0200

    FIX typescript definition to correctly type promise callbacks

commit 261e41644dcb4c3c4dcc4b695635b8f7b447fe70
Author: Davis Barber <dbarber@squarespace.com>
Date:   Thu Jul 30 13:54:53 2015 -0400

    Add 'progress' config option for monitoring progress events for uploads and downloads.

commit 4e58dd660eddb077b7ae2fdf64ebd62a0cddd586
Merge: 9296176 e633c4d
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Aug 10 19:03:59 2015 -0600

    Merge branch '0.6.0' of github.com:mzabriskie/axios into 0.6.0

commit 92961761138f13967127ace12818dd807f9f49ef
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Aug 10 18:59:34 2015 -0600

    Updating dependencies

commit b7b0b5d6f52a4a1d382cba757f4b59ec2dbac4f8
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 23:19:26 2015 -0600

    Updating README

commit 1d3dbd66bc3fd5d10d1d784115d853718045aa87
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 23:15:56 2015 -0600

    Updating README

commit 2abe8eb04ecbe8370c42d1c98a37396f651a2317
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 22:53:13 2015 -0600

    Converting to UMD

commit e49237ce01cda1a36cd71d0bed636a2dc344dcb9
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 22:49:36 2015 -0600

    Removing es6-promise dependency

commit ffc0237a175b825b28c90dae221af2216309e52f
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 21:56:22 2015 -0600

    Adding support for timeout config
    closes #56

commit 0e33680f400a135e80530b1b48e9e4ebff0376f1
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 8 14:44:41 2015 -0600

    Removing deprecated success/error aliases
    closes #57

commit e633c4d01d0e2f3f7fe950e691f8fb2c3502fb04
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Aug 10 18:59:34 2015 -0600

    Updating dependencies

commit 11c0b0aa10dd5f9580e31cda7637f869e7d1ef77
Author: Nathan LaFreniere <quitlahok@gmail.com>
Date:   Wed Aug 5 12:13:16 2015 -0700

    allow passing an agent through to node http requests, closes #68

commit 8c1694e821bcee2d7968612b1a75e1b49c8092a9
Merge: 3c4dfe8 613546d
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Aug 5 09:15:55 2015 -0600

    Merge pull request #100 from azendoo/fix-dependencies
    
    Fixing dependencies version

commit 613546d3bc0de0652c897c5496c58a8169a44677
Author: David Fournier <fr.david.fournier@gmail.com>
Date:   Tue Aug 4 16:50:29 2015 +0200

    Fixing dependencies version

commit e9f212325e972a7026b906c8710b2b825bd6e48f
Merge: 34ce57a 58a35df
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jul 23 12:49:50 2015 -0700

    Merge branch '0.6.0' of github.com:mzabriskie/axios into 0.6.0

commit 34ce57ade8853a1a251d3664a1f2b66e15c5fdcf
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 23:19:26 2015 -0600

    Updating README

commit f8fbd6ed4e35f8d1e84e80c66315eaf5b2b6ce97
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 23:15:56 2015 -0600

    Updating README

commit ebeb2221d9533c902c6613b77197df63fb90570b
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 22:53:13 2015 -0600

    Converting to UMD

commit e8cf487ad0f5386313dd13f4914c8e49d4272fa4
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 22:49:36 2015 -0600

    Removing es6-promise dependency

commit cc451b38c159841a283067a57220c0e6e985a139
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 21:56:22 2015 -0600

    Adding support for timeout config
    closes #56

commit 87427d37e7da14c35e0d68ffa43685da8f2c85a6
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 8 14:44:41 2015 -0600

    Removing deprecated success/error aliases
    closes #57

commit 3c4dfe8a8112d685e0cdaf8d96c18e0258b8b129
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jul 23 09:39:59 2015 -0700

    Making content-type header case insensitive
    closes #89

commit 3b10b6a6c57d11fabb19ea8fcbdaea84c88cf0e1
Merge: 63ac064 2209226
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Jul 23 09:08:16 2015 -0700

    Merge pull request #49 from maxhoffmann/master
    
    Fixing arrays in get params

commit 63ac064c8894ce9b1aefb7835523791d93051330
Merge: 183e592 72fc02f
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Jul 23 09:07:24 2015 -0700

    Merge pull request #85 from tomaash/patch-1
    
    In browsers check for XMLHttpRequest, not window

commit 72fc02f2a501a8345e80f2652fafa6ddb07cacca
Author: Tomáš Holas <tomas.holas@gmail.com>
Date:   Thu Jul 23 14:19:14 2015 +0200

    XHR browser check now works in IE8
    
    Test for ActiveXObject

commit 2209226c7c69b7cb1ded9f84d2bfdcd6034a01f6
Author: Maximilian Hoffmann <account@maximilianhoffmann.com>
Date:   Thu Jul 23 10:49:12 2015 +0200

    fix missing dot

commit f44597e38b5a9df0e7f28ea3eb2d62930fbbd74b
Author: Maximilian Hoffmann <account@maximilianhoffmann.com>
Date:   Thu Jul 23 10:46:21 2015 +0200

    don’t escape square brackets

commit 183e59211d6f7d700de9b544b3956c3aaa8007b0
Merge: db85c7b 4f1101f
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Jul 22 23:23:01 2015 -0700

    Merge pull request #91 from instagibb/master
    
    Fixing isArrayLike to allow length as a param. Added test

commit 4f1101fe4bc950f207d720f572916d85b6e5baed
Author: Andrew Gibb <andrew.gibb@pearson.com>
Date:   Tue Jul 21 14:17:45 2015 +1000

    Fixing isArrayLike to allow length as a param. Added test

commit ca42bb1d2a93d20c234eb1c9ab998aea062f83f8
Author: Tomáš Holas <tomas.holas@gmail.com>
Date:   Mon Jul 13 09:42:27 2015 +0200

    In browsers check for XMLHttpRequest, not window
    
    In nodejs testing environment it's possible to use https://github.com/tmpvar/jsdom library to define a window object, but you still want to use node http adapter. Due to those diverse testing environmnents, I propose to test for XMLHttpRequest directly, because window global object is not a sure sign of a browser environment anymore.

commit 58a35df2bd61d2bc6bc2795879c770a3ec92edca
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 23:19:26 2015 -0600

    Updating README

commit 0f02a5a51f73c138fae1655e071c83838a785610
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 23:15:56 2015 -0600

    Updating README

commit 8df6b4cb1b47145b012d5c4f9df05d5d9e848d9b
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 22:53:13 2015 -0600

    Converting to UMD

commit c42b0ae438fe8bb4d0223b1888dd6818a836e555
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 22:49:36 2015 -0600

    Removing es6-promise dependency

commit 5f5af9c6337f79a08d26b68c063192f36ff848da
Merge: 1695f5c 989b4cf
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 21:58:22 2015 -0600

    Merge branch '0.6.0' of github.com:mzabriskie/axios into 0.6.0

commit 1695f5cffe557381cea3b73268fff6f688c5934d
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 21:56:22 2015 -0600

    Adding support for timeout config
    closes #56

commit a7caa97caa1a8680fd23dfe517e1649ec93b7a72
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 8 14:44:41 2015 -0600

    Removing deprecated success/error aliases
    closes #57

commit db85c7bf3ae19d680f5c16cd85d06c5e11fedc5f
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 21:19:46 2015 -0600

    Fixing issue with User-Agent getting overridden
    closes #69

commit 8365cbb78943ba6ddd984722a2800c3555d9da01
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 21:07:29 2015 -0600

    Updating dependencies

commit f2105140eeb08a2ef1336d969c47ca6aacae16f1
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 20:49:49 2015 -0600

    Pretty colors

commit 0424d8c2bf1649a861f0d47f28c79f92718df87a
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Jun 18 20:49:08 2015 -0600

    Fixing issue with test suite running indefinitely in watch mode

commit 594df987f279ff423b82e96f0aa5fa6ef9bde959
Author: Maximilian Hoffmann <account@maximilianhoffmann.com>
Date:   Wed May 27 13:32:34 2015 +0200

    fix array params

commit 1629a026da17a1e1d8999a02f3fe6b6b60aaac9c
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Apr 12 16:07:32 2015 -0600

    Adding X-Requested-With header

commit a517a239823bfcbf0a22f4a779aee025d478c88a
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Apr 12 15:53:21 2015 -0600

    Adding test for parsing JSON response

commit 989b4cfcec51ab64ac98669e61e3261a72995a28
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 8 14:44:41 2015 -0600

    Removing deprecated success/error aliases
    closes #57

commit fe30d7818f26c20b4afe8fbf37bf3517cf20ab2a
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 8 13:56:41 2015 -0600

    Fixing npm install warning

commit 781df7045efe4be3fa2b26cfe68c59787594601a
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 8 13:51:14 2015 -0600

    Updating examples

commit 4ad5438f6103d6314a4ab237b02b6a0303876375
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 8 13:24:43 2015 -0600

    Improving examples

commit 8a4e502e3a76b8e41b2f896e05b92db3c0f543f7
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 8 12:48:38 2015 -0600

    Releasing 0.5.4

commit 42fc3954d2acd0d9366afa03dd0add0fbe44d42c
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Apr 8 12:46:03 2015 -0600

    Fixing issue with FormData not being sent
    closes #53

commit 9d31a867166e9224f0c5168d84560abe85868404
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Apr 7 21:00:00 2015 -0600

    Releasing 0.5.3

commit f96b49bec4a9840eb3382c1c67212fcf95e033c0
Merge: 9ddb607 34dc46f
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Apr 7 20:54:05 2015 -0600

    Merge branch 'master' of github.com:mzabriskie/axios

commit 9ddb607e3fb9238d9f302a6e0197224ec806ee86
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Apr 7 20:53:46 2015 -0600

    Using JSON.parse unconditionally when transforming response string
    closes #55

commit 34dc46f8aa53087379895b3f6a9f847e6768a51d
Merge: 5ab9c2f 145ecca
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Mar 23 19:52:55 2015 -0600

    Merge pull request #52 from ryiwamoto/add_typescript_definition_to_package_json
    
    Adding typescript element to package.json for TSD linking

commit 145ecca1fb2e3d8bf1eef1ee5c9df20398a3d248
Author: ryiwamoto <konnpekigan@gmail.com>
Date:   Tue Mar 24 01:55:35 2015 +0900

    Adding typescript element to package.json for TSD

commit 5ab9c2f05e193ad9c87077b805538ffa65c26d96
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 18 19:39:27 2015 -0600

    Stupid typo

commit dde87076ecf273f7b470f3bf905fd5659958331f
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 18 17:58:01 2015 -0600

    Removing node path from browser tests

commit f9a2c7e8b882cf2282163d7745c8b452208d7d6a
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 18 17:22:08 2015 -0600

    Fixing bad use strict statement

commit 60a82ef4245708fdb25cc8e6e71d8bc2798debb8
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 18 17:21:15 2015 -0600

    Changing to file level use strict statement

commit fc12b933f729f236b2149872c42961a8626dafb7
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 18 17:12:51 2015 -0600

    Moving many nodeunit tests to jasmine

commit b745600ab7aa9c902e615d10e98778bd695e7988
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Mar 18 10:45:06 2015 -0600

    Using webpack for testing

commit dfa816df9bf57f20ec5288408511810df6b458d3
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 17 23:07:32 2015 -0600

    Adding utils tests

commit a3bf7e981d14e78a4d3807954eeb645d697ca95d
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 17 17:15:08 2015 -0600

    Updating README

commit ce03103da4fb30642a5162a69daf08ef7b69a060
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 17 16:56:30 2015 -0600

    Adding coveralls

commit a98c61f458036d28c66c676788bd22f7c7c3c7d5
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 17 14:14:26 2015 -0600

    Adding ESLint

commit 7387829d33bc08b805477acdb24e1acaaf597f42
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 13 17:16:45 2015 -0600

    Updating README

commit bc49510b64a997b323d4d7f28add48c85aaea03b
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 13 17:16:00 2015 -0600

    Updating README

commit 2ce5aa77df30369960924ee70956f6ac0d37a1aa
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 13 17:13:41 2015 -0600

    Releasing 0.5.2

commit dd2aa791e612a5ea4122e5f7be1420d3bf98c0a7
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 13 17:08:22 2015 -0600

    Cleanup

commit 69af75623c864ed477230d1c9978e71e2467844f
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Mar 13 17:07:52 2015 -0600

    Adding statusText to response
    closes #46

commit f002d5abd50ea3ca6eb72fdcd6fbadb1f7c142e9
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 12 15:52:33 2015 -0600

    Fixing typo

commit c899c8742f6fd3af7987ee4489d0eb683ab788b0
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Mar 12 15:41:24 2015 -0600

    Adding Cookbook

commit 6c52a82a9d6adb1c3a5be8d859b4e1d5f8bc3e91
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 10 22:34:34 2015 -0600

    Updating devDependencies

commit 571554151d558e0e08b5706a9a9e649b94c0aeef
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 10 15:11:57 2015 -0600

    Test passing now

commit bd5d9b7258dd27648caddeba8259a4ed020b6724
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 10 14:46:29 2015 -0600

    Releasing 0.5.1

commit 8fded1802b1289e212c6ef6d9d015e3587253e94
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 10 14:30:49 2015 -0600

    Fixing issue with standalone build
    closes #47

commit 6d03e0bd4ebe5ac2f0d7f2bac88a3c8d262ccaf7
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Mar 10 14:28:43 2015 -0600

    Fixing issues with strict mode
    closes #45

commit ace6a04671a2ec893cad1f05300b85b6dff5ddf2
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Feb 17 09:55:11 2015 -0700

    Noting that jasmine-ajax 3.0.0 is needed

commit 0438dd3bac718f1332073b72b4cd3401d3181caa
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Feb 17 01:11:39 2015 -0700

    Updating karma

commit 7efc095582b51ef5e513b4076cb504ce35cefd68
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Feb 3 01:24:38 2015 -0700

    Adding examples

commit e880940099bce2edca9e17fbb5cff16d445fc896
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Feb 2 23:11:09 2015 -0700

    Stray console.log

commit 0412c7666e72f17e5359a1106f20b79e59f1b3c1
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Feb 2 22:04:18 2015 -0700

    Fixing issue with multibyte characters in node
    closes #38

commit 59093a9c610f3309fa20ffc3c57c8da71dd7ca2f
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Feb 2 21:12:08 2015 -0700

    Adding tests for responseType arraybuffer

commit d27cef35ba699508055dbddeb635bce954ba5fff
Merge: fa6c26a 21f4a7f
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Jan 25 15:00:56 2015 -0700

    Merge pull request #37 from nnarhinen/arraybuffer
    
    Add support for arraybuffer requests in browser

commit 21f4a7f544d50b371327754d706955b1373ee73a
Author: Niklas Närhinen <niklas@narhinen.net>
Date:   Sun Jan 25 14:00:22 2015 +0200

    Add support for arraybuffer requests in browser

commit fa6c26a0e5eaad5d58071eb39d7afff0c7dc051c
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 23 03:11:24 2015 -0700

    Releasing 0.5.0

commit a9bcc8f4190a6d37a14a2d9d6d479c063994d9bb
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 23 02:53:22 2015 -0700

    Upgrading es6-promise dependency

commit 59763d398949f2cf5051da45e48ac6c4308f652a
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 23 02:12:48 2015 -0700

    Updating README

commit b4d81bd1246e780172b2c5685d6717129fd8f68e
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 23 02:12:28 2015 -0700

    Adding comments

commit bbf437ce4c4115b24b7be575fbb1a74c45e616c8
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 23 02:11:57 2015 -0700

    Cleaning up core axios a bit

commit 9e3830cf9229325240df60b5e6a6d70076645102
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 23 01:32:54 2015 -0700

    Adding support for removing interceptors

commit 7b05902b3cfe1f8eb73ee40465d89d4dd3d70078
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Jan 23 01:29:05 2015 -0700

    Moving webpack config to it's own file

commit 2d5250ce0ae02ee9f6412f776690d8b99f11fb1e
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Dec 11 00:11:25 2014 -0700

    Releasing 0.4.2

commit d65f9f7eea5f491e72932faa8f62780d45175fad
Merge: 1b2cc9f 32ca449
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Dec 10 23:53:05 2014 -0700

    Merging master

commit 1b2cc9ffe34643333a3d4a6f2fda88bd7db49663
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Dec 10 23:51:40 2014 -0700

    Fixing issue with standalone build
    closes #29

commit 32ca449939ee60786589efef0cca580618b43bb3
Merge: b9fb9fe ecd9f73
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Wed Dec 10 08:49:41 2014 -0700

    Merge pull request #30 from torarnek/master
    
    Fixing errors caused by lowercase verb

commit ecd9f7391c938500b27b1464863e7da01f35b089
Author: torkvalo <tor.arne.kvaloy@finn.no>
Date:   Wed Dec 10 13:37:11 2014 +0100

    Fixes failing tests for the IE8/IE9 capitalized verb bug.

commit 4f34f61b701f537bc77bfcbc31cafe3e29b0c133
Author: torkvalo <tor.arne.kvaloy@finn.no>
Date:   Wed Dec 10 13:20:19 2014 +0100

    Delete fails in IE8/IE9, the verb needs to be capitalized.

commit b9fb9fec49b1f63bd5ed166eea6bd84df8db5209
Merge: eba892d 5bb39f3
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Mon Dec 8 12:27:48 2014 -0700

    Merge pull request #27 from jmdobry/feature-interceptors
    
    Adding support for interceptors

commit 5bb39f32796af51eba9c01f5bc5be5d88e8c340f
Author: Jason Dobry <jason.dobry@gmail.com>
Date:   Tue Dec 2 15:45:19 2014 -0700

    Initial interceptor implementation.

commit eba892d9baa023ca55a39f2e32de662515d96e11
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Dec 5 23:25:18 2014 -0700

    Updating TypeScript definition

commit 738af701bb39aba951a502e527372a97be1bc254
Merge: d93df70 7753add
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Dec 2 16:32:52 2014 -0700

    Merge pull request #25 from blittle/master
    
    Add a TypeScript definition for Axios with included tests

commit 7753adde2cf573bfd1a898a2e690b5cc630f83a9
Author: Bret Little <bret.little@gmail.com>
Date:   Tue Nov 18 15:53:04 2014 -0700

    Add a TypeScript definition for Axios with included tests

commit d93df704a269d3cbf8f00bcd4b2b2489d5b74f49
Merge: 789baf3 2f4d0b8
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Tue Nov 4 10:47:46 2014 -0700

    Merge pull request #22 from nnarhinen/formdata-content-type
    
    Fixing issue with Content-Type when uploading FormData

commit 2f4d0b8b45dbb766a3348200fdff02ee00d9d6c0
Author: Niklas Närhinen <niklas@narhinen.net>
Date:   Thu Oct 23 01:49:25 2014 +0300

    Automatic Content-Type for FormData uploads
    
    When data passed to axios is of type FormData we have to let the browser
    create the Content-Type header so that the boundaries will get right
    etc.
    
    Usage:
    
    ```js
    var data = new FormData();
    data.append('field', 'some string');
    data.append('file', someFile);
    
    var opts = {
      transformRequest: function(data) { return data; }
    };
    
    axios.post('/fileupload', data, opts);
    
    ```

commit 789baf3a58b717e270ded37d4416ae25a650d99d
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Oct 15 12:17:36 2014 -0600

    Releasing 0.4.1

commit 7e422d1463118f938f1addfca2efb35905bc8644
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Oct 15 12:10:26 2014 -0600

    Updating README

commit 5fce14d9ec99d0b70dc0b15776ec0a70880a98cb
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Wed Oct 15 10:29:40 2014 -0600

    Adding error handling to request for node.js - closes #18

commit 1d6430f667486ca9de390ccec242114b36c41377
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Oct 5 17:52:57 2014 -0600

    Releasing 0.4.0

commit e0b1bb6d0ba9c4175ccf895f65823605368cdf53
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Oct 5 17:45:40 2014 -0600

    Adding banner to all min files

commit ede39aaea9a57c61063678ab6463e385aae301ee
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Oct 5 17:27:25 2014 -0600

    Adding tests for transformers

commit e3308899d3f5adc25eb29ef4fba9a7cd6ec4bb8d
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 30 08:55:36 2014 -0600

    Adding custom URL support in sandbox client

commit 8c3fc8fa8a7427613165af6fc9542c0cc4ff09b7
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 29 22:41:49 2014 -0600

    Updating README

commit 2eda22127e22ddfa83a3cef6bb396a2a5ffabf67
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 29 22:37:04 2014 -0600

    Deprecating success/error in favor of then/catch

commit 38d429f6dc22ffe82b430619942acd8f6004abf7
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Sep 28 16:11:39 2014 -0600

    Supporting standalone build without bundled es6-promise - #11

commit 1b803fb2334f14044a4c57640883103729ae615b
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 22 11:12:24 2014 -0600

    Moving stuff to helpers/

commit edb0c3ce24a6f88400b73fea385cd82993dafab0
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 22 10:48:44 2014 -0600

    Better User-Agent name

commit f406b092fc971ef35ffdbceee84cc827f3d389f5
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Mon Sep 22 10:47:41 2014 -0600

    Fixing failing tests

commit 77bed7c8ab9aaf80d98bf2b87e107ab30f7acd77
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Sep 21 16:57:07 2014 -0600

    Fixing issue #9

commit 94b2352438c01cf98865c35f3b9d56a23aaf53d0
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Sep 21 16:18:08 2014 -0600

    Adding SSL support for node.js - #12

commit c0201fd419720888d244757a5c7793517a280dd1
Merge: 72a91ef 9d5a878
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Sep 21 16:00:03 2014 -0600

    Merge pull request #13 from mathbruyen/utf8_content_length
    
    Handle UTF-8 multibyte sequences in node

commit 9d5a8781e3bb8828385485f2a4450277f274e7d9
Author: Mathieu Bruyen <code@mais-h.eu>
Date:   Sun Sep 21 17:48:26 2014 +0200

    Handle UTF-8 multibyte sequences in node
    
    Content-length header was set to the length of the string, which
    does not take into account multibyte sequences in UTF-8 strings.
    
    Now converts first to a buffer to get the proper length.

commit 72a91ef2b0cb90428b3e24ac025e47a48b71ea99
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Sep 18 13:10:00 2014 -0600

    Adding LICENSE

commit 2a06e3b307ae860044936fd159fb55c770c1326a
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Sep 18 13:09:52 2014 -0600

    Updating ignores

commit 89bd626b87bb74e21fbd2da86813ccaff42aca5e
Merge: 87b5317 c03e51c
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Sep 18 13:02:06 2014 -0600

    Merging master

commit 87b5317114b98367405b4f14a7f882518ac55449
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Sep 18 13:01:37 2014 -0600

    Adding CONTRIBUTING.md

commit 13fb3e80b0fb14c4e678ac6ee7dd3a6130d22aef
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Thu Sep 18 13:01:25 2014 -0600

    Adding descriptions to grunt tasks

commit c03e51ce8305cb9abe9fd7bc97aa4d71353f2f29
Merge: d8f687d 095a204
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Thu Sep 18 12:13:35 2014 -0600

    Merge pull request #10 from mathbruyen/arraybuffer
    
    Allow ArrayBuffer and related views as data

commit 095a204c5bd887622e196ab646136442495d4e4d
Author: Mathieu Bruyen <code@mais-h.eu>
Date:   Thu Sep 18 09:07:08 2014 +0200

    Allow ArrayBuffer and related views as data
    
    In order to push binary data under the form of ArrayBuffer and
    its related views (Int8Array, ...) one needs not to stringify
    those.
    
    For the XHR adapter there is nothing to do as it natively supports
    ArrayBuffer in req.send().
    
    Node's http adapter supports only string or Buffer thus a
    transformation to Buffer is required before setting content length
    header.

commit d8f687dc52d6ee5242798ceac34e05f86853250d
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 18:32:42 2014 -0600

    Releasing 0.3.1

commit e1aa04cceeeb72e52b41c891d1fd0325db96a0f7
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 18:23:31 2014 -0600

    Fixing issue #3

commit 3950ceea2107ae798036f5378d1deaa26bcedd91
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 12:27:47 2014 -0600

    Updating CHANGELOG

commit 0f2461a6bb90efdbc54c8c2a234062a24b8222ca
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 12:21:45 2014 -0600

    Releasing 0.3.0

commit 5947b5acf5ed4b7082e9866f3692e10cd2357448
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 12:16:23 2014 -0600

    Updating CHANGELOG

commit ca08dcdf509103e73dc440141b8ad77d3b35246e
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 12:14:08 2014 -0600

    Updating CHANGELOG

commit db3f59984b88b0b3dac890f2a7a9f73d07af8f47
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 12:09:44 2014 -0600

    Updating README

commit 679ec09b39482e58c583bc9230339441f18229c5
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 12:03:46 2014 -0600

    Updating README

commit 59eb2b6204fa3730fc91258b5180eb0f8397fd8d
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 11:52:56 2014 -0600

    Fixing issue #8

commit 1fa35ced3c086622807de0c808a797cfbff092cd
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Tue Sep 16 11:51:29 2014 -0600

    Fixing issue #7

commit f2fd9f7dd3a644ddbd25b4bfe59c86313b24a443
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Sep 14 21:30:52 2014 -0600

    Releasing 0.2.2

commit e01352a653bb98c9eb821fae73884fb2db6dccd5
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Sun Sep 14 21:26:06 2014 -0600

    Updating CHANGELOG

commit 42ed3e14a2aab81cb30802b620c4756e90bd05bc
Merge: 629c576 d0bdde4
Author: Matt Zabriskie <mzabriskie@gmail.com>
Date:   Sun Sep 14 21:10:53 2014 -0600

    Merge pull request #5 from nickb1080/browserify-fix
    
    Fixing bundling with browserify

commit d0bdde4ce3660c00e2444ff5f96be190275b3a44
Author: Nick Bottomley <nhbottomley@gmail.com>
Date:   Sun Sep 14 14:21:12 2014 -0700

    remove browserified file

commit c26505322535a6ceec3cea469df78c2bc3cf6f43
Author: Nick Bottomley <nhbottomley@gmail.com>
Date:   Sun Sep 14 14:20:40 2014 -0700

    add 'browser' field to package.json for browserify

commit 629c576f23e2983382ff7251a5c18b44249b0d2b
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Sep 12 16:58:47 2014 -0600

    Releasing 0.2.1

commit 3546990e02c76433c7da4347d428413620177789
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Sep 12 16:57:56 2014 -0600

    Updating CHANGELOG

commit 399f87ea05052bf5270f5677b0952571f84dbf15
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Sep 12 16:56:36 2014 -0600

    Fixing build problem causing ridiculous file sizes

commit ec931f6abb7aa284884569e89e4f7448821e4ab0
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Sep 12 14:40:49 2014 -0600

    Updating README

commit e796b904b79cab525742b1d892c673a45d1b1da6
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Sep 12 14:27:36 2014 -0600

    Adding CHANGELOG

commit 3b7132ee1b9dffa4927735e49598dcd92836fcb2
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Sep 12 14:05:14 2014 -0600

    Releasing 0.2.0

commit 962dda093dd524a2408786dbac9b325ff1c117ba
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Sep 12 13:45:57 2014 -0600

    Updating README

commit 10934965cc36dda102b759c5af70cbc490a4aa12
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Sep 12 13:44:46 2014 -0600

    Updating README

commit f4a334e17c3031970a5cb614551d057948f7d09f
Author: mzabriskie <mzabriskie@gmail.com>
Date:   Fri Sep 12 12:38:17 2014 -0600

    Adding support for node

commit 743f8683da4059509911423e356fca087e757350
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Mon Sep 8 10:49:01 2014 -0600

    Updating README

commit 2e0e3403269feb4e4e370b06cd3d895a4e7a2b75
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Mon Sep 8 10:47:44 2014 -0600

    Updating README

commit c279d3c680946de526d4238ba1b3cda608e3c42b
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Mon Sep 8 10:47:04 2014 -0600

    Updating README

commit 50955aba5024fc90723c3d3cc36b1a4ee353fc05
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Sep 5 15:59:02 2014 -0600

    Updating README

commit c43f2b9710549626eba63916b3c3e7d2c100e402
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Sep 5 15:48:58 2014 -0600

    Adding support for all and spread

commit 38ad8fef20ee5807698ffb3e0cefabfc3e122f6a
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Tue Sep 2 12:41:11 2014 -0600

    Updating README

commit 00724fdd0bb5bfa66f466cbf459e590a5d7c0c9d
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 17:07:25 2014 -0600

    Version bump - 0.1.0

commit 839fcca5e228fc2e99dc4e6d298876a5e61023c3
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 17:00:18 2014 -0600

    Updating README

commit 5a00ff00e8f70f8bdd9c2b7dc6da4b2e0eeebfca
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 16:59:43 2014 -0600

    Updating README

commit 0b0ef29be08261cf84fc957125768f3507942f9e
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 16:57:17 2014 -0600

    Updating README

commit a3e5e7d2c1dcd4bfe44d5ba0c961068742a0ff00
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 16:40:02 2014 -0600

    Updating README

commit 96087903807d8a7d45e10f20b6d717c7bcf418e6
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 16:36:09 2014 -0600

    Updating README

commit d441f8392f9ec2c85220c448bdae6b62ec295e8a
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 16:09:40 2014 -0600

    Improving the response API

commit 1c35eaadc033b759d52e327f980b201f8cc1eead
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 14:42:17 2014 -0600

    Updating README

commit 5e6e269b54c3b0f1579db9606f3a50f0efb899a1
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 01:23:48 2014 -0600

    Updating README

commit 774b8c8e859105153a3f527da7ae387552bbe2e9
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 01:23:39 2014 -0600

    Renaming options to config

commit 7aef479c7e50298217a5cd06ebe3747c85c084fb
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 01:17:40 2014 -0600

    Adding xsrf protection

commit 3ae6670f77f0edc50858d3ec3686c4f286d98a4e
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Fri Aug 29 01:05:49 2014 -0600

    Fixing typo

commit 25797283846be20daa45c07c4b1cf4b5d70d114c
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Thu Aug 28 15:57:35 2014 -0600

    Adding sandbox

commit 9efd6047e4a2ce6871ab69b0067339a7753684ff
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Thu Aug 28 15:57:25 2014 -0600

    Adding example

commit f5f461d8a21a8afb35eb6bad835f9508983d8ea7
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Thu Aug 28 15:56:47 2014 -0600

    Updating ignores

commit 2fb81d805f252b509dba76bb0f28c26c020c43ec
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Thu Aug 28 15:56:32 2014 -0600

    Adding banner

commit 6bd8c3a49357c4241c1b109cc9b2b1f51d06ff2f
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Thu Aug 28 13:13:31 2014 -0600

    Fixing minification

commit 960a583d568f75913c18a15219a75cab5f0b6b13
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Thu Aug 28 12:37:13 2014 -0600

    Updating README

commit cec3482ff7c5d7877e1343e4aa7e18e3a76a1456
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Thu Aug 28 12:33:53 2014 -0600

    Moving utility functions into utils

commit ceca9ced4734b8412e8b65d806231f4290945d9b
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Thu Aug 28 11:46:15 2014 -0600

    Updating README

commit fe32d44336aabef2f5a6ccd3ded37a6638cdd777
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Thu Aug 28 11:44:22 2014 -0600

    Updating README

commit d49cb34591f37d1e1a8fcf3421599c628d9746c6
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Wed Aug 27 14:05:27 2014 -0600

    Updating forEach to handle non iterable values

commit 0c7236b292a77e330710994417c4214475fb6880
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Wed Aug 27 13:59:29 2014 -0600

    Fixing issue referencing wrong headers

commit f21293d3ddb2093b362c950eb2a91271da0e949c
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Wed Aug 27 10:33:29 2014 -0600

    Updating README

commit c0a91847396519368c0f35976c13ea1a5e0dc123
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Wed Aug 27 03:12:29 2014 -0600

    Using response headers

commit 514e281a1bedd48b64d3343312e8ebeb41fd5d5d
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Wed Aug 27 02:08:39 2014 -0600

    Adding support for params

commit 9096d34186d5a5148f06c07854b21d6cc8035e96
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Wed Aug 27 01:06:19 2014 -0600

    Breaking up complexity of main axios file

commit 0d0b8370205f62c65ee2e51262dab6bc48569548
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Wed Aug 27 01:03:49 2014 -0600

    Adding nodeunit

commit 85e9330c8cffb17fb78db7ff5363e67f30eaa847
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Tue Aug 26 11:56:30 2014 -0600

    Updating README

commit cd221704cf4b0aa7a3dd01006b350d4d2a239e6b
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Tue Aug 26 11:00:07 2014 -0600

    Adding transformers

commit 28073866a5c10e039c233d9ae22fe8bb95442bb7
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Tue Aug 26 09:35:33 2014 -0600

    Fixing issue with post data

commit 9c2528d9cca7c7be0b0e5c6cc58f2ad13a1d5689
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Mon Aug 18 17:27:33 2014 -0600

    Adding initial source

commit 2c3a3bc0b7266f55306de684032b94eaa0ece8c8
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Mon Aug 18 17:25:56 2014 -0600

    Adding testing config

commit d29c1ac66e0e80c38f95c45464cdb1b24ff62f41
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Mon Aug 18 17:25:24 2014 -0600

    Adding project files

commit 729404dff5454d74785e0c632bb6b4a855fa59ff
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Mon Aug 18 17:25:07 2014 -0600

    Adding project files

commit 91871496a21a0286599c540b82dc0010cd814394
Author: Matt Zabriskie <mattzabriskie@attask.com>
Date:   Mon Aug 18 16:40:07 2014 -0600

    first commit
