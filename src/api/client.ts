import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../stores/auth";

const LS_TEACHER = "tr_teacher";
const LS_PARENT = "tr_parent";

export const http = axios.create({ baseURL: "" });

function combineURLs(baseURL: string, requestedURL: string): string {
  if (!requestedURL) return baseURL;
  return `${baseURL.replace(/\/+$/, "")}/${requestedURL.replace(/^\/+/, "")}`;
}

/** Pathname used for auth routing (matches axios merge of baseURL + url; interceptor runs before adapter merge). */
function requestApiPath(config: InternalAxiosRequestConfig): string {
  const base = String(config.baseURL ?? http.defaults.baseURL ?? "");
  const rel = config.url ?? "";
  const full =
    rel.startsWith("http://") || rel.startsWith("https://")
      ? rel
      : combineURLs(base, rel);
  try {
    const pathname = full.includes("://") ? new URL(full).pathname : full;
    return pathname.split("?")[0] || "";
  } catch {
    return rel.split("?")[0] || "";
  }
}

http.interceptors.request.use((config) => {
  const path = requestApiPath(config);
  const isAuth = path.startsWith("/api/auth/");
  if (isAuth) {
    delete config.headers.Authorization;
    return config;
  }
  const isParentApi = path.startsWith("/api/parent");
  const a = useAuthStore();
  let token: string | null = isParentApi ? a.parentToken : a.teacherToken;
  /* Store 与 localStorage 不同步时以 LS 为准（如极早发请求、或外部写入 token） */
  if (!token && typeof localStorage !== "undefined") {
    token = isParentApi ? localStorage.getItem(LS_PARENT) : localStorage.getItem(LS_TEACHER);
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiGet<T>(url: string) {
  const { data } = await http.get<T>(url);
  return data;
}

export async function apiPost<T, B = unknown>(url: string, body?: B) {
  const { data } = await http.post<T>(url, body);
  return data;
}

export async function apiPatch<T>(url: string, body?: object) {
  const { data } =
    body === undefined ? await http.patch<T>(url) : await http.patch<T>(url, body);
  return data;
}

export async function apiPut<T>(url: string, body?: object) {
  const { data } =
    body === undefined ? await http.put<T>(url) : await http.put<T>(url, body);
  return data;
}

export async function apiDelete(url: string) {
  await http.delete(url);
}
