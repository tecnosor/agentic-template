<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';

const { t } = useI18n();
</script>

<template>
  <header class="site-header" role="banner">
    <nav aria-label="Main navigation" class="nav-container">
      <RouterLink
        to="/"
        class="brand-link"
        :aria-label="t('components.header.nav.home')"
      >
        Enterprise App
      </RouterLink>

      <ul class="nav-list" role="list">
        <li>
          <RouterLink
            to="/"
            class="nav-link"
            :aria-current="$route.name === 'home' ? 'page' : undefined"
          >
            {{ t('components.header.nav.home') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink
            to="/about"
            class="nav-link"
            :aria-current="$route.name === 'about' ? 'page' : undefined"
          >
            {{ t('components.header.nav.about') }}
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  background-color: #0052cc;
  color: #fff;
  padding: 0 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto;
  height: 64px;
}

.brand-link {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  text-decoration: none;
}

.brand-link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
  border-radius: 2px;
}

.nav-list {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-weight: 500;
  padding: 0.25rem 0;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}

.nav-link:hover,
.router-link-active.nav-link {
  color: #fff;
  border-bottom-color: #fff;
}

.nav-link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
  border-radius: 2px;
}
</style>
