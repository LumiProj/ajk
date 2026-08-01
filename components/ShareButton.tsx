"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Lang, VoterRecord } from "@/lib/types";
import { buildShareMessage } from "@/lib/shareVoter";
import { shareOrDownloadCard } from "@/lib/shareCard";
import { pick } from "@/lib/display";

type Props = {
  voter: VoterRecord;
  lang: Lang;
};

type Status = "idle" | "copied" | "shared" | "downloaded" | "working" | "error";

export function ShareButton({ voter, lang }: Props) {
  const isUr = lang === "ur";
  const [status, setStatus] = useState<Status>("idle");

  const message = buildShareMessage(voter, lang);
  const title = `${pick(voter.name, lang)} — AJK Election 2026`;

  function flash(next: Status, ms = 2400) {
    setStatus(next);
    window.setTimeout(() => setStatus("idle"), ms);
  }

  async function shareCard() {
    setStatus("working");
    try {
      const result = await shareOrDownloadCard(voter, lang, title);
      flash(result === "shared" ? "shared" : "downloaded");
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setStatus("idle");
        return;
      }
      flash("error");
    }
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(message);
      flash("copied");
    } catch {
      window.prompt(isUr ? "کاپی کریں:" : "Copy:", message);
    }
  }

  return (
    <div className="share-bar">
      <div className="share-bar-copy">
        <p className="share-title urdu-text">
          {isUr ? "یہ ریکارڈ شیئر کریں" : "Share this record"}
        </p>
        <p className="share-subtitle">
          {isUr
            ? "خوبصورت ووٹنگ کارڈ تصویر — واٹس ایپ کے لیے"
            : "Elegant voting card image — perfect for WhatsApp"}
        </p>
      </div>

      <div className="share-actions">
        <button
          type="button"
          className="share-btn share-btn-primary"
          onClick={shareCard}
          disabled={status === "working"}
        >
          <ShareIcon />
          <span>{isUr ? "شیئر کارڈ" : "Share card"}</span>
        </button>
        <button
          type="button"
          className="share-btn share-btn-wa"
          onClick={shareCard}
          disabled={status === "working"}
          aria-label="WhatsApp"
        >
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </button>
        <button
          type="button"
          className="share-btn share-btn-ghost"
          onClick={copyText}
          disabled={status === "working"}
        >
          <CopyIcon />
          <span>{isUr ? "کاپی ٹیکسٹ" : "Copy text"}</span>
        </button>
      </div>

      <AnimatePresence>
        {status !== "idle" && (
          <motion.p
            className="share-toast"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
          >
            {status === "working"
              ? isUr
                ? "کارڈ تیار ہو رہا ہے…"
                : "Preparing card…"
              : status === "copied"
                ? isUr
                  ? "ٹیکسٹ کاپی ہو گیا"
                  : "Text copied"
                : status === "downloaded"
                  ? isUr
                    ? "کارڈ محفوظ ہو گیا — واٹس ایپ میں منسلک کریں"
                    : "Card saved — attach it in WhatsApp"
                  : status === "error"
                    ? isUr
                      ? "کارڈ نہیں بن سکا"
                      : "Could not create card"
                    : isUr
                      ? "کارڈ شیئر ہو گیا"
                      : "Card shared"}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 3.2 17.7L2 22l4.4-1.1A11 11 0 1 0 20.5 3.5Zm-8.5 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.7.7.7-2.6-.2-.3A9 9 0 1 1 12 20.5Zm5-6.7c-.3-.1-1.6-.8-1.9-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.1-.5-.1-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3a2.4 2.4 0 0 0-.8 1.8 4.2 4.2 0 0 0 .9 2.2 9.6 9.6 0 0 0 3.7 3.5 12.7 12.7 0 0 0 2.5.9 2.4 2.4 0 0 0 1.7-.5 2 2 0 0 0 .7-1.4c.1-.2 0-.3-.1-.4Z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
