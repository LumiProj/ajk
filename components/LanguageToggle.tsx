"use client";

import { motion } from "framer-motion";
import type { Lang } from "@/lib/types";

type Props = {
  lang: Lang;
  onChange: (lang: Lang) => void;
};

const options: Array<{ id: Lang; primary: string; secondary: string }> = [
  { id: "ur", primary: "اردو", secondary: "UR" },
  { id: "en", primary: "English", secondary: "EN" },
];

export function LanguageToggle({ lang, onChange }: Props) {
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <span className="lang-switch-caption urdu-text" aria-hidden>
        {lang === "ur" ? "زبان" : "Language"}
      </span>
      <div className="lang-toggle">
        {options.map((option) => {
          const active = lang === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={active ? "active" : ""}
              onClick={() => onChange(option.id)}
              aria-pressed={active}
            >
              {active && (
                <motion.span
                  className="lang-toggle-pill"
                  layoutId="lang-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className="lang-toggle-text">
                <span className="lang-primary">{option.primary}</span>
                <span className="lang-secondary">{option.secondary}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
