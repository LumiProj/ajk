"use client";

import type { Lang } from "@/lib/types";

type Props = {
  lang: Lang;
  onChange: (lang: Lang) => void;
};

export function LanguageToggle({ lang, onChange }: Props) {
  const isUr = lang === "ur";

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <span className={`lang-switch-caption ${isUr ? "urdu-text" : "en-text"}`}>
        {isUr ? "زبان منتخب کریں:" : "Choose language:"}
      </span>
      <div className="lang-toggle" data-active={lang}>
        <button
          type="button"
          className={lang === "en" ? "active" : ""}
          onClick={() => onChange("en")}
          aria-pressed={lang === "en"}
        >
          English
        </button>
        <button
          type="button"
          className={lang === "ur" ? "active" : ""}
          onClick={() => onChange("ur")}
          aria-pressed={lang === "ur"}
        >
          اردو
        </button>
      </div>
    </div>
  );
}
