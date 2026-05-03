<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { http, apiGet, apiPost, apiPatch, apiDelete } from "../api/client";
import { normalizeStudent } from "../student-helpers";
import { normalizeLesson } from "../lesson-helpers";
import type { Student, Lesson } from "../types";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

const { t } = useI18n();

const students = ref<Student[]>([]);
const lessons = ref<Lesson[]>([]);
const filterStudentId = ref<string>("");

const studentId = ref<number | "">("");
const lessonDate = ref(new Date().toISOString().slice(0, 10));
const lessonHour = ref(9);
const hours = ref("1");
const notes = ref("");

function studentLabel(s: Student) {
  if (!s.gradeLevel) return s.name;
  const key = "sgGrade." + s.gradeLevel;
  const tr = t(key);
  return tr === key ? `${s.name} (${s.gradeLevel})` : `${s.name} — ${tr}`;
}

async function loadStudents() {
  const rows = await apiGet<Record<string, unknown>[]>("/api/teacher/students");
  students.value = rows.map(normalizeStudent);
  if (students.value.length && studentId.value === "") {
    studentId.value = students.value[0].id;
  }
}
async function loadLessons() {
  const q = filterStudentId.value
    ? `?studentId=${encodeURIComponent(filterStudentId.value)}`
    : "";
  const rows = await apiGet<Record<string, unknown>[]>(`/api/teacher/lessons${q}`);
  lessons.value = rows.map(normalizeLesson);
}
onMounted(async () => {
  await loadStudents();
  await loadLessons();
});
watch(filterStudentId, loadLessons);

async function addLesson() {
  if (studentId.value === "") return;
  const sid = +studentId.value;
  const h = Math.min(23, Math.max(0, Number(lessonHour.value) || 0));
  const lessonTime = `${lessonDate.value}T${String(h).padStart(2, "0")}:00:00`;
  const body = { studentId: sid, lessonTime, hours: hours.value, notes: notes.value || null };
  const created = await apiPost<Record<string, unknown>, typeof body>("/api/teacher/lessons", body);
  lessons.value = [normalizeLesson(created), ...lessons.value];
  notes.value = "";
}
async function toggleSettled(lesson: Lesson) {
  const u = await apiPatch<Record<string, unknown>, { settled: boolean }>(`/api/teacher/lessons/${lesson.id}`, {
    settled: !lesson.settled
  });
  const id = u.id != null ? Number(u.id) : NaN;
  const i = lessons.value.findIndex((l) => l.id === id);
  if (i >= 0) lessons.value[i] = normalizeLesson(u);
}
async function remove(lesson: Lesson) {
  if (!confirm(t("lessons.confirmDelete"))) return;
  await apiDelete(`/api/teacher/lessons/${lesson.id}`);
  await loadLessons();
}
async function onFile(lessonId: number, ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  await http.post(`/api/teacher/lessons/${lessonId}/images`, fd);
  input.value = "";
  await loadLessons();
}
function imgSrc(url: string) {
  if (url.startsWith("/")) return url;
  return url;
}
</script>

<template>
  <div>
    <h2>{{ t("lessons.title") }}</h2>
    <p class="muted" style="margin-top: 0">
      {{ t("lessons.intro") }}
    </p>
    <div v-if="students.length === 0" class="card muted">{{ t("lessons.noStudents") }}</div>
    <div v-else class="card">
      <h3 style="margin: 0 0 0.5rem; font-size: 1rem">{{ t("lessons.addTitle") }}</h3>
      <form class="row" @submit.prevent="addLesson" style="align-items: end">
        <div>
          <span class="label">{{ t("lessons.student") }}</span>
          <select v-model="studentId" required>
            <option v-for="s in students" :key="s.id" :value="s.id">{{ studentLabel(s) }}</option>
          </select>
        </div>
        <div>
          <span class="label">{{ t("lessons.date") }}</span>
          <input v-model="lessonDate" type="date" required />
        </div>
        <div>
          <span class="label">{{ t("lessons.startHour") }}</span>
          <select v-model="lessonHour" class="input-hour" required>
            <option v-for="h in HOUR_OPTIONS" :key="h" :value="h">
              {{ String(h).padStart(2, "0") }}:00
            </option>
          </select>
        </div>
        <div>
          <span class="label">{{ t("lessons.hours") }}</span>
          <input v-model="hours" type="number" min="0.25" step="0.25" required style="max-width: 5.5rem" />
        </div>
        <div>
          <span class="label">{{ t("lessons.notes") }}</span>
          <input v-model="notes" type="text" style="min-width: 6rem" />
        </div>
        <button class="btn" type="submit">{{ t("lessons.save") }}</button>
      </form>
    </div>
    <div class="row" style="align-items: center; margin: 0.5rem 0 0.75rem; gap: 0.4rem 1rem">
      <span class="label" style="margin: 0">{{ t("lessons.filterLabel") }}</span>
      <select v-model="filterStudentId" style="min-width: 7rem">
        <option value="">{{ t("lessons.all") }}</option>
        <option v-for="s in students" :key="s.id" :value="String(s.id)">{{ studentLabel(s) }}</option>
      </select>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{{ t("lessons.thTime") }}</th>
            <th>{{ t("lessons.thStudent") }}</th>
            <th>{{ t("lessons.thHours") }}</th>
            <th>{{ t("lessons.thUnit") }}</th>
            <th>{{ t("lessons.thSubtotal") }}</th>
            <th>{{ t("lessons.thSettlement") }}</th>
            <th>{{ t("lessons.thVoucher") }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="le in lessons" :key="le.id">
            <td>{{ le.lessonTime }}</td>
            <td>
              <div>{{ le.studentName }}</div>
              <div v-if="le.studentGradeLevel" class="muted" style="font-size: 0.78rem; line-height: 1.3">
                {{ t("sgGrade." + le.studentGradeLevel) }}
              </div>
            </td>
            <td>{{ le.hours }}</td>
            <td>{{ le.unitPrice }}</td>
            <td>
              <span v-if="!le.settled" class="line-amount--due">
                <span class="line-amount--due__tag">{{ t("lessons.outstandingKicker") }}</span>
                <span>{{ "$" + (Number(le.hours) * Number(le.unitPrice)).toFixed(2) }}</span>
              </span>
              <span v-else>{{ "$" + (Number(le.hours) * Number(le.unitPrice)).toFixed(2) }}</span>
            </td>
            <td>
              <span
                :class="['badge', le.settled ? 'settled' : 'unsettled']"
                @click="toggleSettled(le)"
                style="cursor: pointer"
              >
                {{ le.settled ? t("lessons.settled") : t("lessons.unsettled") }}
              </span>
            </td>
            <td>
              <a v-for="im in le.images" :key="im.id" :href="imgSrc(im.publicUrl)" target="_blank" rel="noreferrer">
                <img :src="imgSrc(im.publicUrl)" class="thumb" :alt="im.originalFilename" />
              </a>
              <label class="btn-ghost btn-sm" style="display: inline-block; margin-left: 0.2rem; cursor: pointer"
                >{{ t("lessons.upload") }}
                <input
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="(e) => onFile(le.id, e)"
                />
              </label>
            </td>
            <td>
              <button class="btn-ghost btn-sm" type="button" @click="remove(le)">{{ t("lessons.del") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
