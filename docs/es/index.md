---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
search: false

hero:
  name: 'axios docs'
  text: 'axios es un cliente HTTP simple para el navegador y Node.js'
  image:
    dark: /logo.svg
    light: /logo-light.svg
    alt: axios
  actions:
    - theme: brand
      text: Comenzar
      link: /es/pages/getting-started/first-steps
    - theme: alt
      text: Referencia de API
      link: /es/pages/advanced/api-reference

features:
  - title: Implementación sencilla
    details: Comenzar con axios es tan simple como una sola línea de código. Las solicitudes API básicas se pueden realizar en 2 líneas de código.
  - title: Interceptores potentes
    details: Nuestro innovador sistema de interceptores le permite controlar el ciclo de vida de solicitudes y respuestas. Puede modificar solicitudes, respuestas y errores.
  - title: Soporte para TypeScript
    details: axios declara tipos y tiene soporte completo para TypeScript. Esto significa que puede usar axios con confianza en sus proyectos TypeScript.
---

<script setup>
import HomeSponsorsCarousel from '../.vitepress/theme/HomeSponsorsCarousel.vue';
import PartnersGrid from '../.vitepress/theme/PartnersGrid.vue';
</script>

<div style="margin: 0 auto; max-width: 1200px;">
  <h3 style="line-height: 64px;font-size: 28px;letter-spacing: -0.4px;font-weight: 600;margin-top: 2rem;">Patrocinadores</h3>
  <p style="color: var(--vp-c-text-2);">axios es libre y de código abierto gracias a las empresas y personas que patrocinan su desarrollo. ¿Quieres apoyar el proyecto? Hazte patrocinador en <a href="https://opencollective.com/axios" target="_blank" rel="noopener noreferrer">Open Collective</a>.</p>
</div>

<HomeSponsorsCarousel />

<div style="margin: 0 auto; max-width: 1200px;">
  <h3 style="line-height: 64px;font-size: 28px;letter-spacing: -0.4px;font-weight: 600;margin-top: 2rem;">Socios</h3>
  <p style="color: var(--vp-c-text-2);">Nuestros socios ofrecen las herramientas y los servicios que nos ayudan a desarrollar, proteger y mantener axios, desde la infraestructura de CI y la seguridad de la cadena de suministro hasta la revisión de código y el soporte a largo plazo.</p>
  <PartnersGrid :columns="5" />
</div>
