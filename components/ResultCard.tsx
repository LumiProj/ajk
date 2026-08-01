"use client";

import { motion } from "framer-motion";
import type { Lang, VoterRecord } from "@/lib/types";

type Props = {
  voter: VoterRecord;
  lang: Lang;
  index: number;
};

function Field({
  labelUr,
  labelEn,
  valueUr,
  valueEn,
  lang,
  ltr,
}: {
  labelUr: string;
  labelEn: string;
  valueUr: string;
  valueEn?: string;
  lang: Lang;
  ltr?: boolean;
}) {
  const showEn = lang === "en";
  return (
    <div className="result-field">
      <dt>
        <span className="urdu-text">{labelUr}</span>
        {showEn && <span className="field-en en-text">{labelEn}</span>}
      </dt>
      <dd dir={ltr ? "ltr" : undefined} className={ltr ? "ltr-value" : "urdu-text"}>
        {valueUr}
        {showEn && valueEn && valueEn !== valueUr && (
          <span className="value-en en-text">{valueEn}</span>
        )}
      </dd>
    </div>
  );
}

export function ResultCard({ voter, lang, index }: Props) {
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
        <div>
          <h2 className="result-name urdu-text">{voter.name.ur}</h2>
          {lang === "en" && (
            <p className="result-name-en en-text">{voter.name.en}</p>
          )}
        </div>
        <div className="result-badges">
          <span className="badge">{genderUr}{lang === "en" ? ` · ${genderEn}` : ""}</span>
          <span className="badge badge-area" dir="ltr">
            {voter.areaNumber}
          </span>
        </div>
      </header>

      <dl className="result-grid">
        <Field
          labelUr="والد کا نام"
          labelEn="Father's name"
          valueUr={voter.fatherName.ur}
          valueEn={voter.fatherName.en}
          lang={lang}
        />
        <Field
          labelUr="شناختی کارڈ نمبر"
          labelEn="CNIC"
          valueUr={voter.cnic}
          lang={lang}
          ltr
        />
        <Field
          labelUr="عمر"
          labelEn="Age"
          valueUr={String(voter.age)}
          lang={lang}
          ltr
        />
        <Field
          labelUr="پیشہ"
          labelEn="Occupation"
          valueUr={voter.occupation.ur}
          valueEn={voter.occupation.en}
          lang={lang}
        />
        <Field
          labelUr="انتخابی علاقہ"
          labelEn="Electoral area"
          valueUr={`${voter.areaName.ur} (${voter.areaNumber})`}
          valueEn={`${voter.areaName.en} (${voter.areaNumber})`}
          lang={lang}
        />
        <Field
          labelUr="تحصیل / ضلع"
          labelEn="Tehsil / District"
          valueUr={`${voter.tehsil.ur}، ${voter.district.ur}`}
          valueEn={`${voter.tehsil.en}, ${voter.district.en}`}
          lang={lang}
        />
        <Field
          labelUr="پتہ"
          labelEn="Address"
          valueUr={voter.address.ur}
          valueEn={voter.address.en}
          lang={lang}
        />
        <Field
          labelUr="سابقہ پتہ"
          labelEn="Previous address"
          valueUr={voter.previousAddress.ur}
          valueEn={voter.previousAddress.en}
          lang={lang}
        />
      </dl>
    </motion.article>
  );
}
