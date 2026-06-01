# Contributing

We accept community contributions. By contributing to axios, you agree to follow the [code of conduct](https://github.com/axios/axios/blob/master/CODE_OF_CONDUCT.md).

## Code style

Follow the [node style guide](https://github.com/felixge/node-style-guide).

## Commit messages

Follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/).

## Testing

Update tests for your changes. Pull requests must pass GitHub Actions.

## Documentation

Update the [documentation](https://axios-http.com/docs/intro) when the API changes, so the API and docs stay in sync.

## Developing

- `npm run test` runs the Jasmine and Mocha tests
- `npm run build` runs Rollup and bundles the source
- `npm run version` prepares the code for release

## Running examples

Use the examples for manual testing.

Run the examples:

```bash
> npm run examples
# Open 127.0.0.1:3000
```

Run the browser sandbox:

```bash
> npm start
# Open 127.0.0.1:3000
```

Run the terminal sandbox:

```bash
> npm start
> node ./sandbox/client
```
