/** Singapore MOE-style level codes: Primary 1–6, Secondary 1–5, Junior College 1–2. */
export const SG_GRADE_CODES = [
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "JC1",
  "JC2"
] as const;

export type SgGradeCode = (typeof SG_GRADE_CODES)[number];
