<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { DocumentCopy } from "@element-plus/icons-vue";
import { apiGet, apiPost, apiPut } from "../api/client";
import { normalizeStudent } from "../student-helpers";
import { SG_GRADE_CODES } from "../sg-grades";
import type { Student } from "../types";

const { t } = useI18n();

const list = ref<Student[]>([]);
const name = ref("");
const hourlyRate = ref("60");
const createGrade = ref("P1");
const newRate = ref<Record<number, string>>({});
const newGrade = ref<Record<number, string>>({});
const parentLoginBase = computed(() =>
  typeof location !== "undefined" ? `${location.origin}/p/login` : "/p/login"
);

const gradeOptions = computed(() => SG_GRADE_CODES.map((code) => ({ code, label: t(`sgGrade.${code}`) })));

function parentLoginLink(loginUsername: string) {
  const q = new URLSearchParams({ user: loginUsername });
  return `${parentLoginBase.value}?${q.toString()}`;
}

async function load() {
  const rows = await apiGet<Record<string, unknown>[]>("/api/teacher/students");
  list.value = rows.map(normalizeStudent);
  for (const s of list.value) {
    newRate.value[s.id] = s.hourlyRate;
    newGrade.value[s.id] = s.gradeLevel || "P1";
  }
}
onMounted(load);

async function add() {
  await apiPost<Student, { name: string; hourlyRate: string; gradeLevel: string }>("/api/teacher/students", {
    name: name.value,
    hourlyRate: hourlyRate.value,
    gradeLevel: createGrade.value
  });
  name.value = "";
  createGrade.value = "P1";
  await load();
}

async function updateRate(s: Student) {
  const r = newRate.value[s.id];
  if (!r) return;
  await apiPut<Student>(`/api/teacher/students/${s.id}/hourly-rate?rate=${encodeURIComponent(r)}`);
  await load();
}

async function updateGrade(s: Student) {
  const g = newGrade.value[s.id];
  if (!g) return;
  await apiPut<Student>(`/api/teacher/students/${s.id}/grade-level?gradeLevel=${encodeURIComponent(g)}`);
  await load();
}

async function reset(s: Student) {
  if (!confirm(t("students.confirmReset", { name: s.name }))) return;
  const raw = await apiPost<Record<string, unknown>, Record<string, never>>(
    `/api/teacher/students/${s.id}/reset-password`,
    {}
  );
  await load();
  const pwd = normalizeStudent(raw).parentPassword;
  const sid = Number(raw.id) || s.id;
  if (pwd) {
    const row = list.value.find((x) => Number(x.id) === sid);
    if (row) row.parentPassword = pwd;
  }
}

async function copyLink(loginUsername: string) {
  const url = parentLoginLink(loginUsername);
  try {
    await navigator.clipboard.writeText(url);
    alert(t("students.copied"));
  } catch {
    prompt(t("students.promptCopy"), url);
  }
}

async function copyParentPassword(pwd: string) {
  if (!pwd) return;
  try {
    await navigator.clipboard.writeText(pwd);
    alert(t("students.copiedPwd"));
  } catch {
    prompt(t("students.promptCopyPwd"), pwd);
  }
}
</script>

<template>
  <div class="students-view">
    <h2>{{ t("students.title") }}</h2>
    <p class="muted students-intro">
      {{ t("students.intro") }}<br />
      <code class="students-base-url inline-link">{{ parentLoginBase }}</code>
    </p>
    <div class="card students-add">
      <h3 class="students-add-title">{{ t("students.addTitle") }}</h3>
      <p class="muted students-grade-help">{{ t("students.gradeHelp") }}</p>
      <form class="students-add-form" @submit.prevent="add">
        <div class="students-add-field">
          <span class="label">{{ t("students.name") }}</span>
          <input v-model="name" required class="students-inp-name" />
        </div>
        <div class="students-add-field">
          <span class="label">{{ t("students.grade") }}</span>
          <select v-model="createGrade" required class="students-select compact">
            <option v-for="g in gradeOptions" :key="g.code" :value="g.code">{{ g.label }}</option>
          </select>
        </div>
        <div class="students-add-field students-add-rate">
          <span class="label">{{ t("students.hourlyRate") }}</span>
          <input
            v-model="hourlyRate"
            class="students-inp-rate"
            type="number"
            step="0.01"
            min="0"
            required
          />
        </div>
        <div class="students-add-submit">
          <button class="btn" type="submit">{{ t("students.create") }}</button>
        </div>
      </form>
    </div>
    <div class="table-wrap students-table-wrap">
      <table class="students-table">
        <thead>
          <tr>
            <th class="col-name">{{ t("students.thStudent") }}</th>
            <th class="col-grade">{{ t("students.thGrade") }}</th>
            <th class="col-pwd">{{ t("students.thParentPwd") }}</th>
            <th class="col-link">{{ t("students.thLink") }}</th>
            <th class="col-rate">{{ t("students.thRate") }}</th>
            <th class="col-actions">{{ t("students.thActions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in list" :key="s.id">
            <td class="td-name">{{ s.name }}</td>
            <td class="td-grade">
              <form class="grade-form" @submit.prevent="updateGrade(s)">
                <select v-model="newGrade[s.id]" class="students-select students-select--row">
                  <option v-for="g in gradeOptions" :key="g.code" :value="g.code">{{ g.label }}</option>
                </select>
                <button class="btn-ghost btn-sm btn-inline" type="submit">{{ t("students.save") }}</button>
              </form>
            </td>
            <td class="td-pwd">
              <div v-if="s.parentPassword" class="pwd-row">
                <strong class="pwd-cell">{{ s.parentPassword }}</strong>
                <button
                  type="button"
                  class="btn-pwd-copy"
                  :title="t('students.copyPwd')"
                  :aria-label="t('students.copyPwd')"
                  @click="copyParentPassword(s.parentPassword)"
                >
                  <DocumentCopy class="btn-pwd-copy__icon" />
                </button>
              </div>
              <span v-else class="muted pwd-hint">{{ t("students.pwdPlaceholder") }}</span>
            </td>
            <td class="td-link">
              <button type="button" class="btn-ghost btn-sm btn-inline" @click="copyLink(s.loginUsername)">
                {{ t("students.copyLink") }}
              </button>
            </td>
            <td class="td-rate">
              <form class="rate-form" @submit.prevent="updateRate(s)">
                <input
                  v-model="newRate[s.id]"
                  class="rate-input"
                  type="number"
                  step="0.01"
                  min="0"
                />
                <button class="btn-ghost btn-sm btn-inline" type="submit">{{ t("students.save") }}</button>
              </form>
            </td>
            <td class="td-actions">
              <button type="button" class="btn-ghost btn-sm btn-inline" @click="reset(s)">
                {{ t("students.resetPwd") }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.students-view {
  max-width: 100%;
}

.students-intro {
  margin: 0 0 1rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.students-base-url {
  display: inline-block;
  max-width: 100%;
  margin-top: 0.35rem;
  padding: 0.25rem 0.4rem;
  font-size: 0.8rem;
  line-height: 1.4;
  word-break: break-all;
  border-radius: 6px;
}

.students-add-title {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}

.students-grade-help {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  line-height: 1.4;
  max-width: 42rem;
}

.students-add-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem 1rem;
  align-items: end;
}

@media (min-width: 520px) {
  .students-add-form {
    grid-template-columns: minmax(7rem, 1fr) minmax(5.5rem, 8rem) minmax(5rem, 7rem) auto;
  }
  .students-add-field.students-add-rate {
    max-width: 7rem;
  }
  .students-add-submit {
    padding-bottom: 0.05rem;
  }
}

.students-add-field .label {
  display: block;
  margin-bottom: 0.25rem;
}

.students-inp-name {
  min-width: 0;
  width: 100%;
  max-width: 16rem;
}

.students-inp-rate {
  min-width: 0;
  width: 100%;
  max-width: 6.5rem;
  padding: 0.5rem 0.65rem;
}

.students-select {
  min-width: 0;
  width: 100%;
  max-width: 10rem;
  font-size: 0.9rem;
}

.students-select.compact {
  max-width: 8.5rem;
}

.students-table-wrap {
  margin-top: 1rem;
  -webkit-overflow-scrolling: touch;
}

.students-table {
  table-layout: fixed;
  width: 100%;
  font-size: 0.88rem;
}

.students-table th {
  line-height: 1.2;
  hyphens: auto;
}

/* Column widths: keep actions narrow; allow password to wrap */
.col-name {
  width: 12%;
  min-width: 4.5rem;
}
.col-grade {
  width: 20%;
  min-width: 8.5rem;
}
.col-pwd {
  width: 18%;
  min-width: 7rem;
  vertical-align: middle;
}
.col-link {
  width: 9%;
  min-width: 3.5rem;
}
.col-rate {
  width: 15%;
  min-width: 7rem;
}
.col-actions {
  width: 11%;
  min-width: 3.5rem;
}

.td-name {
  word-break: break-word;
  vertical-align: top;
  padding-top: 0.65rem;
}

.td-grade,
.td-rate,
.td-link,
.td-actions {
  vertical-align: top;
  padding-top: 0.5rem;
}

.grade-form,
.rate-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.4rem;
  margin: 0;
  max-width: 100%;
}

.students-select--row {
  flex: 1 1 5rem;
  min-width: 0;
  max-width: 9.5rem;
  padding: 0.2rem 0.35rem;
  font-size: 0.85rem;
}

.btn-inline {
  flex: 0 0 auto;
  white-space: nowrap;
}

.td-pwd {
  vertical-align: middle;
  word-break: break-all;
  overflow-wrap: anywhere;
  font-size: 0.85rem;
}

.pwd-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
}

.btn-pwd-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.28rem;
  margin: 0;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--muted);
  cursor: pointer;
  line-height: 0;
  flex-shrink: 0;
  vertical-align: middle;
}

.btn-pwd-copy:hover {
  color: var(--accent);
  border-color: rgba(37, 99, 235, 0.35);
  background: var(--surface-hover);
}

.btn-pwd-copy__icon {
  width: 1.05rem;
  height: 1.05rem;
}

.pwd-hint {
  font-size: 0.78rem;
  line-height: 1.35;
  display: block;
  max-width: 12rem;
}

.pwd-cell {
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  line-height: 1.35;
}

.rate-input {
  min-width: 0;
  width: 3.5rem;
  max-width: 4.2rem;
  padding: 0.2rem 0.4rem;
  font-size: 0.9rem;
}

.td-link,
.td-actions {
  text-align: left;
}
</style>
