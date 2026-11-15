---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
search: false

hero:
  name: 'axios 文档'
  text: 'axios 是一个基于 Promise 的简单 HTTP 客户端，适用于浏览器和 Node.js'
  image:
    dark: /logo.svg
    light: /logo-light.svg
    alt: axios
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/pages/getting-started/first-steps
    - theme: alt
      text: API 参考
      link: /zh/pages/advanced/api-reference

features:
  - title: 简单易用
    details: axios 上手极为简单，一行代码即可完成初始化。最基本的 API 请求仅需 2 行代码。
  - title: 强大的拦截器
    details: 创新的拦截器系统让您可以完全掌控请求和响应的生命周期，支持修改请求、响应及错误。
  - title: TypeScript 支持
    details: axios 提供完整的类型声明，全面支持 TypeScript，让您可以在 TypeScript 项目中放心使用。
---

<script setup>
import HomeSponsorsCarousel from '../.vitepress/theme/HomeSponsorsCarousel.vue';
import PartnersGrid from '../.vitepress/theme/PartnersGrid.vue';
</script>

<div style="margin: 0 auto; max-width: 1200px;">
  <h3 style="line-height: 64px;font-size: 28px;letter-spacing: -0.4px;font-weight: 600;margin-top: 2rem;">赞助商</h3>
  <p style="color: var(--vp-c-text-2);">axios 能够保持免费开源，离不开赞助其开发的公司和个人。想支持本项目？欢迎在 <a href="https://opencollective.com/axios" target="_blank" rel="noopener noreferrer">Open Collective</a> 上成为赞助者。</p>
</div>

<HomeSponsorsCarousel />

<div style="margin: 0 auto; max-width: 1200px;">
  <h3 style="line-height: 64px;font-size: 28px;letter-spacing: -0.4px;font-weight: 600;margin-top: 2rem;">合作伙伴</h3>
  <p style="color: var(--vp-c-text-2);">我们的合作伙伴提供帮助我们构建、保护和维护 axios 的工具与服务，涵盖 CI 基础设施、供应链安全、代码审查以及长期支持。</p>
  <PartnersGrid :columns="5" />
</div>
