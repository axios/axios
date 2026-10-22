<template>
  <a
    class="security-updates-banner"
    href="https://www.herodevs.com/support/nes-for-axios?utm_source=axios-site&amp;utm_medium=referral&amp;utm_campaign=nes-for-axios_global&amp;utm_content=landing-page_none_20260924_a"
    target="_blank"
    rel="noopener noreferrer sponsored"
    aria-label="Get Security Updates for Axios v0 (opens in a new tab)"
  >
    <span class="security-updates-banner__content">
      <svg
        class="security-updates-banner__icon"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 3 19 6v5c0 4.5-2.9 8.2-7 10-4.1-1.8-7-5.5-7-10V6l7-3Z"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="m9.25 12 1.8 1.8 3.9-4.1"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>Get Security Updates for Axios v0</span>
      <span class="security-updates-banner__arrow" aria-hidden="true">→</span>
    </span>
  </a>
</template>

<style>
.security-updates-banner {
  display: block;
  position: relative;
  z-index: 1;
  width: 100%;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(15, 23, 42, 0.22);
  color: #fff;
  background: linear-gradient(100deg, #4c1d95 0%, #3730a3 52%, #075985 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  text-decoration: none;
  transition: filter 160ms ease;
}

.security-updates-banner::before {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% -80%, rgba(255, 255, 255, 0.3), transparent 55%);
  content: '';
  pointer-events: none;
}

.security-updates-banner:hover {
  color: #fff;
  filter: brightness(1.1);
}

.security-updates-banner:focus-visible {
  outline: 3px solid #fff;
  outline-offset: -4px;
}

.security-updates-banner__content {
  display: flex;
  position: relative;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto;
  padding: 11px 24px;
  min-height: 48px;
  max-width: 1152px;
  line-height: 24px;
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.security-updates-banner__icon {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
}

.security-updates-banner__arrow {
  display: inline-block;
  font-size: 18px;
  transition: transform 160ms ease;
}

.security-updates-banner:hover .security-updates-banner__arrow {
  transform: translateX(3px);
}

@media (max-width: 359px) {
  .security-updates-banner__content {
    gap: 6px;
    padding-right: 12px;
    padding-left: 12px;
    font-size: 13px;
  }

  .security-updates-banner__icon {
    width: 16px;
    height: 16px;
  }

  .security-updates-banner__arrow {
    font-size: 16px;
  }
}

/* VitePress normally pulls the hero up behind the navigation. With an
 * announcement before it, reset that overlap so the banner remains clickable. */
.security-updates-banner + .VPHomeHero {
  margin-top: 0;
  padding-top: 48px;
}

@media (min-width: 640px) {
  .security-updates-banner + .VPHomeHero {
    padding-top: 80px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .security-updates-banner,
  .security-updates-banner__arrow {
    transition: none;
  }
}
</style>
