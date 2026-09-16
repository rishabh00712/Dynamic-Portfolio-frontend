import React, { useCallback, useEffect, useMemo, useState } from "react";
import THEME from "./theme";
import { BACKEND_URL } from "./apiConfig";

const STORAGE_KEY = "ej_last_reaction";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const REACTIONS = [
  { type: "wow", emoji: "🤩", label: "Wow", tooltip: "Utterly dazzling!", from: THEME.C2, to: THEME.C1 },
  { type: "happy", emoji: "😃", label: "Happy", tooltip: "Pure delight!", from: THEME.C0, to: THEME.accentLight },
  { type: "meh", emoji: "🫤", label: "Meh", tooltip: "Just so-so", from: THEME.accentLight, to: THEME.accent },
  { type: "pleading", emoji: "🥺", label: "Moved", tooltip: "Deeply touching", from: "#ffd6e7", to: "#ff9fc3" },
  { type: "sad", emoji: "😭", label: "Sad", tooltip: "Heart aches", from: "#bcd6ff", to: "#7fa8ff" },
];

const EMPTY_COUNTS = Object.fromEntries(REACTIONS.map(({ type }) => [type, 0]));

function readLastReaction() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.time !== "number" || !parsed.type) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLastReaction(type) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ type, time: Date.now() }));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

function formatRemaining(ms) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export default function EmojiBar() {
  const [reactions, setReactions] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastReaction, setLastReaction] = useState(() => readLastReaction());
  const [now, setNow] = useState(() => Date.now());
  const [justReacted, setJustReacted] = useState(null);
  const [error, setError] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);

  const total = Object.values(reactions).reduce((sum, value) => sum + value, 0);

  const cooldownRemaining = useMemo(() => {
    if (!lastReaction) return 0;
    const elapsed = now - lastReaction.time;
    return Math.max(0, COOLDOWN_MS - elapsed);
  }, [lastReaction, now]);

  const isLocked = cooldownRemaining > 0;

  useEffect(() => {
    if (!isLocked) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [isLocked]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${BACKEND_URL}/api/reactions`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load reactions");
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          const cleanData = Object.fromEntries(
            REACTIONS.map(({ type }) => [type, Math.max(0, Number(data?.[type]) || 0)])
          );
          setReactions(cleanData);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleReact = useCallback(async (type) => {
    if (isLocked || isSaving) return;
    const previous = reactions;
    const previousLastReaction = lastReaction;

    setReactions((current) => ({ ...current, [type]: current[type] + 1 }));
    setLastReaction({ type, time: Date.now() });
    writeLastReaction(type);
    setJustReacted(type);
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!response.ok) throw new Error("Could not save reaction");
    } catch {
      setReactions(previous);
      setLastReaction(previousLastReaction);
      try {
        if (previousLastReaction) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(previousLastReaction));
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // ignore storage failures
      }
      setError("Couldn't save your reaction. Try again in a bit.");
    } finally {
      setIsSaving(false);
      window.setTimeout(() => setJustReacted(null), 600);
    }
  }, [isLocked, isSaving, reactions, lastReaction]);

  if (isDismissed) return null;

  return (
    <div
      className="ej-root"
      style={{
        "--ej-dark": THEME.textDark,
        "--ej-font": THEME.fontFamily,
        "--ej-fancy-font": THEME.google_auth_font,
      }}
    >
      <style>{`
        .ej-root {
          position: fixed;
          left: 25px;
          bottom: 20px;
          z-index: 50;
          font-family: var(--ej-fancy-font);
          color: var(--ej-dark);
          max-width: calc(100vw - 10px);
        }
        .ej-bar {
          position: relative;
          display: flex;
          align-items: center;
          gap: clamp(4px, 1.2vw, 6px);
          padding: clamp(6px, 2vw, 9px) clamp(8px, 2.5vw, 12px);
          border: 2px solid var(--ej-dark);
          border-radius: 999px;
          background: ${THEME.cardBg};
          box-shadow: 0 6px 16px rgba(15,31,27,.18);
        }
        .ej-close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          margin-left: 2px;
          border: none;
          border-radius: 50%;
          background: ${THEME.fieldBg};
          color: ${THEME.textMuted};
          font-family: var(--ej-fancy-font);
          font-size: 13px;
          line-height: 1;
          cursor: pointer;
          flex-shrink: 0;
          transition: background .15s ease, color .15s ease, transform .15s ease;
        }
        .ej-close-btn:hover {
          background: #ffd9d9;
          color: #b4483a;
          transform: scale(1.08) rotate(90deg);
        }
        .ej-emoji-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(30px, 8vw, 40px);
          height: clamp(30px, 8vw, 40px);
          border: none;
          border-radius: 50%;
          font-size: clamp(15px, 4vw, 20px);
          line-height: 1;
          cursor: pointer;
          background: ${THEME.fieldBg};
          transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease;
        }
        .ej-emoji-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.12);
          box-shadow: 0 4px 10px rgba(15,31,27,.2);
        }
        .ej-emoji-btn:active:not(:disabled) {
          transform: translateY(0) scale(.96);
        }
        .ej-emoji-btn:disabled {
          cursor: default;
        }
        .ej-emoji-btn.is-selected {
          box-shadow: 0 0 0 2.5px var(--ej-dark) inset, 0 4px 10px rgba(15,31,27,.22);
        }
        .ej-emoji-btn.is-locked:not(.is-selected) {
          opacity: .4;
        }
        .ej-emoji-btn.is-pop {
          animation: ej-pop-bounce .5s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes ej-pop-bounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.35) rotate(-8deg); }
          70% { transform: scale(.92) rotate(4deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .ej-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          padding: 5px 10px;
          border-radius: 10px;
          background: var(--ej-dark);
          color: #fff;
          font-family: var(--ej-fancy-font);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: .01em;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity .15s ease, transform .15s ease;
          z-index: 10;
        }
        .ej-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: var(--ej-dark);
        }
        .ej-emoji-btn:hover .ej-tooltip,
        .ej-emoji-btn:focus-visible .ej-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .ej-count-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 999px;
          background: var(--ej-dark);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          font-family: var(--ej-fancy-font);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ej-divider {
          width: 1.5px;
          height: 26px;
          margin: 0 3px;
          background: ${THEME.border};
          flex-shrink: 0;
        }
        .ej-total-chip {
          padding: 0 8px 0 6px;
          margin-left: 2px;
          font-size: clamp(11px, 2.8vw, 13px);
          font-weight: 600;
          letter-spacing: .01em;
          color: ${THEME.textMuted};
          white-space: nowrap;
          font-family: var(--ej-fancy-font);
        }
        .ej-status.is-error {
          margin: 8px 4px 0;
          font-size: 12px;
          font-weight: 600;
          font-family: var(--ej-fancy-font);
          letter-spacing: .01em;
          max-width: 240px;
          color: #d64545;
          text-align: center;
        }

        @media (max-width: 600px) {
          .ej-root { left: 25px; bottom: 25px; }
          .ej-bar { gap: 3px; padding: 5px 7px; }
          .ej-emoji-btn { width: 30px; height: 30px; font-size: 15px; }
          .ej-close-btn { width: 17px; height: 17px; font-size: 10px; }
          .ej-count-dot { min-width: 14px; height: 14px; font-size: 8px; }
          .ej-total-chip { font-size: 10px; padding: 0 5px; }
          .ej-tooltip { font-size: 10px; padding: 4px 7px; }
        }

        @media (max-width: 340px) {
          .ej-bar { padding: 4px 6px; gap: 2px; }
          .ej-emoji-btn { width: 25px; height: 25px; font-size: 12px; }
          .ej-total-chip { font-size: 9px; padding: 0 4px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
      `}</style>

      <div className="ej-bar" role="group" aria-label="React to this">
        {REACTIONS.map((reaction) => {
          const isSelected = lastReaction?.type === reaction.type;
          const disableThis = (isLocked && !isSelected) || isSaving;
          const count = reactions[reaction.type];
          const tooltipText = isSelected && isLocked
            ? `${reaction.tooltip} · back in ${formatRemaining(cooldownRemaining)}`
            : isLocked
              ? `Try again in ${formatRemaining(cooldownRemaining)}`
              : reaction.tooltip;

          return (
            <button
              key={reaction.type}
              type="button"
              className={[
                "ej-emoji-btn",
                isSelected ? "is-selected" : "",
                isLocked ? "is-locked" : "",
                justReacted === reaction.type ? "is-pop" : "",
              ].filter(Boolean).join(" ")}
              style={{ background: `linear-gradient(135deg, ${reaction.from}, ${reaction.to})` }}
              aria-label={`React ${reaction.label}${count ? `, ${count} reactions` : ""}`}
              aria-pressed={isSelected}
              disabled={disableThis}
              onClick={() => handleReact(reaction.type)}
            >
              {reaction.emoji}
              <span className="ej-tooltip" role="tooltip">{tooltipText}</span>
              {count > 0 && <span className="ej-count-dot" aria-hidden="true">{count > 99 ? "99+" : count}</span>}
            </button>
          );
        })}
        <div className="ej-divider" aria-hidden="true" />
        <span className="ej-total-chip">{loading ? "…" : `${total} react${total === 1 ? "" : "s"}`}</span>

        <button
          type="button"
          className="ej-close-btn"
          aria-label="Hide reaction bar"
          onClick={() => setIsDismissed(true)}
        >
          ×
        </button>
      </div>

      {error && <p className="ej-status is-error">{error}</p>}
    </div>
  );
}