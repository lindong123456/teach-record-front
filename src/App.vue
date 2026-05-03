<script setup lang="ts">
import { RouterView } from "vue-router";
import LangSwitch from "./components/LangSwitch.vue";
</script>

<template>
  <div class="app-wrap">
    <div class="lang-float">
      <LangSwitch />
    </div>
    <RouterView />
  </div>
</template>

<style scoped>
.app-wrap {
  min-height: 100%;
}
.lang-float {
  position: fixed;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 1000;
  pointer-events: auto;
}
</style>
