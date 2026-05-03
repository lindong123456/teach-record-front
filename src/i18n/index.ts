import { createI18n } from "vue-i18n";
import zhCN from "../locales/zh-CN";
import enUS from "../locales/en-US";

export const LOCALE_STORAGE_KEY = "tr-locale";

export type AppLocale = "zh-CN" | "en-US";

const SUPPORTED: AppLocale[] = ["zh-CN", "en-US"];

function getInitialLocale(): AppLocale {
  if (typeof localStorage !== "undefined") {
    const s = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (s === "zh-CN" || s === "en-US") {
      return s;
    }
  }
  return "en-US";
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: "en-US",
  messages: {
    "zh-CN": zhCN,
    "en-US": enUS
  }
});

export { SUPPORTED };

export function setStoredLocale(loc: AppLocale) {
  localStorage.setItem(LOCALE_STORAGE_KEY, loc);
}

export function isAppLocale(s: string): s is AppLocale {
  return SUPPORTED.includes(s as AppLocale);
}
