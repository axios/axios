# Security policy

## ⚠️ Decompression bomb / unbounded response buffering

By default, `maxContentLength` and `maxBodyLength` are set to `-1` (unlimited). A malicious or compromised server can return a small gzip/deflate/brotli-compressed body that expands to gigabytes, exhausting memory in the Node.js process.

**If you make requests to servers you do not fully trust, you MUST set a `maxContentLength` (and `maxBodyLength`) suitable for your workload.** The limit is enforced chunk-by-chunk during streaming decompression, so setting it is sufficient to neutralize decompression-bomb attacks.

```js
axios.get('https://example.com/data', {
  maxContentLength: 10 * 1024 * 1024, // 10 MB
  maxBodyLength: 10 * 1024 * 1024,
});

// Or globally:
axios.defaults.maxContentLength = 10 * 1024 * 1024;
axios.defaults.maxBodyLength = 10 * 1024 * 1024;
```

The default was not tightened because doing so would silently break every legitimate download larger than the chosen cap. The responsibility to pick a safe ceiling for untrusted sources rests with the application.

## Reporting a Vulnerability

If you believe you have found a security vulnerability in the project, please report it to us as described below. We take all security vulnerabilities seriously. If you have found a vulnerability in a third-party library, please report it to the maintainers of that library.

## Reporting Process

Please do not report security vulnerabilities through public GitHub issues. Please use the official security channel on GitHub by logging a [security advisory](https://github.com/axios/axios/security).

## Disclosure Policy

When we receive a security vulnerability report, we will assign it a primary handler. This person is responsible for the vulnerability report. The handler will confirm the problem and determine the affected versions. The handler will then evaluate the problem and determine the severity of the issue. The handler will develop a fix for the problem and prepare a release. The handler will notify the reporter when the fix is ready to be announced.

## Security Updates

Security updates will be released as soon as possible after the patch has been developed and tested. We will notify users of the release via the project’s GitHub repository. We will also publish the release notes and security advisories on the project’s GitHub releases page. We will also deprecate all versions that contain the security vulnerability.

## Security Partners and Acknowledgements

We would like to thank the following security researchers for working with us to help make the project safe for everyone:

- [Socket Dev](https://socket.dev/)
- [GitHub Security Lab](https://securitylab.github.com/)
