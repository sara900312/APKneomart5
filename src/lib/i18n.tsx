import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "ar" | "en";
export type Direction = "rtl" | "ltr";

const LANGUAGE_KEY = "neomart_language";

type LocaleContextValue = {
  language: Language;
  direction: Direction;
  isArabic: boolean;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  text: (arabic: string, english: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("ar");

  useEffect(() => {
    const saved = window.localStorage.getItem(LANGUAGE_KEY);
    if (saved === "ar" || saved === "en") setLanguage(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = "rtl";
  }, [language]);

  const value = useMemo<LocaleContextValue>(() => ({
    language,
    direction: "rtl",
    isArabic: language === "ar",
    setLanguage,
    toggleLanguage: () => setLanguage((current) => current === "ar" ? "en" : "ar"),
    text: (arabic, english) => language === "ar" ? arabic : english,
  }), [language]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}

export function LanguageToggle() {
  const { language, toggleLanguage } = useLocale();
  const nextLanguage = language === "ar" ? "English" : "العربية";

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-border/60 bg-background/90 px-3 text-xs font-bold text-foreground shadow-soft backdrop-blur-xl transition hover:border-primary/50 hover:text-primary"
      aria-label={nextLanguage}
    >
      <span className="text-primary">{language === "ar" ? "ع" : "EN"}</span>
      {nextLanguage}
    </button>
  );
}
