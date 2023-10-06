# Contributing

We appreciate and welcome contributions from the community. By contributing to Axios, you agree to adhere to our [Code of Conduct](https://github.com/axios/axios/blob/master/CODE_OF_CONDUCT.md).

## Code Style

To maintain code consistency, please follow the [Node.js Style Guide](https://github.com/felixge/node-style-guide).

## Commit Messages

For clean and organized version control history, we follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) convention.

## Testing

Ensure that your changes pass all tests. Pull requests will only be accepted if they pass successfully on GitHub Actions.

## Documentation

Keep the documentation up to date by making the necessary updates in the [README](README.md). This ensures alignment between the API and the documentation.

## Development

To contribute effectively, you can use the following commands:

- `grunt test`: Run Jasmine and Mocha tests.
- `grunt build`: Use Webpack to bundle the source code.
- `grunt version`: Prepare the code for a release.

Please avoid making changes to the `dist/` directory in your pull request. It should only be updated when releasing a new version.

## Running Examples

Examples are included for manual testing purposes. Here's how to run them:

To start the example server:

```bash
npm run examples
# Access at 127.0.0.1:3000
```

To run the browser sandbox:

```bash
npm start
# Access at 127.0.0.1:3000
```

To run the terminal-based sandbox:

```bash
npm start
node ./sandbox/client
```
