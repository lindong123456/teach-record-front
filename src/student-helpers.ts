import type { Student } from "./types";

export function normalizeStudent(rec: Record<string, unknown>): Student {
  const pp = rec.parentPassword ?? rec.parent_password;
  const hr = rec.hourlyRate ?? rec.hourly_rate;
  const gl = rec.gradeLevel ?? rec.grade_level;
  return {
    id: Number(rec.id),
    name: String(rec.name ?? ""),
    loginUsername: String(rec.loginUsername ?? rec.login_username ?? ""),
    hourlyRate: hr !== undefined && hr !== null ? String(hr) : "",
    gradeLevel: typeof gl === "string" && gl.length > 0 ? gl : null,
    parentPassword: typeof pp === "string" && pp.length > 0 ? pp : null
  };
}
