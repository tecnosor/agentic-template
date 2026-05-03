<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';

const { t } = useI18n();
</script>

<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <h1 class="not-found-title" aria-label="Page not found">404</h1>
      <p class="not-found-message">
        {{ t('common.error') }}
      </p>
      <RouterLink to="/" class="home-link">
        {{ t('components.header.nav.home') }}
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.not-found-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
  text-align: center;
}

.not-found-container {
  max-width: 480px;
}

.not-found-title {
  font-size: 6rem;
  font-weight: 700;
  color: #0052cc;
  margin: 0 0 1rem;
  line-height: 1;
}

.not-found-message {
  font-size: 1.125rem;
  color: #444;
  margin: 0 0 2rem;
}

.home-link {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #0052cc;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.home-link:hover {
  background-color: #003d99;
}

.home-link:focus-visible {
  outline: 2px solid #0052cc;
  outline-offset: 2px;
}
</style>
