// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { DefaultTheme, SiteData, Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import SecurityUpdatesBanner from './SecurityUpdatesBanner.vue'
import BlogPostMeta from './BlogPostMeta.vue'
import { data as blogPosts } from '../../blog/posts.data'
import './style.css'

// Fill the blog sidebar with "All posts" and every published post, newest
// first. It comes from the same data loader as the blog index, so drafts and
// titles always match it. This replaces the group's items rather than
// appending, because enhanceApp runs once per page during the build.
function fillBlogSidebar(siteData: SiteData<DefaultTheme.Config>) {
  const sidebar = siteData.locales.root?.themeConfig?.sidebar
  if (!sidebar || Array.isArray(sidebar)) return
  const group = (sidebar['/blog/'] as DefaultTheme.SidebarItem[] | undefined)?.[0]
  if (!group) return
  group.items = [
    { text: 'All posts', link: '/blog/' },
    ...blogPosts.map((post) => ({ text: post.title, link: post.url }))
  ]
}

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-before': () => h(SecurityUpdatesBanner),
      'doc-before': () => h(BlogPostMeta)
    })
  },
  enhanceApp({ siteData }) {
    fillBlogSidebar(siteData.value)
  }
} satisfies Theme
