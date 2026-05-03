<script setup lang="ts">
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../stores/auth";
import { apiPost } from "../api/client";
import type { TokenResponse } from "../types";

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const username = ref("");
const password = ref("");
const err = ref("");

async function onSubmit() {
  err.value = "";
  try {
    const tRes = await apiPost<TokenResponse, { username: string; password: string }>("/api/auth/login", {
      username: username.value,
      password: password.value
    });
    auth.setTeacherToken(tRes.token);
    await router.push("/app/lessons");
  } catch {
    err.value = t("auth.errLogin");
  }
}
</script>

<template>
  <div class="layout teacher-login-page">
    <div class="teacher-login-inner">
      <h1 class="teacher-login-title">{{ t("auth.teacherTitle") }}</h1>
      <p class="muted teacher-login-tagline">{{ t("common.appTagline") }}</p>
      <div class="card teacher-login-card">
        <p v-if="err" class="alert-error teacher-login-err">{{ err }}</p>
        <form class="inline-form teacher-login-form" @submit.prevent="onSubmit">
          <div>
            <span class="label">{{ t("auth.username") }}</span>
            <input v-model="username" required autocomplete="username" />
          </div>
          <div>
            <span class="label">{{ t("auth.password") }}</span>
            <input v-model="password" type="password" required autocomplete="current-password" />
          </div>
          <div class="teacher-login-actions">
            <button class="btn teacher-login-submit" type="submit">{{ t("auth.enter") }}</button>
          </div>
          <p class="muted teacher-login-foot">
            {{ t("auth.noAccount") }}<RouterLink to="/register">{{ t("auth.register") }}</RouterLink>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.teacher-login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.teacher-login-inner {
  width: 100%;
  max-width: 22rem;
  text-align: center;
}

.teacher-login-title {
  margin: 0 0 0.35rem;
}

.teacher-login-tagline {
  margin: 0 0 1rem;
}

.teacher-login-card {
  width: 100%;
  margin: 0 auto;
  text-align: left;
}

.teacher-login-err {
  margin: 0 0 0.5rem;
}

.teacher-login-form {
  max-width: none;
  width: 100%;
}

.teacher-login-form > div {
  width: 100%;
}

.teacher-login-form input {
  width: 100%;
  box-sizing: border-box;
}

.teacher-login-actions {
  width: 100%;
}

.teacher-login-submit {
  display: block;
  width: 100%;
  box-sizing: border-box;
}

.teacher-login-foot {
  margin: 0;
  text-align: center;
}
</style>
