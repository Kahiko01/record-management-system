"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const DISMISS_MS = 3200;

export default function WelcomeModal() {
  const { user, showWelcome, dismissWelcome } = useAuth();
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (!showWelcome || !user) return;

    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true;
      playOpeningSound();
    }

    const timer = setTimeout(() => {
      dismissWelcome();
      hasPlayedRef.current = false;
    }, DISMISS_MS);

    return () => clearTimeout(timer);
  }, [showWelcome, user, dismissWelcome]);

  if (!showWelcome || !user) return null;

  const firstName = user.username.split("_")[0];
  const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const role = user.role?.replace(/_/g, " ") ?? "";

  return (
    <div className="kw-overlay fixed inset-0 z-[100] flex items-center justify-center bg-[#06140d]/70 backdrop-blur-md px-4">
      <div className="relative w-full max-w-sm h-[440px] rounded-[28px] overflow-hidden shadow-[0_30px_80px_-20px_rgba(6,20,13,0.6)] ring-1 ring-black/10">

        {/* Revealed content */}
        <div className="kw-content absolute inset-0 flex flex-col items-center justify-center text-center px-9 bg-[#FAF7F0] dark:bg-[#0c1712]">
          <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#8a7526] dark:text-[#c9a227] mb-3">
            Access Granted
          </span>
          <h2 className="font-serif text-[28px] leading-tight font-semibold text-[#0f3d2e] dark:text-[#f5f1e6] mb-1">
            Welcome, {capitalized}
          </h2>
          <p className="text-xs uppercase tracking-[0.18em] text-[#6b6252] dark:text-[#a89f8c] capitalize mb-8">
            {role}
          </p>

          <div className="w-full max-w-[180px]">
            <div className="h-[3px] w-full rounded-full bg-[#0f3d2e]/10 dark:bg-[#f5f1e6]/10 overflow-hidden">
              <div className="kw-progress h-full rounded-full bg-[#c9a227]" />
            </div>
            <p className="mt-3 text-[11px] text-[#8a7f6c] dark:text-[#a89f8c] tracking-wide">
              Preparing your dashboard…
            </p>
          </div>
        </div>

        {/* Seal, breaks open just before the gates part */}
        <div className="kw-seal absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full border-[1.5px] border-[#c9a227] flex items-center justify-center bg-[#0f3d2e]">
            <span className="font-serif text-[13px] tracking-[0.08em] text-[#c9a227]">
              KNP
            </span>
          </div>
        </div>

        {/* Left gate */}
        <div className="kw-gate-left absolute inset-y-0 left-0 w-1/2 z-20 bg-gradient-to-br from-[#15503a] to-[#0a2419] border-r border-[#c9a227]/40" />
        {/* Right gate */}
        <div className="kw-gate-right absolute inset-y-0 right-0 w-1/2 z-20 bg-gradient-to-bl from-[#15503a] to-[#0a2419] border-l border-[#c9a227]/40" />
      </div>

      <style jsx>{`
        @keyframes kwOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes kwSeal {
          0% { opacity: 0; transform: scale(0.6); }
          22% { opacity: 1; transform: scale(1.05); }
          32%, 46% { opacity: 1; transform: scale(1); }
          58%, 100% { opacity: 0; transform: scale(1.4); }
        }
        @keyframes kwGateLeft {
          0%, 40% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        @keyframes kwGateRight {
          0%, 40% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
        @keyframes kwContent {
          0%, 45% { opacity: 0; transform: scale(0.97) translateY(6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes kwProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .kw-overlay {
          animation: kwOverlayIn 0.35s ease-out both;
        }
        .kw-seal {
          animation: kwSeal 1.1s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .kw-gate-left {
          animation: kwGateLeft 1s cubic-bezier(0.65, 0, 0.35, 1) both;
        }
        .kw-gate-right {
          animation: kwGateRight 1s cubic-bezier(0.65, 0, 0.35, 1) both;
        }
        .kw-content {
          animation: kwContent 1s ease-out both;
        }
        .kw-progress {
          animation: kwProgress ${DISMISS_MS}ms linear both;
        }
        @media (prefers-reduced-motion: reduce) {
          .kw-overlay,
          .kw-seal,
          .kw-gate-left,
          .kw-gate-right,
          .kw-content,
          .kw-progress {
            animation-duration: 0.01ms !important;
            animation-delay: 0ms !important;
          }
        }
      `}</style>
    </div>
  );
}

function createNoiseBuffer(ctx: AudioContext, duration: number) {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function playOpeningSound() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx: AudioContext = new AudioContextClass();
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);

    // 1. Seal-break: a brief, dry tick
    const clickBuffer = createNoiseBuffer(ctx, 0.04);
    const click = ctx.createBufferSource();
    click.buffer = clickBuffer;
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = "highpass";
    clickFilter.frequency.value = 2500;
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.06, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(master);
    click.start(now);
    click.stop(now + 0.06);

    // 2. Gate whoosh: filtered noise sweep, like heavy doors parting
    const whooshStart = now + 0.05;
    const whooshDuration = 0.75;
    const whooshBuffer = createNoiseBuffer(ctx, whooshDuration);
    const whoosh = ctx.createBufferSource();
    whoosh.buffer = whooshBuffer;
    const whooshFilter = ctx.createBiquadFilter();
    whooshFilter.type = "bandpass";
    whooshFilter.Q.value = 0.9;
    whooshFilter.frequency.setValueAtTime(280, whooshStart);
    whooshFilter.frequency.linearRampToValueAtTime(1100, whooshStart + 0.35);
    whooshFilter.frequency.linearRampToValueAtTime(
      450,
      whooshStart + whooshDuration
    );
    const whooshGain = ctx.createGain();
    whooshGain.gain.setValueAtTime(0.0001, whooshStart);
    whooshGain.gain.exponentialRampToValueAtTime(0.11, whooshStart + 0.18);
    whooshGain.gain.exponentialRampToValueAtTime(
      0.0001,
      whooshStart + whooshDuration
    );
    whoosh.connect(whooshFilter);
    whooshFilter.connect(whooshGain);
    whooshGain.connect(master);
    whoosh.start(whooshStart);
    whoosh.stop(whooshStart + whooshDuration);

    // 3. Settle thunk: gates fully open, seating into place
    const thunkStart = now + 0.78;
    const thunk = ctx.createOscillator();
    thunk.type = "sine";
    thunk.frequency.setValueAtTime(95, thunkStart);
    thunk.frequency.exponentialRampToValueAtTime(48, thunkStart + 0.25);
    const thunkGain = ctx.createGain();
    thunkGain.gain.setValueAtTime(0.001, thunkStart);
    thunkGain.gain.exponentialRampToValueAtTime(0.14, thunkStart + 0.02);
    thunkGain.gain.exponentialRampToValueAtTime(0.0001, thunkStart + 0.3);
    thunk.connect(thunkGain);
    thunkGain.connect(master);
    thunk.start(thunkStart);
    thunk.stop(thunkStart + 0.32);

    // 4. Soft shimmer as the dashboard reveals
    const shimmerStart = now + 0.95;
    const shimmer = ctx.createOscillator();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(1200, shimmerStart);
    shimmer.frequency.exponentialRampToValueAtTime(1800, shimmerStart + 0.2);
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.setValueAtTime(0.0001, shimmerStart);
    shimmerGain.gain.exponentialRampToValueAtTime(0.045, shimmerStart + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, shimmerStart + 0.3);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(master);
    shimmer.start(shimmerStart);
    shimmer.stop(shimmerStart + 0.32);

    // Clean up the audio context shortly after playback
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch {
    // Fail silently if audio is blocked by the browser
  }
}
