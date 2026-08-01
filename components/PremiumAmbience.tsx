"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/types";

type Props = {
  active: boolean;
  lang: Lang;
};

type Graph = {
  master: GainNode;
  oscs: OscillatorNode[];
  lfo: OscillatorNode;
};

/**
 * Soft ambient pad for premium CNIC results.
 * Uses Web Audio (no asset file). Autoplay may be blocked on deep-links;
 * the control lets the user start/mute.
 */
export function PremiumAmbience({ active, lang }: Props) {
  const [playing, setPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const graphRef = useRef<Graph | null>(null);

  const stopNodes = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    try {
      graph.oscs.forEach((o) => {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
      });
      graph.lfo.stop();
    } catch {
      /* ignore */
    }
    graphRef.current = null;
  }, []);

  const stopAudio = useCallback(() => {
    const graph = graphRef.current;
    const ctx = ctxRef.current;
    if (graph && ctx) {
      const now = ctx.currentTime;
      try {
        graph.master.gain.cancelScheduledValues(now);
        graph.master.gain.setValueAtTime(
          Math.max(graph.master.gain.value, 0.0001),
          now,
        );
        graph.master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      } catch {
        /* ignore */
      }
      window.setTimeout(stopNodes, 400);
    } else {
      stopNodes();
    }
  }, [stopNodes]);

  const startAudio = useCallback(async (): Promise<boolean> => {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return false;

      const ctx = ctxRef.current ?? new AC();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      stopNodes();

      const master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      const breath = ctx.createGain();
      breath.gain.value = 0.7;
      breath.connect(master);

      const mix = ctx.createGain();
      mix.gain.value = 0.05;
      mix.connect(breath);

      const freqs = [174.61, 220.0, 261.63];
      const oscs: OscillatorNode[] = [];
      for (const f of freqs) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = f;
        g.gain.value = 0.34;
        osc.connect(g);
        g.connect(mix);
        osc.start();
        oscs.push(osc);
      }

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 0.22;
      lfo.connect(lfoGain);
      lfoGain.connect(breath.gain);
      lfo.start();

      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.12, now + 1.2);

      graphRef.current = { master, oscs, lfo };
      return ctx.state === "running";
    } catch {
      return false;
    }
  }, [stopNodes]);

  useEffect(() => {
    document.body.classList.toggle("premium-mode", active);
    return () => document.body.classList.remove("premium-mode");
  }, [active]);

  useEffect(() => {
    if (!active) {
      stopAudio();
      setPlaying(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const ok = await startAudio();
      if (!cancelled) setPlaying(ok);
    })();

    return () => {
      cancelled = true;
      stopAudio();
    };
  }, [active, startAudio, stopAudio]);

  async function toggle() {
    if (playing) {
      stopAudio();
      setPlaying(false);
      return;
    }
    setPlaying(await startAudio());
  }

  if (!active) return null;

  const isUr = lang === "ur";
  const label = playing
    ? isUr
      ? "موسیقی بند"
      : "Mute music"
    : isUr
      ? "موسیقی چلائیں"
      : "Play music";

  return (
    <button
      type="button"
      className="premium-music-btn"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={label}
    >
      <span className="premium-music-icon" aria-hidden>
        {playing ? "♪" : "▶"}
      </span>
      <span className={isUr ? "urdu-text" : "en-text"}>{label}</span>
    </button>
  );
}
