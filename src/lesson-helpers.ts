import type { Lesson, LessonImage } from "./types";

export function normalizeLessonImage(raw: Record<string, unknown>): LessonImage {
  return {
    id: Number(raw.id),
    originalFilename: String(raw.originalFilename ?? raw.original_filename ?? ""),
    publicUrl: String(raw.publicUrl ?? raw.public_url ?? "")
  };
}

export function normalizeLesson(rec: Record<string, unknown>): Lesson {
  const imgs = rec.images;
  const images: LessonImage[] = Array.isArray(imgs)
    ? (imgs as Record<string, unknown>[]).map((i) => normalizeLessonImage(i))
    : [];
  const sgl = rec.studentGradeLevel ?? rec.student_grade_level;
  return {
    id: Number(rec.id),
    studentId: Number(rec.studentId ?? rec.student_id ?? 0),
    studentName: String(rec.studentName ?? rec.student_name ?? ""),
    studentGradeLevel: typeof sgl === "string" && sgl.length > 0 ? sgl : null,
    lessonTime: String(rec.lessonTime ?? rec.lesson_time ?? ""),
    hours: String(rec.hours ?? "0"),
    unitPrice: String(rec.unitPrice ?? rec.unit_price ?? "0"),
    settled: Boolean(rec.settled),
    notes: rec.notes != null ? String(rec.notes) : null,
    createdAt: String(rec.createdAt ?? rec.created_at ?? ""),
    images
  };
}
