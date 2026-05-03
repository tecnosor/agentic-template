<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const currentYear = new Date().getFullYear();
</script>

<template>
  <footer class="site-footer" role="contentinfo">
    <div class="footer-container">
      <p class="footer-text">
        {{ t('components.footer.copyright', { year: currentYear }) }}
      </p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background-color: #1a1a2e;
  color: rgba(255, 255, 255, 0.8);
  padding: 2rem 1.5rem;
}

.footer-container {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 0.875rem;
}
</style>
