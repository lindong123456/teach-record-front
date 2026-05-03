<script setup lang="ts">
import { computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { setStoredLocale, type AppLocale, isAppLocale } from "../i18n";

const { locale } = useI18n();

const current = computed(() => (locale.value === "en-US" ? "en-US" : "zh-CN"));

function setLang(loc: AppLocale) {
  locale.value = loc;
  setStoredLocale(loc);
}

watch(
  () => locale.value,
  (v) => {
    if (isAppLocale(v)) setStoredLocale(v);
  }
);
</script>

<template>
  <div class="lang-switch" role="group" :aria-label="$t('common.selectLanguage')">
    <button
      type="button"
      class="lang-btn"
      :class="{ active: current === 'zh-CN' }"
      @click="setLang('zh-CN')"
    >
      中文
    </button>
    <button
      type="button"
      class="lang-btn"
      :class="{ active: current === 'en-US' }"
      @click="setLang('en-US')"
    >
      English
    </button>
  </div>
</template>

<style scoped>
.lang-switch {
  display: inline-flex;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface, #fff);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.lang-btn {
  border: none;
  background: transparent;
  color: var(--muted, #64748b);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35rem 0.65rem;
  cursor: pointer;
  line-height: 1.2;
  transition: background 0.15s, color 0.15s;
}
.lang-btn + .lang-btn {
  border-left: 1px solid var(--border, #e2e8f0);
}
.lang-btn:hover {
  color: var(--text, #0f172a);
  background: var(--surface-hover, #f8fafc);
}
.lang-btn.active {
  color: var(--accent-contrast, #fff);
  background: var(--accent, #2563eb);
}
.lang-btn.active:hover {
  color: var(--accent-contrast, #fff);
  background: var(--accent, #2563eb);
  filter: brightness(0.95);
}
</style>
