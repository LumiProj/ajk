"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Lang, VoterRecord } from "@/lib/types";
import {
  isActiveSearch,
  isCnicQuery,
  normalizeCnic,
  searchVoters,
} from "@/lib/search";
import { cnicFromSearchParams } from "@/lib/shareVoter";
import { LanguageToggle } from "./LanguageToggle";
import { SearchBox } from "./SearchBox";
import { ResultList } from "./ResultList";

type Props = {
  voters: VoterRecord[];
  stats: { totalVoters: number; totalAreas: number };
};

export function SearchExperience({ voters, stats }: Props) {
  const [lang, setLang] = useState<Lang>("ur");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const results = searchVoters(voters, deferredQuery);
  const isUr = lang === "ur";
  const isSearching = isActiveSearch(deferredQuery);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromCnic = cnicFromSearchParams(params.get("cnic"));
    const fromName = params.get("q")?.trim() ?? "";
    if (fromCnic) setQuery(fromCnic);
    else if (fromName) setQuery(fromName);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const trimmed = query.trim();
    if (isCnicQuery(trimmed) && normalizeCnic(trimmed).length >= 5) {
      url.searchParams.set("cnic", normalizeCnic(trimmed));
      url.searchParams.delete("q");
    } else if (trimmed.length >= 2 && !isCnicQuery(trimmed)) {
      url.searchParams.set("q", trimmed);
      url.searchParams.delete("cnic");
    } else {
      url.searchParams.delete("cnic");
      url.searchParams.delete("q");
    }
    window.history.replaceState(null, "", url);
  }, [query]);

  useEffect(() => {
    if (!isSearching) return;
    const node = resultsRef.current;
    if (!node) return;
    const frame = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isSearching, deferredQuery, results.length]);

  return (
    <div
      className={`shell ${isSearching ? "shell-searching" : ""}`}
      dir={isUr ? "rtl" : "ltr"}
    >
      <header className="topbar">
        <LanguageToggle lang={lang} onChange={setLang} />
      </header>

      <main className="hero">
        <motion.div
          className="brand-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/flag-ajk.png"
            alt="Azad Jammu and Kashmir flag"
            width={68}
            height={45}
            className="brand-flag"
            priority
          />
          <p className="brand">AJK Election 2026 Quetta</p>
        </motion.div>

        {!isSearching && (
          <motion.div
            className="flag-stripe"
            aria-hidden
            initial={{ opacity: 0, scaleX: 0.7 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: isUr ? "right center" : "left center" }}
          />
        )}

        {!isSearching && (
          <>
            <motion.h1
              className={`headline ${isUr ? "urdu-text" : "en-text"}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {isUr
                ? "حتمی انتخابی فہرست تلاش کریں"
                : "Search the final electoral roll"}
            </motion.h1>

            <motion.p
              className="lede"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.55,
                delay: 0.16,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {isUr
                ? "جموں و متاثرین منگلا ڈیم — کوئٹہ۔ نام یا شناختی کارڈ نمبر سے تلاش کریں۔"
                : "Jammu & Mangla Dam affectees — Quetta. Search by name or CNIC."}
            </motion.p>
          </>
        )}

        <SearchBox value={query} onChange={setQuery} lang={lang} />

        <motion.p
          className="meta-line"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {isUr
            ? `${stats.totalAreas} انتخابی علاقے · ${stats.totalVoters} ووٹر`
            : `${stats.totalAreas} electoral areas · ${stats.totalVoters} voters`}
        </motion.p>

        <div ref={resultsRef} className="results-anchor" tabIndex={-1}>
          <ResultList results={results} query={deferredQuery} lang={lang} />
        </div>
      </main>

      <footer className="site-footer">
        <p className={isUr ? "urdu-text" : "en-text"}>
          {isUr
            ? "آزاد جموں و کشمیر الیکشن کمیشن — حتمی فہرست ۲۰۲۶"
            : "Azad Jammu & Kashmir Election Commission — Final Roll 2026"}
        </p>
      </footer>
    </div>
  );
}
