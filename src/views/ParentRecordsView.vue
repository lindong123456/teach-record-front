<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n, I18nT } from "vue-i18n";
import { ElConfigProvider, ElPagination } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import en from "element-plus/es/locale/lang/en";
import "element-plus/es/components/pagination/style/css";
import "element-plus/es/components/select/style/css";
import "element-plus/es/components/base/style/css";
import { useAuthStore } from "../stores/auth";
import { apiGet } from "../api/client";
import { normalizeLesson } from "../lesson-helpers";
import type { Lesson } from "../types";

const PAGE_SIZES = [10, 15, 20, 30, 50];

const { t, locale } = useI18n();
const elLocale = computed(() => (locale.value === "en-US" ? en : zhCn));

const auth = useAuthStore();
const router = useRouter();
const lessons = ref<Lesson[]>([]);
const currentPage = ref(1);
const pageSize = ref(15);

onMounted(async () => {
  const rows = await apiGet<Record<string, unknown>[]>("/api/parent/lessons");
  lessons.value = rows.map(normalizeLesson);
});

const totalLessonCount = computed(() => lessons.value.length);
const totalPages = computed(() => Math.max(1, Math.ceil(totalLessonCount.value / pageSize.value)));

watch(totalLessonCount, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value;
  }
});

const pagedLessons = computed(() => {
  const ps = pageSize.value;
  const start = (currentPage.value - 1) * ps;
  return lessons.value.slice(start, start + ps);
});

const hasStudentDisplayName = computed(() => {
  if (auth.parentStudentName?.trim()) return true;
  if (lessons.value[0]?.studentName?.trim()) return true;
  return false;
});

const displayStudentName = computed(() => {
  const n = auth.parentStudentName?.trim();
  if (n) return n;
  const fromLesson = lessons.value[0]?.studentName?.trim();
  if (fromLesson) return fromLesson;
  return t("parent.childDefault");
});

const headerGradeLine = computed(() => {
  const g = lessons.value[0]?.studentGradeLevel;
  if (!g) return "";
  const key = "sgGrade." + g;
  const tr = t(key);
  return tr === key ? g : tr;
});

const totalHours = computed(() => lessons.value.reduce((sum, l) => sum + Number(l.hours), 0));
const totalMoney = computed(() =>
  lessons.value.reduce((s, l) => s + Number(l.hours) * Number(l.unitPrice), 0).toFixed(2)
);

const settlementAllTime = computed(() => {
  let uh = 0;
  let ua = 0;
  let sh = 0;
  let sa = 0;
  for (const l of lessons.value) {
    const h = Number(l.hours);
    const a = h * Number(l.unitPrice);
    if (l.settled) {
      sh += h;
      sa += a;
    } else {
      uh += h;
      ua += a;
    }
  }
  return { unsettledHours: uh, unsettledAmount: ua, settledHours: sh, settledAmount: sa };
});

function lineSubtotal(le: Lesson) {
  return (Number(le.hours) * Number(le.unitPrice)).toFixed(2);
}

function imgSrc(url: string) {
  if (url.startsWith("/")) return url;
  return url;
}

function formatUsd(n: number): string {
  return "$" + n.toFixed(2);
}

function out() {
  auth.logoutParent();
  router.push("/p/login");
}
</script>

<template>
  <div class="layout parent-records">
    <header>
      <h1 class="page-title">{{ t("parent.recordsTitle") }}</h1>
      <p class="student-inline">{{ displayStudentName }}</p>
      <p v-if="headerGradeLine" class="student-grade-line muted" style="margin: 0.15rem 0 0.5rem; font-size: 0.92rem">
        {{ headerGradeLine }}
      </p>
      <div class="header-actions">
        <p class="muted trust">
          {{ t("parent.trust") }}
        </p>
        <button type="button" class="btn-ghost btn-sm" @click="out">{{ t("common.logout") }}</button>
      </div>
    </header>

    <div v-if="lessons.length" class="card parent-hero">
      <p class="hero-line1">{{ t("parent.hero1", { name: displayStudentName }) }}</p>
      <I18nT
        keypath="parent.heroUnsettled"
        tag="p"
        class="hero-line2 parent-hero-unsettled"
        :class="{ 'parent-hero-unsettled--zero': settlementAllTime.unsettledAmount <= 0 }"
      >
        <template #hours>
          <span class="parent-hero-stat">{{ settlementAllTime.unsettledHours.toFixed(2) }}</span>
        </template>
        <template #amount>
          <span class="parent-hero-stat">{{ formatUsd(settlementAllTime.unsettledAmount) }}</span>
        </template>
      </I18nT>
      <p class="muted hero-note">{{ t("parent.heroNote") }}</p>
      <p class="muted hero-settled">
        {{
          t("parent.heroSettled", {
            settledH: settlementAllTime.settledHours.toFixed(2),
            settledA: formatUsd(settlementAllTime.settledAmount),
            totalH: totalHours.toFixed(2),
            totalM: formatUsd(Number(totalMoney))
          })
        }}
      </p>
      <p class="muted hero-hint">{{ t("parent.heroHint") }}</p>
    </div>
    <div v-else class="card muted empty-hint">
      <template v-if="hasStudentDisplayName">
        {{ t("parent.emptyNamed", { name: displayStudentName }) }}
      </template>
      <template v-else>{{ t("parent.emptyUnnamed") }}</template>
    </div>

    <section v-if="lessons.length" class="detail-section">
      <h2 class="section-title">{{ t("parent.sectionTitle") }}</h2>
      <p class="muted section-desc">
        {{ t("parent.sectionDesc") }}
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{{ t("parent.thTime") }}</th>
              <th>{{ t("parent.thHours") }}</th>
              <th>{{ t("parent.thUnit") }}</th>
              <th>{{ t("parent.thSubtotal") }}</th>
              <th>{{ t("parent.thSettlement") }}</th>
              <th>{{ t("parent.thVoucher") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="le in pagedLessons" :key="le.id">
              <td>{{ le.lessonTime }}</td>
              <td>{{ le.hours }}</td>
              <td>{{ le.unitPrice }}</td>
              <td>
                <span v-if="!le.settled" class="line-amount--due">
                  <span class="line-amount--due__tag">{{ t("lessons.outstandingKicker") }}</span>
                  <span>{{ "$" + lineSubtotal(le) }}</span>
                </span>
                <span v-else>{{ "$" + lineSubtotal(le) }}</span>
              </td>
              <td>
                <span :class="['badge', le.settled ? 'settled' : 'unsettled']">{{
                  le.settled ? t("lessons.settled") : t("lessons.unsettled")
                }}</span>
              </td>
              <td>
                <a v-for="im in le.images" :key="im.id" :href="imgSrc(im.publicUrl)" target="_blank" rel="noreferrer">
                  <img :src="imgSrc(im.publicUrl)" class="thumb" :alt="im.originalFilename" />
                </a>
                <span v-if="le.notes" class="muted" style="display: block; max-width: 10rem; font-size: 0.8rem">{{
                  le.notes
                }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager-footer">
        <el-config-provider :locale="elLocale">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            class="parent-lesson-pagination"
            :total="totalLessonCount"
            :page-sizes="PAGE_SIZES"
            layout="total, sizes, prev, pager, next"
            background
            :hide-on-single-page="false"
            small
          />
        </el-config-provider>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.25rem;
  margin: 0 0 0.2rem;
}
.student-inline {
  margin: 0 0 0.65rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
}
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}
.trust {
  margin: 0;
  flex: 1;
  font-size: 0.85rem;
  line-height: 1.5;
  max-width: 36rem;
}

.parent-hero {
  margin: 0 0 0.75rem;
  border-color: var(--accent);
  background: linear-gradient(135deg, var(--surface) 0%, var(--surface-hover, #f8fafc) 100%);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.06);
}
.hero-line1 {
  margin: 0 0 0.6rem;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text);
}
.hero-line2 {
  margin: 0 0 0.35rem;
  font-size: 1.2rem;
  line-height: 1.45;
  color: var(--text);
}
.parent-hero-unsettled {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5;
  color: var(--text);
}
.parent-hero-unsettled--zero {
  color: var(--muted, #64748b);
}

.parent-records .parent-hero-stat {
  display: inline-block;
  margin: 0 0.06rem;
  padding: 0.08rem 0.35rem;
  border-radius: 6px;
  background: rgba(254, 243, 199, 0.35);
  border: 1px solid #fde68a;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: inherit;
  color: var(--text, #0f172a);
  vertical-align: baseline;
}

.parent-hero-unsettled--zero .parent-hero-stat {
  opacity: 0.85;
  border-color: #e2e8f0;
  background: #f8fafc;
}

.hero-line2 strong {
  color: var(--warning, #b45309);
  font-weight: 700;
}

/* Softer unpaid subtotal chips in the lesson table (parent view only) */
.parent-records .line-amount--due {
  background: rgba(254, 243, 199, 0.35);
  border: 1px solid #fde68a;
  padding: 0.15rem 0.4rem;
  font-weight: 500;
  font-size: inherit;
  color: var(--text, #0f172a);
}
.parent-records .line-amount--due__tag {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.02em;
  color: var(--muted, #64748b);
}
.hero-note {
  margin: 0 0 0.5rem;
  font-size: 0.82rem;
}
.hero-settled {
  margin: 0 0 0.45rem;
  font-size: 0.82rem;
  line-height: 1.45;
}
.hero-hint {
  margin: 0;
  font-size: 0.82rem;
}

.empty-hint {
  margin-bottom: 0.75rem;
  line-height: 1.55;
}

.detail-section {
  margin-top: 0.25rem;
}
.section-title {
  font-size: 1.05rem;
  margin: 0 0 0.35rem;
  font-weight: 600;
}
.section-desc {
  margin: 0 0 0.45rem;
  font-size: 0.85rem;
  line-height: 1.5;
}
.pager-footer {
  margin-top: 1rem;
  padding: 0.75rem 0;
  display: flex;
  justify-content: center;
}

.parent-lesson-pagination {
  justify-content: center;
  flex-wrap: wrap;
  row-gap: 0.5rem;
}

.parent-lesson-pagination :deep(.el-pagination__total) {
  color: var(--muted, #64748b);
  font-weight: 500;
}
</style>
