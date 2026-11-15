---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
search: false

hero:
  name: 'axios docs'
  text: 'axios est un client HTTP simple pour le navigateur et Node.js'
  image:
    dark: /logo.svg
    light: /logo-light.svg
    alt: axios
  actions:
    - theme: brand
      text: Démarrer
      link: /fr/pages/getting-started/first-steps
    - theme: alt
      text: Référence API
      link: /fr/pages/advanced/api-reference

features:
  - title: Implémentation simple
    details: Démarrer avec axios est aussi simple qu'une seule ligne de code. Les requêtes API basiques peuvent être effectuées en 2 lignes de code.
  - title: Intercepteurs puissants
    details: Notre système d'intercepteurs innovant vous permet de contrôler le cycle de vie des requêtes et des réponses. Vous pouvez modifier les requêtes, les réponses et les erreurs.
  - title: Support TypeScript
    details: axios déclare des types et supporte pleinement TypeScript. Vous pouvez utiliser axios en toute confiance dans vos projets TypeScript.
---

<script setup>
import HomeSponsorsCarousel from '../.vitepress/theme/HomeSponsorsCarousel.vue';
import PartnersGrid from '../.vitepress/theme/PartnersGrid.vue';
</script>

<div style="margin: 0 auto; max-width: 1200px;">
  <h3 style="line-height: 64px;font-size: 28px;letter-spacing: -0.4px;font-weight: 600;margin-top: 2rem;">Sponsors</h3>
  <p style="color: var(--vp-c-text-2);">axios est libre et open source grâce aux entreprises et aux particuliers qui sponsorisent son développement. Vous souhaitez soutenir le projet ? Devenez sponsor sur <a href="https://opencollective.com/axios" target="_blank" rel="noopener noreferrer">Open Collective</a>.</p>
</div>

<HomeSponsorsCarousel />

<div style="margin: 0 auto; max-width: 1200px;">
  <h3 style="line-height: 64px;font-size: 28px;letter-spacing: -0.4px;font-weight: 600;margin-top: 2rem;">Partenaires</h3>
  <p style="color: var(--vp-c-text-2);">Nos partenaires fournissent les outils et services qui nous aident à développer, sécuriser et maintenir axios, de l'infrastructure CI et la sécurité de la chaîne d'approvisionnement à la revue de code et au support à long terme.</p>
  <PartnersGrid :columns="5" />
</div>
