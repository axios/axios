<script setup lang="ts">
defineProps<{ tier: string }>();

const capitalizeFirstLetter = (word: string) => {
  return String(word).charAt(0).toUpperCase() + String(word).slice(1);
};
</script>

<template>
  <span :class="[$style.tag, $style[tier]]">{{ capitalizeFirstLetter(tier) }}</span>
</template>

<style module>
.tag {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  align-items: center;
  border-radius: 9999px;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 500;
}

.platinum {
  color: #000;
  background-color: #e5e7eb;
}

.gold {
  color: #fff;
  background-color: #f59e0b;
}

.silver {
  color: #fff;
  background-color: #9ca3af;
}

.bronze {
  color: #fff;
  background-color: #854d0e;
}

.backer {
  color: #fff;
  background-color: #2563eb;
}
</style>
