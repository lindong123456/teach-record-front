export interface TokenResponse {
  token: string;
}
export interface ParentStudentPreview {
  studentName: string;
}
export interface ParentLoginResponse {
  token: string;
  studentName: string;
}
export interface Student {
  id: number;
  name: string;
  loginUsername: string;
  hourlyRate: string;
  /** Singapore level code: P1…P6, S1…S5, JC1, JC2; legacy rows may be null. */
  gradeLevel: string | null;
  /** 家长登录密码，教师端列表展示；旧数据未迁移时可能为空 */
  parentPassword: string | null;
}
export interface LessonImage {
  id: number;
  originalFilename: string;
  publicUrl: string;
}
export interface Lesson {
  id: number;
  studentId: number;
  studentName: string;
  /** Singapore level code, optional */
  studentGradeLevel: string | null;
  /** 展示用：yyyy-MM-dd HH:00 */
  lessonTime: string;
  hours: string;
  unitPrice: string;
  settled: boolean;
  notes: string | null;
  createdAt: string;
  images: LessonImage[];
}
export interface SettlementSummary {
  unsettledHours: string;
  unsettledAmount: string;
  settledHours: string;
  settledAmount: string;
}

export interface Stats {
  byDay: {
    studentId: number;
    studentName: string;
    date: string;
    totalHours: string;
    totalAmount: string;
  }[];
  byMonth: {
    studentId: number;
    studentName: string;
    year: number;
    month: number;
    totalHours: string;
    totalAmount: string;
  }[];
  settlement: SettlementSummary;
}
