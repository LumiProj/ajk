"use client";

import { motion } from "framer-motion";
import type { Lang, VoterRecord } from "@/lib/types";

type Props = {
  voter: VoterRecord;
  lang: Lang;
  index: number;
};

function Row({
  labelUr,
  labelEn,
  valueUr,
  valueEn,
  lang,
  ltr,
  mono,
}: {
  labelUr: string;
  labelEn: string;
  valueUr: string;
  valueEn?: string;
  lang: Lang;
  ltr?: boolean;
  mono?: boolean;
}) {
  const showEn = lang === "en";
  return (
    <div className="detail-row">
      <div className="detail-label">
        <span className="urdu-text">{labelUr}</span>
        {showEn && <span className="field-en en-text">{labelEn}</span>}
      </div>
      <div
        className={`detail-value ${ltr || mono ? "ltr-value" : "urdu-text"}`}
        dir={ltr || mono ? "ltr" : undefined}
      >
        {valueUr}
        {showEn && valueEn && valueEn !== valueUr && (
          <span className="value-en en-text">{valueEn}</span>
        )}
      </div>
    </div>
  );
}

export function ResultCard({ voter, lang, index }: Props) {
  const isUr = lang === "ur";
  const genderUr = voter.gender === "male" ? "مرد" : "خاتون";
  const genderEn = voter.gender === "male" ? "Male" : "Female";

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
          <p className="result-serial en-text" dir="ltr">
            #{voter.serialNumber}
          </p>
          <h2 className="result-name urdu-text">{voter.name.ur}</h2>
          {lang === "en" && (
            <p className="result-name-en en-text">{voter.name.en}</p>
          )}
          <p className="result-father urdu-text">
            <span className="result-father-label">
              {isUr ? "ولد" : "s/o"}
            </span>{" "}
            {voter.fatherName.ur}
            {lang === "en" && (
              <span className="value-en en-text">{voter.fatherName.en}</span>
            )}
          </p>
        </div>
        <div className="result-badges">
          <span className="badge">{isUr ? genderUr : genderEn}</span>
          <span className="badge badge-area" dir="ltr">
            {voter.areaNumber}
          </span>
        </div>
      </header>

      <div className="cnic-strip" dir="ltr">
        <div>
          <p className="cnic-label">
            {isUr ? "شناختی کارڈ نمبر" : "CNIC"}
          </p>
          <p className="cnic-value">{voter.cnic}</p>
        </div>
        <div className="meta-chips">
          <div className="meta-chip">
            <span className="meta-chip-label">{isUr ? "عمر" : "Age"}</span>
            <span className="meta-chip-value" dir="ltr">
              {voter.age}
            </span>
          </div>
          <div className="meta-chip">
            <span className="meta-chip-label">{isUr ? "پیشہ" : "Job"}</span>
            <span className="meta-chip-value urdu-text">
              {voter.occupation.ur}
            </span>
          </div>
        </div>
      </div>

      <section className="detail-section">
        <h3 className="section-title urdu-text">
          {isUr ? "انتخابی تفصیل" : "Electoral details"}
        </h3>
        <div className="detail-list">
          <Row
            labelUr="انتخابی علاقہ"
            labelEn="Electoral area"
            valueUr={voter.areaName.ur}
            valueEn={voter.areaName.en}
            lang={lang}
          />
          <Row
            labelUr="علاقہ نمبر"
            labelEn="Area number"
            valueUr={voter.areaNumber}
            lang={lang}
            ltr
          />
          <Row
            labelUr="تحصیل"
            labelEn="Tehsil"
            valueUr={voter.tehsil.ur}
            valueEn={voter.tehsil.en}
            lang={lang}
          />
          <Row
            labelUr="ضلع"
            labelEn="District"
            valueUr={voter.district.ur}
            valueEn={voter.district.en}
            lang={lang}
          />
        </div>
      </section>

      <section className="detail-section">
        <h3 className="section-title urdu-text">
          {isUr ? "پتہ" : "Address"}
        </h3>
        <div className="detail-list detail-list-stack">
          <Row
            labelUr="موجودہ پتہ"
            labelEn="Current address"
            valueUr={voter.address.ur}
            valueEn={voter.address.en}
            lang={lang}
          />
          <Row
            labelUr="سابقہ پتہ"
            labelEn="Previous address"
            valueUr={voter.previousAddress.ur}
            valueEn={voter.previousAddress.en}
            lang={lang}
          />
        </div>
      </section>
    </motion.article>
  );
}
