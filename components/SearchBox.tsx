"use client";

import { motion } from "framer-motion";
import type { Lang } from "@/lib/types";
import { formatCnicInput, isCnicQuery } from "@/lib/search";

type Props = {
  value: string;
  onChange: (value: string) => void;
  lang: Lang;
};

export function SearchBox({ value, onChange, lang }: Props) {
  const isUr = lang === "ur";
  const cnicMode = isCnicQuery(value) || value === "";

  function handleChange(raw: string) {
    const compact = raw.replace(/[\s-]/g, "");
    if (compact.length > 0 && /^\d+$/.test(compact)) {
      onChange(formatCnicInput(raw));
      return;
    }
    onChange(raw);
  }

  return (
    <motion.div
      className="search-box"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <label htmlFor="voter-search" className="search-label">
        <span className={isUr ? "urdu-text" : "en-text"}>
          {isUr ? "نام یا شناختی کارڈ نمبر" : "Name or CNIC number"}
        </span>
      </label>
      <div className="search-field">
        <input
          id="voter-search"
          name="voter-search"
          type="text"
          inputMode={cnicMode && value.length > 0 ? "numeric" : "text"}
          autoComplete="off"
          placeholder={isUr ? "ولید یوسف یا 5440005061863" : "Waleed Yousaf or 5440005061863"}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="search-input"
          dir={isCnicQuery(value) || !value ? "ltr" : isUr ? "rtl" : "auto"}
          aria-describedby="search-hint"
        />
        <button
          type="button"
          className="search-clear"
          onClick={() => onChange("")}
          hidden={!value}
          aria-label={isUr ? "صاف کریں" : "Clear"}
        >
          ×
        </button>
      </div>
      <p id="search-hint" className="search-hint">
        {isUr
          ? "نام، والد کا نام، یا ۱۳ ہندسے — ڈیش ضروری نہیں"
          : "Search by name, father's name, or 13-digit CNIC"}
      </p>
    </motion.div>
  );
}
