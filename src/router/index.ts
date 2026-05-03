import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const Login = () => import("../views/LoginView.vue");
const Register = () => import("../views/RegisterView.vue");
const ParentLogin = () => import("../views/ParentLoginView.vue");
const AppShell = () => import("../views/AppShell.vue");
const Students = () => import("../views/StudentsView.vue");
const Lessons = () => import("../views/LessonsView.vue");
const Stats = () => import("../views/StatsView.vue");
const ParentRecords = () => import("../views/ParentRecordsView.vue");

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/app/lessons" },
    { path: "/login", name: "login", component: Login, meta: { guest: true } },
    { path: "/register", name: "register", component: Register, meta: { guest: true } },
    { path: "/p/login", name: "p-login", component: ParentLogin, meta: { guest: true } },
    {
      path: "/app",
      component: AppShell,
      meta: { teacher: true },
      children: [
        { path: "", redirect: { name: "lessons" } },
        { path: "students", name: "students", component: Students },
        { path: "lessons", name: "lessons", component: Lessons },
        { path: "stats", name: "stats", component: Stats }
      ]
    },
    { path: "/p/records", name: "p-records", component: ParentRecords, meta: { parent: true } }
  ]
});

router.beforeEach((to) => {
  const a = useAuthStore();
  if (to.meta.teacher) {
    if (!a.teacherToken) {
      return { name: "login" };
    }
  }
  if (to.meta.parent) {
    if (!a.parentToken) {
      return { name: "p-login" };
    }
  }
  return true;
});
