<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue';
import AppFooter from '@/components/layout/AppFooter.vue';
</script>

<template>
  <div class="app-layout">
    <AppHeader />
    <main id="main-content" tabindex="-1">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<style>
/* Global base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  color: #1a1a1a;
  background-color: #ffffff;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: #0052cc;
  color: #fff;
  text-decoration: none;
  z-index: 9999;
  border-radius: 0 0 4px 0;
}

.skip-link:focus {
  top: 0;
}

:focus-visible {
  outline: 2px solid #0052cc;
  outline-offset: 2px;
}

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
}
</style>
