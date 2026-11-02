<script setup>
import { computed } from 'vue';
import { useData, withBase } from 'vitepress';
import { formatPostDate } from './formatPostDate.js';

const { page, frontmatter } = useData();

const isPost = computed(
  () => page.value.relativePath.startsWith('blog/') && page.value.relativePath !== 'blog/index.md'
);

const date = computed(() => {
  const value = frontmatter.value.date;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === 'string' ? value.slice(0, 10) : '';
});
</script>

<template>
  <div v-if="isPost" :class="$style.meta">
    <a :href="withBase('/blog/')" :class="$style.back">← All posts</a>
    <!-- id matches the anchor site search uses for the post title (search.mts) -->
    <h1 v-if="frontmatter.title" id="post-title" :class="$style.title">{{ frontmatter.title }}</h1>
    <p v-if="date || frontmatter.author" :class="$style.byline">
      <time v-if="date" :datetime="date">{{ formatPostDate(date) }}</time>
      <span v-if="date && frontmatter.author"> · </span>
      <span v-if="frontmatter.author">{{ frontmatter.author }}</span>
    </p>
    <img
      v-if="frontmatter.image"
      :src="withBase(frontmatter.image)"
      :alt="frontmatter.imageAlt || frontmatter.title"
      :class="$style.cover"
    />
  </div>
</template>

<style module>
.meta {
  margin-bottom: 1.5rem;
}

.back {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.back:hover {
  text-decoration: underline;
}

.title {
  margin: 1rem 0 0;
  font-size: 32px;
  font-weight: 600;
  line-height: 40px;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

.byline {
  margin: 0.5rem 0 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.cover {
  display: block;
  width: 100%;
  height: auto;
  margin-top: 1.25rem;
  border-radius: 12px;
}
</style>
