---
layout: page
---

<script setup>
import allSponsors from '../../data/sponsors.json';

const sponsors = [...allSponsors.gold, ...allSponsors.silver, ...allSponsors.bronze, ...allSponsors.backer];

const capitalizeFirstLetter = (word) => {
  return String(word).charAt(0).toUpperCase() + String(word).slice(1);
};
</script>

<div style="margin: 1rem 7rem; max-width: 1200px;">
  <h1 style="line-height: 64px; font-size: 32px; letter-spacing: -0.4px; font-weight: 600; margin-top: 2rem;">Sponsors</h1>
  <p>Axios is supported by the following organizations. If you'd like to sponsor Axios, please see our <a href="https://opencollective.com/axios" target="_blank" style="color: #007bff;">open collective page</a> for more information.</p>

  <div :class="$style.sponsorCloudWrapper">
    <div :class="$style.sponsorCloudContainer">
      <div :class="$style.sponsorCloudGrid">
        <div :class="$style.sponsorCloudImageWrapper" v-for="(sponsor, key) in sponsors" :key="sponsor.name">
          <img :src="sponsor.imageUrl" :alt="sponsor.name" style="max-height: 72px; width: 100%; object-fit: contain;" />
          <dl>
            <dd :class="$style.sponsorTag">
              <span :class="$style[`tagSponsor${capitalizeFirstLetter(sponsor.tier)}`]">{{ capitalizeFirstLetter(sponsor.tier) }}</span>
            </dd>
          </dl>
          <a :href="sponsor.website" target="_blank" :class="$style.sponsorName">{{ sponsor.name }}</a>
        </div>
      </div>
    </div>
  </div>
</div>

<style module>
.sponsorCloudWrapper {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.sponsorCloudContainer {
  max-width: 80rem;
}

.sponsorCloudGrid {
  display: grid;
  overflow: hidden;
  margin-left: -1.5rem;
  margin-right: -1.5rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.125rem;
}

.sponsorCloudImageWrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: rgb(156 163 175 / 0.05);
}

.sponsorTag {
  margin-top: 0.75rem;
  margin-inline-start: 0px;
}

.sponsorName {
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 3rem;
  margin-top: 1rem !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
  font-weight: 600 !important;
  color: var(--vp-c-text-1) !important;
  text-wrap-style: pretty;
  display: -webkit-box;
  text-align: center;
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

@media (min-width: 640px) {
  .sponsorCloudGrid {
    margin-left: 0;
    margin-right: 0;
    border-radius: 1rem;
  }

  .sponsorCloudImageWrapper {
    padding: 2.5rem;
  }
}

@media (min-width: 768px) {
  .sponsorCloudGrid {
    grid-template-columns: repeat(4, minmax(0, 1fr)); 
  }
}
</style>
