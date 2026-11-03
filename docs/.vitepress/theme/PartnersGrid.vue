<script setup lang="ts">
import { computed } from 'vue';
import { useData } from 'vitepress';
import LogoCardGrid from './LogoCardGrid.vue';
import partners from '../../data/partners.json';

withDefaults(defineProps<{ columns?: 3 | 4 | 5 }>(), { columns: 3 });

const { localeIndex } = useData();

const locale = computed(() => (localeIndex.value === 'root' ? 'en' : localeIndex.value));
</script>

<template>
  <LogoCardGrid :items="partners" :columns="columns" v-slot="{ item }">
    <p :class="$style.description">
      {{ item.description[locale] ?? item.description.en }}
    </p>
  </LogoCardGrid>
</template>

<style module>
.description {
  margin: 0 !important;
  font-size: 0.875rem;
  line-height: 1.25rem !important;
  color: var(--vp-c-text-2);
}
</style>
