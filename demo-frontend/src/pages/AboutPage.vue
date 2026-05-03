<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="about-page">
    <div class="about-container">
      <header class="page-header">
        <h1 class="page-title">
          {{ t('pages.about.title') }}
        </h1>
      </header>

      <section aria-labelledby="about-description-heading">
        <h2 id="about-description-heading" class="sr-only">Description</h2>
        <p class="about-description">
          {{ t('pages.about.description') }}
        </p>
      </section>

      <section class="stack-section" aria-labelledby="stack-title">
        <h2 id="stack-title" class="stack-title">
          {{ t('pages.about.stack.title') }}
        </h2>
        <dl class="stack-list">
          <div class="stack-item">
            <dt class="stack-label">Backend</dt>
            <dd class="stack-value">{{ t('pages.about.stack.backend') }}</dd>
          </div>
          <div class="stack-item">
            <dt class="stack-label">Frontend</dt>
            <dd class="stack-value">{{ t('pages.about.stack.frontend') }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  padding: 4rem 1.5rem;
}

.about-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.about-description {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #444;
  margin: 0 0 3rem;
}

.stack-section {
  background: #f8f9fc;
  border-radius: 8px;
  padding: 2rem;
}

.stack-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 1.5rem;
}

.stack-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 0;
}

.stack-item {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stack-label {
  font-weight: 600;
  color: #0052cc;
  min-width: 80px;
}

.stack-value {
  color: #444;
  margin: 0;
}

/* Utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
