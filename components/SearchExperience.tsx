"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Lang, VoterRecord } from "@/lib/types";
import {
  isActiveSearch,
  normalizeCnic,
  searchVoters,
} from "@/lib/search";
import { cnicFromSearchParams } from "@/lib/shareVoter";
import { LanguageToggle } from "./LanguageToggle";
import { SearchBox } from "./SearchBox";
import { ResultList } from "./ResultList";

type Props = {
  voters: VoterRecord[];
};

export function SearchExperience({ voters }: Props) {
  const [lang, setLang] = useState<Lang>("ur");
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const results = searchVoters(voters, submitted);
  const isUr = lang === "ur";
  const isSearching = hasSearched && isActiveSearch(submitted);
  const resultsRef = useRef<HTMLDivElement>(null);

  function runSearch(next = draft) {
    const value = next.trim();
    setDraft(value);
    setSubmitted(value);
    setHasSearched(true);

    const url = new URL(window.location.href);
    const digits = normalizeCnic(value);
    if (digits.length >= 5) {
      url.searchParams.set("cnic", digits);
    } else {
      url.searchParams.delete("cnic");
    }
    url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }

  function clearSearch() {
    setDraft("");
    setSubmitted("");
    setHasSearched(false);
    const url = new URL(window.location.href);
    url.searchParams.delete("cnic");
    url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromCnic = cnicFromSearchParams(params.get("cnic"));
    if (fromCnic) {
      setDraft(fromCnic);
      setSubmitted(fromCnic);
      setHasSearched(true);
    }
  }, []);

  useEffect(() => {
    if (!hasSearched) return;
    const node = resultsRef.current;
    if (!node) return;
    const frame = window.requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hasSearched, submitted, results.length]);

  return (
    <>
      <div className="election-ribbon" aria-hidden />
      <div className="flag-watermark" aria-hidden>
        <Image
          src="/flag-ajk.png"
          alt=""
          width={626}
          height={417}
          className="flag-watermark-img"
          priority={false}
        />
      </div>

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
            <div className="brand-flag-wrap">
              <Image
                src="/flag-ajk.png"
                alt="Azad Jammu and Kashmir flag"
                width={120}
                height={80}
                className="brand-flag"
                priority
              />
            </div>
            <div className="brand-copy">
              <p className="brand-kicker">
                <span className="brand-kicker-dot" aria-hidden />
                {isUr ? "حتمی فہرست 2026" : "Final Roll 2026"}
              </p>
              <p className="brand">AJK Election 2026 Quetta</p>
              {!isSearching && (
                <p className="brand-sub">
                  {isUr
                    ? "آزاد جموں و کشمیر الیکشن کمیشن"
                    : "AJK Election Commission"}
                </p>
              )}
            </div>
          </motion.div>

          {!isSearching && (
            <motion.div
              className="flag-stripe"
              aria-hidden
              initial={{ opacity: 0, scaleX: 0.7 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{
                duration: 0.55,
                delay: 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
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
                  ? "جموں و متاثرین منگلا ڈیم — کوئٹہ۔ صرف شناختی کارڈ نمبر سے تلاش کریں۔"
                  : "Jammu & Mangla Dam affectees — Quetta. Search by CNIC only."}
              </motion.p>
            </>
          )}

          <SearchBox
            value={draft}
            onChange={(value) => {
              setDraft(value);
              if (!value) clearSearch();
            }}
            onSearch={() => runSearch()}
            lang={lang}
          />

          <motion.p
            className="meta-line"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            LA-34
          </motion.p>

          <div ref={resultsRef} className="results-anchor" tabIndex={-1}>
            <ResultList
              results={results}
              query={submitted}
              lang={lang}
              hasSearched={hasSearched}
            />
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
    </>
  );
}
