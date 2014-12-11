# Changelog

### 0.1.0 (Aug 29, 2014)

- Initial release

### 0.2.0 (Sep 12, 2014)

- Adding support for `all` and `spread`
- Adding support for node.js ([#1](https://github.com/mzabriskie/axios/issues/1))

### 0.2.1 (Sep 12, 2014)

- Fixing build problem causing ridiculous file sizes

### 0.2.2 (Sep 14, 2014)

- Fixing bundling with browserify ([#4](https://github.com/mzabriskie/axios/issues/4))

### 0.3.0 (Sep 16, 2014)

- Fixing `success` and `error` to properly receive response data as individual arguments ([#8](https://github.com/mzabriskie/axios/issues/8))
- Updating `then` and `catch` to receive response data as a single object ([#6](https://github.com/mzabriskie/axios/issues/6))
- Fixing issue with `all` not working ([#7](https://github.com/mzabriskie/axios/issues/7))

### 0.3.1 (Sep 16, 2014)

- Fixing missing post body when using node.js ([#3](https://github.com/mzabriskie/axios/issues/3))

### 0.4.0 (Oct 03, 2014)

- Adding support for `ArrayBuffer` and `ArrayBufferView` ([#10](https://github.com/mzabriskie/axios/issues/10))
- Adding support for utf-8 for node.js ([#13](https://github.com/mzabriskie/axios/issues/13))
- Adding support for SSL for node.js ([#12](https://github.com/mzabriskie/axios/issues/12))
- Fixing incorrect `Content-Type` header ([#9](https://github.com/mzabriskie/axios/issues/9))
- Adding standalone build without bundled es6-promise ([#11](https://github.com/mzabriskie/axios/issues/11))
- Deprecating `success`/`error` in favor of `then`/`catch`

### 0.4.1 (Oct 15, 2014)

- Adding error handling to request for node.js ([#18](https://github.com/mzabriskie/axios/issues/18))

### 0.4.2 (Dec 10, 2014)

- Fixing issue with `Content-Type` when using `FormData` ([#22](https://github.com/mzabriskie/axios/issues/22))
- Adding support for TypeScript ([#25](https://github.com/mzabriskie/axios/issues/25))
- Fixing issue with standalone build ([#29](https://github.com/mzabriskie/axios/issues/29))
- Fixing issue with verbs needing to be capitalized in some browsers ([#30](https://github.com/mzabriskie/axios/issues/30))