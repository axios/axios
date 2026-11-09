import axios = require('axios');

const headers = new axios.AxiosHeaders();

declare const optionalRegex: RegExp | undefined;
declare const optionalParser: ((value: axios.AxiosHeaderValue) => number) | undefined;
declare const tokenOrParser: true | ((value: axios.AxiosHeaderValue) => number);
declare const parser: RegExp | true | ((value: axios.AxiosHeaderValue) => number) | undefined;

for (const name of ['getContentEncoding', 'getAcceptEncoding'] as const) {
  const optionalMatches: axios.AxiosHeaderValue | RegExpExecArray | undefined =
    headers[name](optionalRegex);
  const optionalParsed: axios.AxiosHeaderValue | number | undefined = headers[name](optionalParser);
  const parsedOrTokens: number | Record<string, string | undefined> | undefined =
    headers[name](tokenOrParser);
  const result:
    axios.AxiosHeaderValue | RegExpExecArray | Record<string, string | undefined> | undefined =
    headers[name](parser);

  // @ts-expect-error -- a union parser does not always return a string
  const invalidParsed: string = headers[name](tokenOrParser);
  // @ts-expect-error -- a union parser can return a token map
  const invalidResult: axios.AxiosHeaderValue | RegExpExecArray | undefined = headers[name](parser);

  const tokens = headers[name](true);
  if (tokens) {
    const gzip: string | undefined = tokens.gzip;
  }

  // @ts-expect-error -- an absent header has no token map
  Object.keys(headers[name](true));
  // @ts-expect-error -- an absent header does not invoke the custom parser
  headers[name]((value) => ({ value })).value;
  // @ts-expect-error -- an absent header returns undefined without a parser
  const value: axios.AxiosHeaderValue = headers[name]();
  // @ts-expect-error -- an absent header returns undefined with a regex parser
  const matches: RegExpExecArray | null = headers[name](/gzip/);
}
