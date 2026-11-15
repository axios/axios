---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
search: false

hero:
  name: 'axios docs'
  text: 'axios is a simple HTTP client for the browser and Node.js'
  image:
    dark: /logo.svg
    light: /logo-light.svg
    alt: axios
  actions:
    - theme: brand
      text: Get started
      link: /pages/getting-started/first-steps
    - theme: alt
      text: API reference
      link: /pages/advanced/api-reference

features:
  - title: Simple implementation
    details: Getting started with axios is as simple as a single line of code. Making simple API requests can be done in 2 lines of code.
  - title: Powerful interceptors
    details: Our innovative interceptor system allows you to control the request and response lifecycle. You can modify requests, responses, and errors.
  - title: TypeScript support
    details: axios declares types and has full support for TypeScript. This means you can use axios with confidence in your TypeScript projects.
---

<script setup>
import HomeSponsorsCarousel from './.vitepress/theme/HomeSponsorsCarousel.vue';
import PartnersGrid from './.vitepress/theme/PartnersGrid.vue';
</script>

<div style="margin: 0 auto; max-width: 1200px;">
  <h3 style="line-height: 64px;font-size: 28px;letter-spacing: -0.4px;font-weight: 600;margin-top: 2rem;">Sponsors</h3>
  <p style="color: var(--vp-c-text-2);">axios is free and open source thanks to the companies and individuals who sponsor its development. Want to support the project? Become a sponsor on <a href="https://opencollective.com/axios" target="_blank" rel="noopener noreferrer">Open Collective</a>.</p>
</div>

<HomeSponsorsCarousel />

<div style="margin: 0 auto; max-width: 1200px;">
  <h3 style="line-height: 64px;font-size: 28px;letter-spacing: -0.4px;font-weight: 600;margin-top: 2rem;">Partners</h3>
  <p style="color: var(--vp-c-text-2);">Our partners provide the tools and services that help us build, secure, and maintain axios, from CI infrastructure and supply chain security to code review and long-term support.</p>
  <PartnersGrid :columns="5" />
</div>
