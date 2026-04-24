import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config

// ─── English ─────────────────────────────────────────────────────────────────

const enNav = [
  { text: 'Guide', link: '/pages/getting-started/first-steps' },
  { text: 'API', link: '/pages/advanced/api-reference' },
  { text: 'Sponsors', link: '/pages/misc/sponsors' },
  { text: 'v1.x', link: '#' },
];

const enSidebar = [
  {
    text: 'Getting Started',
    items: [
      { text: 'First steps', link: '/pages/getting-started/first-steps' },
      { text: 'Features', link: '/pages/getting-started/features' },
      {
        text: 'Examples',
        items: [
          { text: 'JavaScript', link: '/pages/getting-started/examples/commonjs' },
          { text: 'TypeScript', link: '/pages/getting-started/examples/typescript' },
        ],
      },
      { text: 'Upgrade guide v0.x -> v1.x', link: '/pages/getting-started/upgrade-guide' },
    ],
  },
  {
    text: 'Advanced',
    items: [
      { text: 'Public API', link: '/pages/advanced/api-reference' },
      { text: 'Request method aliases', link: '/pages/advanced/request-method-aliases' },
      { text: 'Creating an instance', link: '/pages/advanced/create-an-instance' },
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
      { text: 'Multipart/form-data format', link: '/pages/advanced/multipart-form-data-format' },
      { text: 'File posting', link: '/pages/advanced/file-posting' },
      { text: 'HTML form processing 🔥', link: '/pages/advanced/html-form-processing' },
      { text: 'Progress capturing 🔥', link: '/pages/advanced/progress-capturing' },
      { text: 'Rate limiting 🔥', link: '/pages/advanced/rate-limiting' },
      {
        text: 'Headers 🔥',
        items: [
          { text: 'General usage', link: '/pages/advanced/headers' },
          { text: 'Methods', link: '/pages/advanced/header-methods' },
        ],
      },
      { text: 'Fetch adapter 🔥', link: '/pages/advanced/fetch-adapter' },
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
];

// ─── Mandarin Chinese ─────────────────────────────────────────────────────────

const zhNav = [
  { text: '指南', link: '/zh/pages/getting-started/first-steps' },
  { text: 'API', link: '/zh/pages/advanced/api-reference' },
  { text: '赞助商', link: '/zh/pages/misc/sponsors' },
  { text: 'v1.x', link: '#' },
];

const zhSidebar = [
  {
    text: '入门指南',
    items: [
      { text: '第一步', link: '/zh/pages/getting-started/first-steps' },
      { text: '功能特性', link: '/zh/pages/getting-started/features' },
      {
        text: '示例',
        items: [
          { text: 'JavaScript', link: '/zh/pages/getting-started/examples/commonjs' },
          { text: 'TypeScript', link: '/zh/pages/getting-started/examples/typescript' },
        ],
      },
      { text: '升级指南 v0.x -> v1.x', link: '/zh/pages/getting-started/upgrade-guide' },
    ],
  },
  {
    text: '进阶',
    items: [
      { text: '公共 API', link: '/zh/pages/advanced/api-reference' },
      { text: '请求方法别名', link: '/zh/pages/advanced/request-method-aliases' },
      { text: '创建实例', link: '/zh/pages/advanced/create-an-instance' },
      { text: '请求配置', link: '/zh/pages/advanced/request-config' },
      { text: '适配器', link: '/zh/pages/advanced/adapters' },
      { text: '响应结构', link: '/zh/pages/advanced/response-schema' },
      { text: '默认配置', link: '/zh/pages/advanced/config-defaults' },
      { text: '拦截器', link: '/zh/pages/advanced/interceptors' },
      { text: '错误处理', link: '/zh/pages/advanced/error-handling' },
      { text: '取消请求', link: '/zh/pages/advanced/cancellation' },
      { text: '身份验证', link: '/zh/pages/advanced/authentication' },
      { text: '重试与错误恢复', link: '/zh/pages/advanced/retry' },
      { text: '测试', link: '/zh/pages/advanced/testing' },
      {
        text: 'x-www-form-urlencoded 格式',
        link: '/zh/pages/advanced/x-www-form-urlencoded-format',
      },
      { text: 'Multipart/form-data 格式', link: '/zh/pages/advanced/multipart-form-data-format' },
      { text: '文件上传', link: '/zh/pages/advanced/file-posting' },
      { text: 'HTML 表单处理 🔥', link: '/zh/pages/advanced/html-form-processing' },
      { text: '进度捕获 🔥', link: '/zh/pages/advanced/progress-capturing' },
      { text: '速率限制 🔥', link: '/zh/pages/advanced/rate-limiting' },
      {
        text: '请求头 🔥',
        items: [
          { text: '基本用法', link: '/zh/pages/advanced/headers' },
          { text: '方法', link: '/zh/pages/advanced/header-methods' },
        ],
      },
      { text: 'Fetch 适配器 🔥', link: '/zh/pages/advanced/fetch-adapter' },
      { text: 'HTTP2 🔥', link: '/zh/pages/advanced/http2' },
      { text: 'Promises', link: '/zh/pages/advanced/promises' },
      { text: 'TypeScript', link: '/zh/pages/advanced/type-script' },
    ],
  },
  {
    text: '其他',
    items: [
      { text: '语义化版本', link: '/zh/pages/misc/semver' },
      { text: '安全', link: '/zh/pages/misc/security' },
    ],
  },
];

// ─── Spanish ──────────────────────────────────────────────────────────────────

const esNav = [
  { text: 'Guía', link: '/es/pages/getting-started/first-steps' },
  { text: 'API', link: '/es/pages/advanced/api-reference' },
  { text: 'Patrocinadores', link: '/es/pages/misc/sponsors' },
  { text: 'v1.x', link: '#' },
];

const esSidebar = [
  {
    text: 'Primeros pasos',
    items: [
      { text: 'Inicio', link: '/es/pages/getting-started/first-steps' },
      { text: 'Características', link: '/es/pages/getting-started/features' },
      {
        text: 'Ejemplos',
        items: [
          { text: 'JavaScript', link: '/es/pages/getting-started/examples/commonjs' },
          { text: 'TypeScript', link: '/es/pages/getting-started/examples/typescript' },
        ],
      },
      {
        text: 'Guía de actualización v0.x -> v1.x',
        link: '/es/pages/getting-started/upgrade-guide',
      },
    ],
  },
  {
    text: 'Avanzado',
    items: [
      { text: 'API pública', link: '/es/pages/advanced/api-reference' },
      { text: 'Alias de métodos de solicitud', link: '/es/pages/advanced/request-method-aliases' },
      { text: 'Crear una instancia', link: '/es/pages/advanced/create-an-instance' },
      { text: 'Configuración de solicitud', link: '/es/pages/advanced/request-config' },
      { text: 'Adaptadores', link: '/es/pages/advanced/adapters' },
      { text: 'Esquema de respuesta', link: '/es/pages/advanced/response-schema' },
      { text: 'Configuración predeterminada', link: '/es/pages/advanced/config-defaults' },
      { text: 'Interceptores', link: '/es/pages/advanced/interceptors' },
      { text: 'Manejo de errores', link: '/es/pages/advanced/error-handling' },
      { text: 'Cancelación', link: '/es/pages/advanced/cancellation' },
      { text: 'Autenticación', link: '/es/pages/advanced/authentication' },
      { text: 'Reintento y recuperación de errores', link: '/es/pages/advanced/retry' },
      { text: 'Pruebas', link: '/es/pages/advanced/testing' },
      {
        text: 'Formato x-www-form-urlencoded',
        link: '/es/pages/advanced/x-www-form-urlencoded-format',
      },
      {
        text: 'Formato Multipart/form-data',
        link: '/es/pages/advanced/multipart-form-data-format',
      },
      { text: 'Publicación de archivos', link: '/es/pages/advanced/file-posting' },
      {
        text: 'Procesamiento de formularios HTML 🔥',
        link: '/es/pages/advanced/html-form-processing',
      },
      { text: 'Captura de progreso 🔥', link: '/es/pages/advanced/progress-capturing' },
      { text: 'Limitación de velocidad 🔥', link: '/es/pages/advanced/rate-limiting' },
      {
        text: 'Cabeceras 🔥',
        items: [
          { text: 'Uso general', link: '/es/pages/advanced/headers' },
          { text: 'Métodos', link: '/es/pages/advanced/header-methods' },
        ],
      },
      { text: 'Adaptador Fetch 🔥', link: '/es/pages/advanced/fetch-adapter' },
      { text: 'HTTP2 🔥', link: '/es/pages/advanced/http2' },
      { text: 'Promesas', link: '/es/pages/advanced/promises' },
      { text: 'TypeScript', link: '/es/pages/advanced/type-script' },
    ],
  },
  {
    text: 'Miscelánea',
    items: [
      { text: 'SemVer', link: '/es/pages/misc/semver' },
      { text: 'Seguridad', link: '/es/pages/misc/security' },
    ],
  },
];

// ─── French ───────────────────────────────────────────────────────────────────

const frNav = [
  { text: 'Guide', link: '/fr/pages/getting-started/first-steps' },
  { text: 'API', link: '/fr/pages/advanced/api-reference' },
  { text: 'Sponsors', link: '/fr/pages/misc/sponsors' },
  { text: 'v1.x', link: '#' },
];

const frSidebar = [
  {
    text: 'Démarrage',
    items: [
      { text: 'Premiers pas', link: '/fr/pages/getting-started/first-steps' },
      { text: 'Fonctionnalités', link: '/fr/pages/getting-started/features' },
      {
        text: 'Exemples',
        items: [
          { text: 'JavaScript', link: '/fr/pages/getting-started/examples/commonjs' },
          { text: 'TypeScript', link: '/fr/pages/getting-started/examples/typescript' },
        ],
      },
      {
        text: 'Guide de mise à niveau v0.x -> v1.x',
        link: '/fr/pages/getting-started/upgrade-guide',
      },
    ],
  },
  {
    text: 'Avancé',
    items: [
      { text: 'API publique', link: '/fr/pages/advanced/api-reference' },
      { text: 'Alias des méthodes de requête', link: '/fr/pages/advanced/request-method-aliases' },
      { text: 'Créer une instance', link: '/fr/pages/advanced/create-an-instance' },
      { text: 'Configuration des requêtes', link: '/fr/pages/advanced/request-config' },
      { text: 'Adaptateurs', link: '/fr/pages/advanced/adapters' },
      { text: 'Schéma de réponse', link: '/fr/pages/advanced/response-schema' },
      { text: 'Configuration par défaut', link: '/fr/pages/advanced/config-defaults' },
      { text: 'Intercepteurs', link: '/fr/pages/advanced/interceptors' },
      { text: 'Gestion des erreurs', link: '/fr/pages/advanced/error-handling' },
      { text: 'Annulation', link: '/fr/pages/advanced/cancellation' },
      { text: 'Authentification', link: '/fr/pages/advanced/authentication' },
      { text: "Nouvelles tentatives et récupération d'erreurs", link: '/fr/pages/advanced/retry' },
      { text: 'Tests', link: '/fr/pages/advanced/testing' },
      {
        text: 'Format x-www-form-urlencoded',
        link: '/fr/pages/advanced/x-www-form-urlencoded-format',
      },
      { text: 'Format Multipart/form-data', link: '/fr/pages/advanced/multipart-form-data-format' },
      { text: 'Envoi de fichiers', link: '/fr/pages/advanced/file-posting' },
      {
        text: 'Traitement des formulaires HTML 🔥',
        link: '/fr/pages/advanced/html-form-processing',
      },
      { text: 'Capture de la progression 🔥', link: '/fr/pages/advanced/progress-capturing' },
      { text: 'Limitation du débit 🔥', link: '/fr/pages/advanced/rate-limiting' },
      {
        text: 'En-têtes 🔥',
        items: [
          { text: 'Utilisation générale', link: '/fr/pages/advanced/headers' },
          { text: 'Méthodes', link: '/fr/pages/advanced/header-methods' },
        ],
      },
      { text: 'Adaptateur Fetch 🔥', link: '/fr/pages/advanced/fetch-adapter' },
      { text: 'HTTP2 🔥', link: '/fr/pages/advanced/http2' },
      { text: 'Promesses', link: '/fr/pages/advanced/promises' },
      { text: 'TypeScript', link: '/fr/pages/advanced/type-script' },
    ],
  },
  {
    text: 'Divers',
    items: [
      { text: 'SemVer', link: '/fr/pages/misc/semver' },
      { text: 'Sécurité', link: '/fr/pages/misc/security' },
    ],
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────

export default defineConfig({
  title: 'axios | Promise based HTTP client',
  description: 'Documentation for the axios HTTP project',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' }],
    ['link', { rel: 'manifest', href: '/site.webmanifest' }],
  ],
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
      },
    },
    zh: {
      label: '中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
      },
    },
    es: {
      label: 'Español',
      lang: 'es-ES',
      themeConfig: {
        nav: esNav,
        sidebar: esSidebar,
      },
    },
    fr: {
      label: 'Français',
      lang: 'fr-FR',
      themeConfig: {
        nav: frNav,
        sidebar: frSidebar,
      },
    },
  },
  themeConfig: {
    logo: {
      dark: '/words.svg',
      light: '/words-light.svg',
    },
    siteTitle: false,
    socialLinks: [{ icon: 'github', link: 'https://github.com/axios/axios' }],
    footer: {
      message: 'axios is provided under MIT license',
      copyright: 'Copyright © 2015-present axios collective',
    },
  },
});
