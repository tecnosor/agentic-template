<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import BaseButton from '@/components/common/BaseButton.vue';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const router = useRouter();

function navigateToAbout(): void {
  router.push('/about');
}
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section" aria-labelledby="hero-title">
      <div class="hero-container">
        <h1 id="hero-title" class="hero-title">
          {{ t('pages.home.hero.title') }}
        </h1>
        <p class="hero-subtitle">
          {{ t('pages.home.hero.subtitle') }}
        </p>
        <BaseButton variant="primary" size="lg" @click="navigateToAbout">
          {{ t('pages.home.hero.cta') }}
        </BaseButton>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section" aria-labelledby="features-title">
      <div class="features-container">
        <h2 id="features-title" class="features-title">
          {{ t('pages.home.features.title') }}
        </h2>
        <ul class="features-grid" role="list">
          <li class="feature-card">
            <h3 class="feature-card-title">
              {{ t('pages.home.features.ddd.title') }}
            </h3>
            <p class="feature-card-description">
              {{ t('pages.home.features.ddd.description') }}
            </p>
          </li>
          <li class="feature-card">
            <h3 class="feature-card-title">
              {{ t('pages.home.features.cqrs.title') }}
            </h3>
            <p class="feature-card-description">
              {{ t('pages.home.features.cqrs.description') }}
            </p>
          </li>
          <li class="feature-card">
            <h3 class="feature-card-title">
              {{ t('pages.home.features.compliance.title') }}
            </h3>
            <p class="feature-card-description">
              {{ t('pages.home.features.compliance.description') }}
            </p>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  width: 100%;
}

/* Hero */
.hero-section {
  background: linear-gradient(135deg, #0052cc 0%, #003d99 100%);
  color: #fff;
  padding: 6rem 1.5rem;
  text-align: center;
}

.hero-container {
  max-width: 720px;
  margin: 0 auto;
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin: 0 0 1.5rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.125rem;
  margin: 0 0 2.5rem;
  opacity: 0.9;
  line-height: 1.7;
}

/* Features */
.features-section {
  padding: 5rem 1.5rem;
  background-color: #f8f9fc;
}

.features-container {
  max-width: 1280px;
  margin: 0 auto;
}

.features-title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  text-align: center;
  margin: 0 0 3rem;
  color: #1a1a1a;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.feature-card {
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.feature-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: #0052cc;
}

.feature-card-description {
  margin: 0;
  color: #444;
  line-height: 1.7;
}
</style>
