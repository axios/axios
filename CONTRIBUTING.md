# Contributing

We are open to, and grateful for, any contributions made by the community. By contributing to axios, you agree to abide by the [code of conduct](https://github.com/axios/axios/blob/master/CODE_OF_CONDUCT.md).

### Code Style

Please follow the [node style guide](https://github.com/felixge/node-style-guide).

### Commit Messages

Commit messages should be verb based, using the following pattern:

- `Fixing ...`
- `Adding ...`
- `Updating ...`
- `Removing ...`

### Testing

Please update the tests to reflect your code changes. Pull requests will not be accepted if they are failing on [Travis CI](https://travis-ci.org/axios/axios).

### Documentation

Please update the [docs](README.md) accordingly so that there are no discrepancies between the API and the documentation.

### Developing

- `grunt test` run the jasmine and mocha tests
- `grunt build` run webpack and bundle the source
- `grunt version` prepare the code for release
- `grunt watch:test` watch for changes and run `test`
- `grunt watch:build` watch for changes and run `build`

Please don't include changes to `dist/` in your pull request. This should only be updated when releasing a new version.

### Releasing

Releasing a new version is mostly automated. For now the [CHANGELOG](https://github.com/axios/axios/blob/master/CHANGELOG.md) requires being updated manually. Once this has been done run the commands below. Versions should follow [semantic versioning](http://semver.org/).

- `npm version <newversion> -m "Releasing %s"`
- `npm publish`

### Running Examples

Examples are included in part to allow manual testing.

Running example

```bash
$ npm run examples
# Open 127.0.0.1:3000
```

Running sandbox in browser

```bash
$ npm start
# Open 127.0.0.1:3000
```

Running sandbox in terminal

```bash
$ npm start
$ node ./sandbox/client
```
