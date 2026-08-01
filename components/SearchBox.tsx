"use client";

import { motion } from "framer-motion";
import type { Lang } from "@/lib/types";
import { formatCnicInput } from "@/lib/search";

type Props = {
  value: string;
  onChange: (value: string) => void;
  lang: Lang;
};

export function SearchBox({ value, onChange, lang }: Props) {
  const isUr = lang === "ur";

  return (
    <motion.div
      className="search-box"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      <label htmlFor="cnic" className="search-label">
        <span className={isUr ? "urdu-text" : "en-text"}>
          {isUr ? "شناختی کارڈ نمبر" : "CNIC Number"}
        </span>
      </label>
      <div className="search-field">
        <input
          id="cnic"
          name="cnic"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="5440005061863"
          value={value}
          onChange={(e) => onChange(formatCnicInput(e.target.value))}
          className="search-input"
          dir="ltr"
          aria-describedby="cnic-hint"
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
      <p id="cnic-hint" className="search-hint">
        {isUr
          ? "۱۳ ہندسے درج کریں — ڈیش (-) ضروری نہیں"
          : "Enter 13 digits — dashes are optional"}
      </p>
    </motion.div>
  );
}
