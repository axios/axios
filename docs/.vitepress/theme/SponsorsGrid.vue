<script setup lang="ts">
import LogoCardGrid from './LogoCardGrid.vue';
import SponsorTierTag from './SponsorTierTag.vue';
import allSponsors from '../../data/sponsors.json';

const sponsors = [
  ...(allSponsors.platinum ?? []),
  ...(allSponsors.gold ?? []),
  ...(allSponsors.silver ?? []),
  ...(allSponsors.bronze ?? []),
  ...(allSponsors.backer ?? []),
];
</script>

<template>
  <LogoCardGrid :items="sponsors" :columns="4" v-slot="{ item }">
    <SponsorTierTag :tier="item.tier" />
  </LogoCardGrid>
</template>
