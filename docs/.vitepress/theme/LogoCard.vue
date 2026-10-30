<script setup lang="ts">
import { computed } from 'vue';
import { VPSocialLink } from 'vitepress/theme';

export interface SocialLink {
  type: string;
  url: string;
}

export interface LogoCardItem {
  name: string;
  imageUrl: string;
  website?: string | null;
  socialLinks?: SocialLink[];
}

const props = defineProps<{ item: LogoCardItem }>();

// Open Collective social link types mapped to VitePress (simple-icons) icon names, in display order.
const socialIcons: Record<string, { icon: string; label: string }> = {
  TWITTER: { icon: 'x', label: 'X' },
  GITHUB: { icon: 'github', label: 'GitHub' },
  LINKEDIN: { icon: 'linkedin', label: 'LinkedIn' },
  BLUESKY: { icon: 'bluesky', label: 'Bluesky' },
  MASTODON: { icon: 'mastodon', label: 'Mastodon' },
  THREADS: { icon: 'threads', label: 'Threads' },
  DISCORD: { icon: 'discord', label: 'Discord' },
  SLACK: { icon: 'slack', label: 'Slack' },
  MATTERMOST: { icon: 'mattermost', label: 'Mattermost' },
  DISCOURSE: { icon: 'discourse', label: 'Discourse' },
  YOUTUBE: { icon: 'youtube', label: 'YouTube' },
  TWITCH: { icon: 'twitch', label: 'Twitch' },
  TIKTOK: { icon: 'tiktok', label: 'TikTok' },
  INSTAGRAM: { icon: 'instagram', label: 'Instagram' },
  FACEBOOK: { icon: 'facebook', label: 'Facebook' },
  TUMBLR: { icon: 'tumblr', label: 'Tumblr' },
  MEETUP: { icon: 'meetup', label: 'Meetup' },
  GITLAB: { icon: 'gitlab', label: 'GitLab' },
  GIT: { icon: 'git', label: 'Git' },
  GHOST: { icon: 'ghost', label: 'Ghost' },
  PEERTUBE: { icon: 'peertube', label: 'PeerTube' },
  PIXELFED: { icon: 'pixelfed', label: 'Pixelfed' },
};

const socialOrder = Object.keys(socialIcons);

const isHttpUrl = (url: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

const website = computed(() =>
  props.item.website && isHttpUrl(props.item.website) ? props.item.website : null
);

const socialLinks = computed(() =>
  (props.item.socialLinks ?? [])
    .filter((link) => socialIcons[link.type] && isHttpUrl(link.url))
    .sort((a, b) => socialOrder.indexOf(a.type) - socialOrder.indexOf(b.type))
);
</script>

<template>
  <div :class="[$style.card, website && $style.linked]">
    <div :class="$style.logoWrapper">
      <img :src="item.imageUrl" :alt="item.name" :class="$style.logo" loading="lazy" />
    </div>
    <p :class="$style.name" :title="item.name">{{ item.name }}</p>
    <div :class="$style.details">
      <slot />
    </div>
    <div v-if="website || socialLinks.length" :class="$style.links">
      <a
        v-if="website"
        :href="website"
        :class="[$style.website, 'no-icon']"
        :aria-label="`${item.name} website`"
        rel="noopener noreferrer"
        target="_blank"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"
          />
        </svg>
      </a>
      <VPSocialLink
        v-for="link in socialLinks"
        :key="link.url"
        :icon="socialIcons[link.type].icon"
        :link="link.url"
        :aria-label="`${item.name} on ${socialIcons[link.type].label}`"
      />
    </div>
  </div>
</template>

<style module>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 1rem;
  background-color: rgb(156 163 175 / 0.05);
  text-align: center;
  transition:
    border-color 0.25s,
    background-color 0.25s;
}

.linked:hover {
  border-color: var(--vp-c-brand-1);
  background-color: var(--vp-c-bg-soft);
}

/* Logos sit on a white tile so dark marks stay readable in dark mode. */
.logoWrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 5rem;
  max-width: 100%;
  height: 5rem;
  padding: 0.5rem;
  border-radius: 1rem;
  background-color: #fff;
}

.logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Always reserve two lines so the content below lines up across cards. */
.card .name {
  height: 3rem;
  margin-top: 1rem;
  margin-bottom: 0;
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.details {
  flex-grow: 1;
  margin-top: 0.5rem;
}

.links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
}

.card .website,
.card .links :global(.VPSocialLink) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  color: var(--vp-c-text-2);
}

.card .website svg,
.card .links :global(.VPSocialLink) > :global([class^='vpi-social-']) {
  width: 16px;
  height: 16px;
}

.card .website:hover,
.card .links :global(.VPSocialLink:hover) {
  color: var(--vp-c-brand-1);
}

/* Stretch the website link over the whole card so the card stays clickable. */
.website::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
}

.website:focus-visible {
  outline: none;
}

.website:focus-visible::after {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

/* Social links sit above the stretched website link. */
.card .links :global(.VPSocialLink) {
  position: relative;
  z-index: 1;
}
</style>
