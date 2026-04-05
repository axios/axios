---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

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
import Splide from '@splidejs/splide';
import { onMounted } from 'vue';
import allSponsors from './data/sponsors.json';

onMounted(() => {
  new Splide(
    '.splide',
    {
      type: 'loop',
      autoplay: true,
      interval: 3000,
      perPage: 5,
      perMove: 1,
      gap: 10,
      snap: true,
      pagination: false,
      breakpoints: {
        1200: {
          perPage: 4,
        },
        960: {
          perPage: 3,
        },
        640: {
          perPage: 2,
        },
        480: {
          perPage: 1,
        },
      },
    }
  ).mount();
});

const activeGoldSponsors = allSponsors.gold.filter((sponsor) => sponsor.active);
const activeSilverSponsors = allSponsors.silver.filter((sponsor) => sponsor.active);

const sponsors = [...activeGoldSponsors, ...activeSilverSponsors];

const capitalizeFirstLetter = (word) => {
  return String(word).charAt(0).toUpperCase() + String(word).slice(1);
};
</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css">

<div style="margin: 0 auto; max-width: 1200px;">
  <h3 style="line-height: 64px;font-size: 28px;letter-spacing: -0.4px;font-weight: 600;margin-top: 2rem;">Sponsors</h3>
</div>
<div v-if="sponsors.length > 0" :class="$style.container" class="splide">
  <div class="splide__track">
    <div role="list" class="splide__list">
      <div v-for="(sponsor, key) in sponsors" :key="sponsor.name" :class="$style.cardWrapper" :style="key === 0 ? 'margin-left: 0.5rem' : key === sponsors.length - 1 ? 'margin-right: 0.5rem' : ''" class="splide__slide">
        <div :class="$style.imgWrapper">
          <img :class="$style.img" :src="sponsor.imageUrl" alt="" />
        </div>
        <div style="padding-left: 0.5rem; padding-right: 0.5rem; height: 100%;">
          <p :class="$style.heading">{{ sponsor.name }}</p>
          <dl :class="$style.cardDl">
            <dd style="margin-top: 0.75rem; margin-inline-start: 0px;">
              <span :class="$style[`tagSponsor${capitalizeFirstLetter(sponsor.tier)}`]">{{ capitalizeFirstLetter(sponsor.tier) }}</span>
            </dd>
          </dl>
        </div>
        <div>
          <div :class="$style.linksWrapper">
            <div :class="$style.link">
              <a :href="sponsor.website" :class="$style.rightLink" target="_blank">
                <div :class="$style.linkIcon">
                  <svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525"></path>
                  </svg>
                </div>
              </a>
            </div>
            <div v-if="sponsor.twitter" :class="$style.link" style="margin-left: -1px;">
              <a :href="sponsor.twitter" :class="$style.leftLink" target="_blank">
                <div :class="$style.linkIcon">
                  <svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" fill="currentColor" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" viewBox="0 0 512 462.799"><path fill-rule="nonzero" d="M403.229 0h78.506L310.219 196.04 512 462.799H354.002L230.261 301.007 88.669 462.799h-78.56l183.455-209.683L0 0h161.999l111.856 147.88L403.229 0zm-27.556 415.805h43.505L138.363 44.527h-46.68l283.99 371.278z"/></svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style module>
.container {
  display: flex;
  margin: 0 auto;
  max-width: 1200px;
}

.cardWrapper {
  display: flex;
  flex-direction: column;
  grid-column: span 1 / span 1;
  border-radius: 0.5rem;
  border: 1px solid var(--vp-c-gutter) !important;
  text-align: center;
  background-color: var(--card-background-color) !important;
  width: 100%;
  max-width: 11.5rem;
  scroll-snap-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  flex-shrink: 0 !important;
  margin-bottom: 0.5rem !important;
  margin-top: 0.5rem !important;
  margin-left: auto;
  margin-right: auto;
}

.imgWrapper {
  display: flex;
  padding: 1.75rem;
  padding-bottom: 0.75rem;
  flex-direction: column;
  flex: 1 1 0%;
  align-items: center;
  justify-content: center;
}

.img {
  width: 8rem;
  height: 8rem;
}

.heading {
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 3rem;
  margin-top: 1rem !important;
  font-size: 1rem !important;
  line-height: 1.5rem !important;
  font-weight: 600 !important;
  color: var(--vp-c-text-1) !important;
  text-wrap-style: pretty;
  display: -webkit-box;
}

.cardDl {
  display: flex;
  margin-top: 0.25rem;
  flex-direction: column;
  flex-grow: 1;
  justify-content: space-between;
}

.tagSponsorGold {
  display: inline-flex;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  align-items: center;
  border-radius: 9999px;
  box-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  --tw-ring-inset: inset;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
  color: #FFF;
  background-color: #F59E0B;
}

.tagSponsorSilver {
  display: inline-flex; 
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  align-items: center;
  border-radius: 9999px;
  box-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  --tw-ring-inset: inset;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
  color: #FFF;
  background-color: #9CA3AF;
}
.tagSponsorBronze {
  display: inline-flex;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  align-items: center;
  border-radius: 9999px;
  box-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  --tw-ring-inset: inset;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
  color: #FFF;
  background-color: #854D0E;
}

.tagSponsorBacker {
  display: inline-flex;
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  align-items: center;
  border-radius: 9999px;
  box-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  --tw-ring-inset: inset;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
  color: #FFF;
  background-color: #2563EB;
}

.linksWrapper {
  display: flex;
  margin-top: -1px;
}

.link {
  display: flex;
  flex: 1 1 0%;
  width: 0;
}

.rightLink {
  display: inline-flex;
  position: relative;
  padding-top: 1rem;
  padding-bottom: 1rem;
  margin-right: -1px;
  flex: 1 1 0%;
  column-gap: 0.75rem;
  justify-content: center;
  align-items: center;
  border-bottom-left-radius: 0.5rem;
  border-top: 1px;
  border-right: 1px;
  border-left: 0px;
  border-bottom: 0px;
  border-style: solid;
  border-color: var(--vp-c-gutter);
  width: 0; 
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.leftLink {
  display: inline-flex;
  position: relative;
  padding-top: 1rem;
  padding-bottom: 1rem;
  flex: 1 1 0%;
  column-gap: 0.75rem;
  justify-content: center;
  align-items: center;
  border-bottom-right-radius: 0.5rem;
  border-top: 1px;
  border-left: 0px;
  border-bottom: 0px;
  border-right: 0px;
  border-style: solid;
  border-color: var(--vp-c-gutter);
  width: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.linkIcon {
  width: 1.25rem;
  height: 1.25rem;
  color: #9CA3AF;
}
</style>
