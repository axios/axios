import axios, { AxiosRequestConfig } from 'axios';

type FetchOptions = NonNullable<AxiosRequestConfig['fetchOptions']>;

// Model Next.js-style global augmentation without depending on a framework.
declare global {
  interface RequestInit {
    next?: { revalidate?: number | false; tags?: string[] };
  }
}

declare const dispatcher: { dispatch(options: object, handler: object): boolean };
declare const standardOptions: RequestInit;

// Interfaces without index signatures must remain assignable too.
interface ProviderOptions {
  dispatcher: typeof dispatcher;
  vendorOptions: { retries: number };
}

declare const providerOptions: ProviderOptions;

const configs: AxiosRequestConfig[] = [
  { fetchOptions: undefined },
  { fetchOptions: {} },
  { fetchOptions: standardOptions },
  { fetchOptions: providerOptions },
  { fetchOptions: { dispatcher } },
  {
    fetchOptions: {
      cache: 'no-store',
      credentials: 'include',
      redirect: 'manual',
      keepalive: true,
      dispatcher,
      vendorOptions: { retries: 2 },
      next: { revalidate: 60, tags: ['users'] },
    },
  },
];

configs.forEach((config) => {
  axios.get('/users', { ...config, adapter: 'fetch' });
  axios.create(config);
});

const options: FetchOptions = { next: { revalidate: false } };
options.cache = 'reload';
options.keepalive = false;
options.dispatcher = dispatcher;

// Provider extensions must not bypass checking of known fields.
// @ts-expect-error -- cache must be a RequestCache, even alongside a provider option.
const badCache: FetchOptions = { cache: 123, dispatcher };
// @ts-expect-error -- redirect accepts only the standard literals.
const badRedirect: FetchOptions = { redirect: 'sideways' };
// @ts-expect-error -- keepalive must be a boolean.
const badKeepalive: FetchOptions = { keepalive: 'true' };
// @ts-expect-error -- Fields added by global augmentation retain their types.
const badNext: FetchOptions = { next: { revalidate: 'never' }, dispatcher };
// @ts-expect-error -- Known properties must not be widened to any when reading.
const numericCache: number = options.cache;
// @ts-expect-error -- Known properties must also be checked on later assignment.
options.redirect = 'sideways';
