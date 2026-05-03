<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAuthStore } from "../stores/auth";
import { apiPost, apiGet } from "../api/client";
import type { ParentLoginResponse, ParentStudentPreview } from "../types";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const loginUsername = ref("");
const password = ref("");
const err = ref("");
const studentNamePreview = ref<string | null>(null);

function applyUserFromRoute() {
  const u = route.query.user;
  loginUsername.value = typeof u === "string" ? u.trim() : "";
}

const hasLinkUser = computed(() => loginUsername.value.length > 0);

async function loadStudentPreview() {
  studentNamePreview.value = null;
  const u = loginUsername.value.trim();
  if (!u) return;
  try {
    const p = await apiGet<ParentStudentPreview>(
      `/api/auth/parent/student-preview?loginUsername=${encodeURIComponent(u)}`
    );
    studentNamePreview.value = p.studentName || null;
  } catch {
    studentNamePreview.value = null;
  }
}

onMounted(() => {
  applyUserFromRoute();
  loadStudentPreview();
});
watch(
  () => route.query.user,
  () => {
    applyUserFromRoute();
    loadStudentPreview();
  }
);

let previewDebounce: ReturnType<typeof setTimeout> | null = null;
watch(loginUsername, () => {
  if (previewDebounce) clearTimeout(previewDebounce);
  previewDebounce = setTimeout(() => loadStudentPreview(), 320);
});

async function onSubmit() {
  err.value = "";
  const user = loginUsername.value.trim();
  if (!user) {
    err.value = t("parent.errNoUser");
    return;
  }
  try {
    const res = await apiPost<ParentLoginResponse, { loginUsername: string; password: string }>(
      "/api/auth/parent/login",
      {
        loginUsername: user,
        password: password.value
      }
    );
    auth.setParentToken(res.token, res.studentName);
    await router.push("/p/records");
  } catch {
    err.value = t("parent.errLogin");
  }
}
</script>

<template>
  <div class="parent-login-page">
    <div class="parent-login-inner">
      <h1 class="parent-login-title">{{ t("parent.loginTitle") }}</h1>
      <p v-if="studentNamePreview" class="student-name-banner">{{ studentNamePreview }}</p>
      <p v-if="hasLinkUser" class="muted intro">
        {{ t("parent.introLink1") }}<strong>{{ t("parent.introLink2") }}</strong>{{ t("parent.introLink3") }}
      </p>
      <div class="card login-card">
        <p v-if="err" class="alert-error err">{{ err }}</p>
        <form class="inline-form" @submit.prevent="onSubmit">
          <div v-if="!hasLinkUser">
            <span class="label">{{ t("parent.labelAccount") }}</span>
            <input v-model="loginUsername" autocomplete="username" :placeholder="t('parent.phAccount')" />
          </div>
          <div v-else>
            <span class="label">{{ t("parent.labelLocked") }}</span>
            <input :value="loginUsername" type="text" readonly tabindex="-1" class="readonly-field" />
          </div>
          <div>
            <span class="label">{{ t("auth.password") }}</span>
            <input v-model="password" type="password" required autocomplete="current-password" />
          </div>
          <button class="btn" type="submit">{{ t("parent.view") }}</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.parent-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1.25rem;
  box-sizing: border-box;
}

.parent-login-inner {
  width: 100%;
  max-width: 22rem;
  text-align: center;
}

.parent-login-title {
  margin: 0 0 0.75rem;
  font-size: 1.35rem;
}

.student-name-banner {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.02em;
}

.intro {
  margin: 0 0 1rem;
  text-align: left;
  line-height: 1.55;
}

.login-card {
  margin-bottom: 0;
  text-align: left;
}

.login-card .inline-form {
  max-width: none;
  width: 100%;
}

.login-card .inline-form > div {
  width: 100%;
}

.login-card .inline-form input {
  width: 100%;
  box-sizing: border-box;
}

.login-card .inline-form .btn {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 0.15rem;
}

.err {
  margin: 0 0 0.5rem;
}

.readonly-field {
  background: var(--surface-hover, #f8fafc);
  color: var(--muted, #64748b);
  cursor: default;
}
</style>
