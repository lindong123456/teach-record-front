<script setup lang="ts">
import { useRouter, RouterView, RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../stores/auth";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
function out() {
  auth.logoutTeacher();
  router.push("/login");
}
</script>

<template>
  <div class="layout">
    <header>
      <h1 style="font-size: 1.4rem; margin-bottom: 0.25rem">{{ t("shell.title") }}</h1>
      <p class="muted" style="margin: 0 0 0.5rem">{{ t("common.appTagline") }}</p>
      <nav class="nav">
        <RouterLink to="/app/lessons">{{ t("shell.navLessons") }}</RouterLink>
        <RouterLink to="/app/students">{{ t("shell.navStudents") }}</RouterLink>
        <RouterLink to="/app/stats">{{ t("shell.navStats") }}</RouterLink>
        <button type="button" class="btn-ghost btn-sm" style="margin-left: auto" @click="out">
          {{ t("common.logout") }}
        </button>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
