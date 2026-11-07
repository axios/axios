import { AxiosHeaders, type AxiosHeaderValue } from 'axios';

const headers = new AxiosHeaders();

for (const name of ['getContentEncoding', 'getAcceptEncoding'] as const) {
  const tokens = headers[name](true);
  if (tokens) {
    const gzip: string | undefined = tokens.gzip;
  }

  // @ts-expect-error -- an absent header has no token map
  Object.keys(headers[name](true));
  // @ts-expect-error -- an absent header does not invoke the custom parser
  headers[name]((value) => ({ value })).value;
  // @ts-expect-error -- an absent header returns undefined without a parser
  const value: AxiosHeaderValue = headers[name]();
  // @ts-expect-error -- an absent header returns undefined with a regex parser
  const matches: RegExpExecArray | null = headers[name](/gzip/);
}
