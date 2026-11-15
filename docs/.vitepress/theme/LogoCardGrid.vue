<script setup lang="ts">
import LogoCard, { type LogoCardItem } from './LogoCard.vue';

withDefaults(defineProps<{ items: LogoCardItem[]; columns?: 3 | 4 | 5 }>(), { columns: 3 });
</script>

<template>
  <div :class="[$style.grid, columns === 4 && $style.grid4, columns === 5 && $style.grid5]">
    <LogoCard v-for="item in items" :key="item.name" :item="item">
      <slot :item="item" />
    </LogoCard>
  </div>
</template>

<style module>
.grid {
  display: grid;
  margin-top: 2rem;
  margin-bottom: 2rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .grid4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 1200px) {
  .grid5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
