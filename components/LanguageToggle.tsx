"use client";

import type { Lang } from "@/lib/types";

type Props = {
  lang: Lang;
  onChange: (lang: Lang) => void;
};

export function LanguageToggle({ lang, onChange }: Props) {
  return (
    <div
      className="lang-toggle"
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        className={lang === "ur" ? "active" : ""}
        onClick={() => onChange("ur")}
        aria-pressed={lang === "ur"}
      >
        اردو
      </button>
      <button
        type="button"
        className={lang === "en" ? "active" : ""}
        onClick={() => onChange("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}
