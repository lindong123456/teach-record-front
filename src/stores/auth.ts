import { defineStore } from "pinia";
import { ref, computed } from "vue";

const TE = "tr_teacher";
const PR = "tr_parent";
const PN = "tr_parent_student_name";

export const useAuthStore = defineStore("auth", () => {
  const teacherToken = ref<string | null>(localStorage.getItem(TE));
  const parentToken = ref<string | null>(localStorage.getItem(PR));
  const parentStudentName = ref<string | null>(localStorage.getItem(PN));

  const isTeacher = computed(() => !!teacherToken.value);
  const isParent = computed(() => !!parentToken.value);

  function setTeacherToken(t: string) {
    teacherToken.value = t;
    localStorage.setItem(TE, t);
  }
  function setParentToken(t: string, studentName?: string | null) {
    parentToken.value = t;
    localStorage.setItem(PR, t);
    if (studentName != null && studentName !== "") {
      parentStudentName.value = studentName;
      localStorage.setItem(PN, studentName);
    }
  }
  function logoutTeacher() {
    teacherToken.value = null;
    localStorage.removeItem(TE);
  }
  function logoutParent() {
    parentToken.value = null;
    parentStudentName.value = null;
    localStorage.removeItem(PR);
    localStorage.removeItem(PN);
  }

  return {
    teacherToken,
    parentToken,
    parentStudentName,
    isTeacher,
    isParent,
    setTeacherToken,
    setParentToken,
    logoutTeacher,
    logoutParent
  };
});
