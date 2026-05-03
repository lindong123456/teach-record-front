<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { apiGet } from "../api/client";
import { normalizeStudent } from "../student-helpers";
import type { Student, Stats } from "../types";

const { t } = useI18n();

const students = ref<Student[]>([]);
const from = ref(firstDayOfMonth());
const to = ref(today());
const filterStudentId = ref<string>("");
const stats = ref<Stats | null>(null);
const err = ref("");
const activeTab = ref<"day" | "month">("day");

function firstDayOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

const studentQuery = computed(() => {
  const s = filterStudentId.value;
  if (!s) return "";
  return `&studentId=${encodeURIComponent(s)}`;
});
async function load() {
  err.value = "";
  const q = `?from=${from.value}&to=${to.value}${studentQuery.value}`;
  try {
    stats.value = await apiGet<Stats>(`/api/teacher/stats${q}`);
  } catch {
    err.value = t("stats.errLoad");
  }
}
onMounted(async () => {
  const rows = await apiGet<Record<string, unknown>[]>("/api/teacher/students");
  students.value = rows.map(normalizeStudent);
  await load();
});
</script>

<template>
  <div>
    <h2>{{ t("stats.title") }}</h2>
    <p class="muted" style="margin-top: 0">
      {{ t("stats.intro") }}
    </p>
    <div class="row card" style="align-items: end; margin-bottom: 1rem">
      <div>
        <span class="label">{{ t("stats.from") }}</span>
        <input v-model="from" type="date" />
      </div>
      <div>
        <span class="label">{{ t("stats.to") }}</span>
        <input v-model="to" type="date" />
      </div>
      <div>
        <span class="label">{{ t("stats.student") }}</span>
        <select v-model="filterStudentId" style="min-width: 8rem">
          <option value="">{{ t("stats.all") }}</option>
          <option v-for="s in students" :key="s.id" :value="String(s.id)">{{ s.name }}</option>
        </select>
      </div>
      <button class="btn" type="button" @click="load">{{ t("stats.refresh") }}</button>
    </div>
    <p v-if="err" class="alert-error">{{ err }}</p>
    <div v-if="stats" class="card" style="margin-bottom: 1rem; font-size: 0.9rem">
      <span class="label" style="display: block; margin-bottom: 0.45rem">{{ t("stats.rangeSettlement") }}</span>
      <div class="settlement-bars">
        <div class="settlement-slab settlement-slab--unsettled">
          <div class="settlement-slab__kicker">{{ t("stats.outstandingKicker") }}</div>
          <div class="settlement-slab__line">
            {{
              t("stats.unsettled", {
                hours: Number(stats.settlement.unsettledHours).toFixed(2),
                amount: Number(stats.settlement.unsettledAmount).toFixed(2)
              })
            }}
          </div>
        </div>
        <div class="settlement-slab settlement-slab--settled">
          <div class="settlement-slab__kicker">{{ t("stats.paidKicker") }}</div>
          <div class="settlement-slab__line">
            {{
              t("stats.settled", {
                hours: Number(stats.settlement.settledHours).toFixed(2),
                amount: Number(stats.settlement.settledAmount).toFixed(2)
              })
            }}
          </div>
        </div>
      </div>
    </div>
    <div v-if="stats" class="card">
      <div class="stats-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          class="stats-tab"
          :class="{ 'is-active': activeTab === 'day' }"
          :aria-selected="activeTab === 'day'"
          @click="activeTab = 'day'"
        >
          {{ t("stats.tabDay") }}
        </button>
        <button
          type="button"
          role="tab"
          class="stats-tab"
          :class="{ 'is-active': activeTab === 'month' }"
          :aria-selected="activeTab === 'month'"
          @click="activeTab = 'month'"
        >
          {{ t("stats.tabMonth") }}
        </button>
      </div>
      <div v-show="activeTab === 'day'" role="tabpanel">
        <div v-if="stats.byDay.length === 0" class="muted" style="margin: 0">{{ t("stats.emptyDay") }}</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t("stats.thDate") }}</th>
                <th>{{ t("stats.thStudent") }}</th>
                <th>{{ t("stats.thTotalHours") }}</th>
                <th>{{ t("stats.thTotalAmount") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in stats.byDay" :key="i + '-' + r.date">
                <td>{{ r.date }}</td>
                <td>{{ r.studentName }}</td>
                <td>{{ r.totalHours }}</td>
                <td>{{ r.totalAmount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-show="activeTab === 'month'" role="tabpanel">
        <div v-if="stats.byMonth.length === 0" class="muted" style="margin: 0">{{ t("stats.emptyMonth") }}</div>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t("stats.thMonth") }}</th>
                <th>{{ t("stats.thStudent") }}</th>
                <th>{{ t("stats.thTotalHours") }}</th>
                <th>{{ t("stats.thTotalAmount") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in stats.byMonth" :key="i + '-' + r.month">
                <td>{{ r.year }}-{{ r.month < 10 ? "0" + r.month : r.month }}</td>
                <td>{{ r.studentName }}</td>
                <td>{{ r.totalHours }}</td>
                <td>{{ r.totalAmount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
