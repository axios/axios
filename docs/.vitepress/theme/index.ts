// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import SecurityUpdatesBanner from './SecurityUpdatesBanner.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-before': () => h(SecurityUpdatesBanner)
    })
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  }
} satisfies Theme
