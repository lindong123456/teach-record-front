<script setup lang="ts">
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { apiPost } from "../api/client";

const { t } = useI18n();
const router = useRouter();
const username = ref("");
const displayName = ref("");
const password = ref("");
const err = ref("");

async function onSubmit() {
  err.value = "";
  try {
    await apiPost("/api/auth/register", {
      username: username.value,
      displayName: displayName.value,
      password: password.value
    });
    await router.push("/login");
  } catch {
    err.value = t("auth.errRegister");
  }
}
</script>

<template>
  <div class="layout">
    <h1>{{ t("auth.registerTitle") }}</h1>
    <div class="card" style="max-width: 22rem">
      <p v-if="err" class="alert-error" style="margin: 0 0 0.5rem">{{ err }}</p>
      <form class="inline-form" @submit.prevent="onSubmit">
        <div>
          <span class="label">{{ t("auth.loginUsername") }}</span>
          <input v-model="username" required minlength="2" maxlength="64" />
        </div>
        <div>
          <span class="label">{{ t("auth.displayName") }}</span>
          <input v-model="displayName" required maxlength="128" />
        </div>
        <div>
          <span class="label">{{ t("auth.passwordMin") }}</span>
          <input v-model="password" type="password" required minlength="6" maxlength="128" />
        </div>
        <button class="btn" type="submit">{{ t("auth.register") }}</button>
        <p class="muted" style="margin: 0">
          {{ t("auth.hasAccount")
          }}<RouterLink to="/login">{{ t("auth.loginLink") }}</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>
