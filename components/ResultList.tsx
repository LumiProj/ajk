"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Lang, VoterRecord } from "@/lib/types";
import { isActiveSearch } from "@/lib/search";
import { ResultCard } from "./ResultCard";

type Props = {
  results: VoterRecord[];
  query: string;
  lang: Lang;
  hasSearched: boolean;
};

export function ResultList({ results, query, lang, hasSearched }: Props) {
  const isUr = lang === "ur";

  if (!hasSearched) {
    return (
      <motion.p
        className="status-msg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key="idle"
      >
        {isUr
          ? "شناختی کارڈ نمبر لکھ کر تلاش کریں دبائیں"
          : "Enter a CNIC number, then press Search"}
      </motion.p>
    );
  }

  if (!isActiveSearch(query)) {
    return (
      <motion.p
        className="status-msg status-empty"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        key="short"
      >
        {isUr ? "کم از کم ۵ ہندسے درج کریں" : "Enter at least 5 digits"}
      </motion.p>
    );
  }

  if (results.length === 0) {
    return (
      <motion.p
        className="status-msg status-empty"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        key="empty"
      >
        {isUr
          ? "اس نمبر سے کوئی ووٹر نہیں ملا"
          : "No voter found for this CNIC"}
      </motion.p>
    );
  }

  return (
    <div className="results">
      <p className="results-count">
        {isUr
          ? `${results.length} نتیجہ`
          : `${results.length} result${results.length === 1 ? "" : "s"}`}
      </p>
      <AnimatePresence mode="popLayout">
        {results.map((voter, index) => (
          <ResultCard
            key={voter.id}
            voter={voter}
            lang={lang}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
