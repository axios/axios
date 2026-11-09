---
title: Blog
layout: page
sidebar: false
search: false
---

<script setup>
import { data as posts } from './posts.data.ts';
import { formatPostDate } from '../.vitepress/theme/formatPostDate.js';
</script>

<div class="logo-page blog-index">
  <h1 class="visually-hidden">Blog</h1>

  <ul v-if="posts.length" class="blog-index__list">
    <li v-for="post in posts" :key="post.url" class="blog-index__item">
      <a :href="post.url" class="blog-index__link">
        <img v-if="post.image" :src="post.image" :alt="post.imageAlt || ''" class="blog-index__image" loading="lazy" />
        <div class="blog-index__body">
          <h2 class="blog-index__title">{{ post.title }}</h2>
          <p class="blog-index__meta">
            <time v-if="post.date" :datetime="post.date">{{ formatPostDate(post.date) }}</time>
            <span v-if="post.date && post.author"> · </span>
            <span v-if="post.author">{{ post.author }}</span>
          </p>
          <p v-if="post.description" class="blog-index__description">{{ post.description }}</p>
        </div>
      </a>
    </li>
  </ul>
  <p v-else class="blog-index__empty">No posts yet. Check back soon.</p>
</div>
