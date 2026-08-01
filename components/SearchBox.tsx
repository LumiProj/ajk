"use client";

import { motion } from "framer-motion";
import type { Lang } from "@/lib/types";
import { formatCnicInput } from "@/lib/search";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  lang: Lang;
};

export function SearchBox({ value, onChange, onSearch, lang }: Props) {
  const isUr = lang === "ur";

  return (
    <motion.form
      className="search-box"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <label htmlFor="voter-search" className="search-label">
        <span className={isUr ? "urdu-text" : "en-text"}>
          {isUr ? "شناختی کارڈ نمبر" : "CNIC number"}
        </span>
      </label>

      <div className="search-row">
        <div className="search-field">
          <input
            id="voter-search"
            name="cnic"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={isUr ? "مثال: 12345-1234567-1" : "e.g. 12345-1234567-1"}
            value={value}
            onChange={(e) => onChange(formatCnicInput(e.target.value))}
            className="search-input"
            dir="ltr"
            aria-describedby="search-hint"
          />
          {value ? (
            <button
              type="button"
              className="search-clear"
              onClick={() => onChange("")}
              aria-label={isUr ? "صاف کریں" : "Clear"}
              title={isUr ? "صاف کریں" : "Clear"}
            >
              ×
            </button>
          ) : null}
        </div>

        <button type="submit" className="search-submit">
          <SearchIcon />
          <span className={isUr ? "urdu-text" : "en-text"}>
            {isUr ? "تلاش کریں" : "Search"}
          </span>
        </button>
      </div>

      <p id="search-hint" className="search-hint">
        {isUr
          ? "۱۳ ہندسے درج کریں — ڈیش ضروری نہیں، پھر تلاش کریں"
          : "Enter 13 digits — dashes optional — then press Search"}
      </p>
    </motion.form>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
