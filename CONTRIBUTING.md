# Contributing

We are open to, and grateful for, any contributions made by the community. By contributing to axios, you agree to abide by the [code of conduct](https://github.com/axios/axios/blob/master/CODE_OF_CONDUCT.md).

## Code Style

Please follow the [node style guide](https://github.com/felixge/node-style-guide).

## Commit Messages

Please follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)

## Testing

Please update the tests to reflect your code changes. Pull requests will not be accepted if they are failing on GitHub actions.

## Documentation

Please update the [docs](README.md) accordingly so that there are no discrepancies between the API and the documentation.

## Developing

- `grunt test` run the jasmine and mocha tests
- `grunt build` run webpack and bundle the source
- `grunt version` prepare the code for release

Please don't include changes to `dist/` in your pull request. This should only be updated when releasing a new version.

## Running Examples

Examples are included in part to allow manual testing.

Running example

```bash
> npm run examples
# Open 127.0.0.1:3000
```

Running sandbox in browser

```bash
> npm start
# Open 127.0.0.1:3000
```

Running sandbox in terminal

```bash
> npm start
> node ./sandbox/client
```
