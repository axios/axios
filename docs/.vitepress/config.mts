import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: 'axios | Promise based HTTP client',
  description: 'Documentation for the axios HTTP project',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
  ],
  themeConfig: {
    logo: {
      dark: '/words.svg',
      light: '/words-light.svg',
    },
    siteTitle: false,
    nav: [
      { text: 'Guide', link: '/pages/getting-started/first-steps' },
      { text: 'API', link: '/pages/advanced/api-reference' },
      { text: 'Sponsors', link: '/pages/misc/sponsors' },
      { text: 'v1.x', link: '#' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'First steps', link: '/pages/getting-started/first-steps' },
          { text: 'Features', link: '/pages/getting-started/features' },
          {
            text: 'Examples',
            items: [
              {
                text: 'JavaScript',
                link: '/pages/getting-started/examples/commonjs',
              },
              {
                text: 'TypeScript',
                link: '/pages/getting-started/examples/typescript',
              },
            ],
          },
          {
            text: 'Upgrade guide v0.x -> v1.x',
            link: '/pages/getting-started/upgrade-guide',
          },
        ],
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Public API', link: '/pages/advanced/api-reference' },
          {
            text: 'Request method aliases',
            link: '/pages/advanced/request-method-aliases',
          },
          {
            text: 'Creating an instance',
            link: '/pages/advanced/create-an-instance',
          },
          { text: 'Request config', link: '/pages/advanced/request-config' },
          { text: 'Adapters', link: '/pages/advanced/adapters' },
          { text: 'Response schema', link: '/pages/advanced/response-schema' },
          { text: 'Config defaults', link: '/pages/advanced/config-defaults' },
          { text: 'Interceptors', link: '/pages/advanced/interceptors' },
          { text: 'Error handling', link: '/pages/advanced/error-handling' },
          { text: 'Cancellation', link: '/pages/advanced/cancellation' },
          { text: 'Authentication', link: '/pages/advanced/authentication' },
          { text: 'Retry & error recovery', link: '/pages/advanced/retry' },
          { text: 'Testing', link: '/pages/advanced/testing' },
          {
            text: 'x-www-form-urlencoded format',
            link: '/pages/advanced/x-www-form-urlencoded-format',
          },
          {
            text: 'Multipart/form-data format',
            link: '/pages/advanced/multipart-form-data-format',
          },
          { text: 'File posting', link: '/pages/advanced/file-posting' },
          {
            text: 'HTML form processing 🔥',
            link: '/pages/advanced/html-form-processing',
          },
          {
            text: 'Progress capturing 🔥',
            link: '/pages/advanced/progress-capturing',
          },
          { text: 'Rate limiting 🔥', link: '/pages/advanced/rate-limiting' },
          {
            text: 'Headers 🔥',
            items: [
              {
                text: 'General usage',
                link: '/pages/advanced/headers',
              },
              {
                text: 'Methods',
                link: '/pages/advanced/header-methods',
              },
            ],
          },
          {
            text: 'Fetch adapter 🔥',
            link: '/pages/advanced/fetch-adapter',
          },
          { text: 'HTTP2 🔥', link: '/pages/advanced/http2' },
          { text: 'Promises', link: '/pages/advanced/promises' },
          { text: 'TypeScript', link: '/pages/advanced/type-script' },
        ],
      },
      {
        text: 'Miscellaneous',
        items: [
          { text: 'SemVer', link: '/pages/misc/semver' },
          { text: 'Security', link: '/pages/misc/security' },
        ],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/axios/axios' }],
    footer: {
      message: 'axios is provided under MIT license',
      copyright: 'Copyright © 2015-present axios collective',
    },
  },
});
