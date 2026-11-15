<script setup lang="ts">
import Splide from '@splidejs/splide';
import '@splidejs/splide/css';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import LogoCard from './LogoCard.vue';
import SponsorTierTag from './SponsorTierTag.vue';
import allSponsors from '../../data/sponsors.json';

const sponsors = [
  ...(allSponsors.platinum ?? []),
  ...(allSponsors.gold ?? []),
  ...(allSponsors.silver ?? []),
].filter((sponsor) => sponsor.active);

const carousel = ref<HTMLElement>();
let splide: Splide | undefined;

onMounted(() => {
  if (!carousel.value) return;

  splide = new Splide(carousel.value, {
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
  }).mount();
});

onBeforeUnmount(() => {
  splide?.destroy();
});
</script>

<template>
  <div v-if="sponsors.length > 0" ref="carousel" :class="$style.container" class="splide">
    <div class="splide__track">
      <div role="list" class="splide__list">
        <div v-for="sponsor in sponsors" :key="sponsor.slug" class="splide__slide">
          <LogoCard :item="sponsor" :class="$style.card">
            <SponsorTierTag :tier="sponsor.tier" />
          </LogoCard>
        </div>
      </div>
    </div>
  </div>
</template>

<style module>
.container {
  margin: 2rem auto 0;
  max-width: 1200px;
}

.card {
  height: 100%;
}
</style>
