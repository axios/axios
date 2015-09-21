# Contributing

### Code Style

Please follow the [node style guide](https://github.com/felixge/node-style-guide).

### Commit Messages

Commit messages should be verb based.

- `Fixing ...`
- `Adding ...`
- `Updating ...`
- `Removing ...`

### Testing

Please update the tests to reflect your code changes. Pull requests will not be accepted if they are failing on [Travis CI](https://travis-ci.org/mzabriskie/axios).

### Documentation

Please update the docs accordingly so that there are no discrepencies between the API and the documentation.

### Developing

- `grunt test` run the jasmine and nodeunit tests
- `grunt build` run webpack and bundle the source
- `grunt publish` prepare the code for release
- `grunt watch:test` watch for changes and run `test`
- `grunt watch:build` watch for changes and run `build`

Please don't include changes to `dist/` in your pull request. This should only be updated when releasing a new version.

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
