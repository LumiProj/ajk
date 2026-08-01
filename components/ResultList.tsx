"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Lang, VoterRecord } from "@/lib/types";
import { ResultCard } from "./ResultCard";

type Props = {
  results: VoterRecord[];
  query: string;
  lang: Lang;
};

export function ResultList({ results, query, lang }: Props) {
  const isUr = lang === "ur";
  const hasQuery = query.replace(/\D/g, "").length > 0;

  if (!hasQuery) {
    return (
      <motion.p
        className="status-msg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        key="idle"
      >
        {isUr
          ? "نتائج کے لیے شناختی کارڈ نمبر درج کریں"
          : "Enter a CNIC number to see results"}
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
