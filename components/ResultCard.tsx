"use client";

import { motion } from "framer-motion";
import type { Lang, LocalizedString, VoterRecord } from "@/lib/types";
import { ShareButton } from "./ShareButton";

type Props = {
  voter: VoterRecord;
  lang: Lang;
  index: number;
};

function pick(value: LocalizedString, lang: Lang) {
  return lang === "ur" ? value.ur : value.en;
}

function Row({
  label,
  value,
  lang,
  ltr,
}: {
  label: string;
  value: string;
  lang: Lang;
  ltr?: boolean;
}) {
  const isUr = lang === "ur";
  return (
    <div className="detail-row">
      <div className="detail-label">
        <span className={isUr ? "urdu-text" : "en-text"}>{label}</span>
      </div>
      <div
        className={`detail-value ${ltr ? "ltr-value" : isUr ? "urdu-text" : "en-text"}`}
      >
        {ltr ? <span dir="ltr">{value}</span> : value}
      </div>
    </div>
  );
}

export function ResultCard({ voter, lang, index }: Props) {
  const isUr = lang === "ur";
  const gender = isUr
    ? voter.gender === "male"
      ? "مرد"
      : "خاتون"
    : voter.gender === "male"
      ? "Male"
      : "Female";

  return (
    <motion.article
      className="result-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.08 * index,
        ease: [0.22, 1, 0.36, 1],
      }}
      layout
    >
      <header className="result-card-header">
        <div className="result-identity">
          <p className="result-serial en-text">
            <span dir="ltr">#{voter.serialNumber}</span>
          </p>
          <h2 className={`result-name ${isUr ? "urdu-text" : "en-text"}`}>
            {pick(voter.name, lang)}
          </h2>
          <p className={`result-father ${isUr ? "urdu-text" : "en-text"}`}>
            <span className="result-father-label">
              {isUr ? "ولد" : "s/o"}
            </span>{" "}
            {pick(voter.fatherName, lang)}
          </p>
        </div>
        <div className="result-badges">
          <span className={`badge ${isUr ? "" : "en-text"}`}>{gender}</span>
          <span className="badge badge-area">
            <span dir="ltr">{voter.areaNumber}</span>
          </span>
        </div>
      </header>

      <section className="detail-section detail-section-top">
        <div className="detail-list detail-list-stack">
          <div className="detail-row cnic-row">
            <div className="detail-label">
              <span className={isUr ? "urdu-text" : "en-text"}>
                {isUr ? "شناختی کارڈ نمبر" : "CNIC"}
              </span>
            </div>
            <div className="detail-value cnic-number">
              <span dir="ltr">{voter.cnic}</span>
            </div>
          </div>
          <div className="detail-row meta-row">
            <div className="inline-meta">
              <div>
                <div className="detail-label">
                  <span className={isUr ? "urdu-text" : "en-text"}>
                    {isUr ? "عمر" : "Age"}
                  </span>
                </div>
                <div className="detail-value ltr-value">
                  <span dir="ltr">{voter.age}</span>
                </div>
              </div>
              <div>
                <div className="detail-label">
                  <span className={isUr ? "urdu-text" : "en-text"}>
                    {isUr ? "پیشہ" : "Occupation"}
                  </span>
                </div>
                <div
                  className={`detail-value ${isUr ? "urdu-text" : "en-text"}`}
                >
                  {pick(voter.occupation, lang)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-section">
        <h3 className={`section-title ${isUr ? "urdu-text" : "en-text"}`}>
          {isUr ? "انتخابی تفصیل" : "Electoral details"}
        </h3>
        <div className="detail-list">
          <Row
            label={isUr ? "انتخابی علاقہ" : "Electoral area"}
            value={pick(voter.areaName, lang)}
            lang={lang}
          />
          <Row
            label={isUr ? "علاقہ نمبر" : "Area number"}
            value={voter.areaNumber}
            lang={lang}
            ltr
          />
          <Row
            label={isUr ? "تحصیل" : "Tehsil"}
            value={pick(voter.tehsil, lang)}
            lang={lang}
          />
          <Row
            label={isUr ? "ضلع" : "District"}
            value={pick(voter.district, lang)}
            lang={lang}
          />
        </div>
      </section>

      <section className="detail-section">
        <h3 className={`section-title ${isUr ? "urdu-text" : "en-text"}`}>
          {isUr ? "پتہ" : "Address"}
        </h3>
        <div className="detail-list detail-list-stack">
          <Row
            label={isUr ? "موجودہ پتہ" : "Current address"}
            value={pick(voter.address, lang)}
            lang={lang}
          />
          <Row
            label={isUr ? "سابقہ پتہ" : "Previous address"}
            value={pick(voter.previousAddress, lang)}
            lang={lang}
          />
        </div>
      </section>

      <ShareButton voter={voter} lang={lang} />
    </motion.article>
  );
}
