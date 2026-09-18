import React, { useCallback, useEffect, useMemo, useState } from "react";
import THEME from "./theme";
import { BACKEND_URL } from "./apiConfig";

const STORAGE_KEY = "ej_last_reaction";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const AUTO_CLOSE_MS = 10000; // auto-collapse the bar 10s after it's opened

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
  const [expanded, setExpanded] = useState(false); // bar starts collapsed to a single emoji + ">"

  const total = Object.values(reactions).reduce((sum, value) => sum + value, 0);

  const cooldownRemaining = useMemo(() => {
    if (!lastReaction) return 0;
    const elapsed = now - lastReaction.time;
    return Math.max(0, COOLDOWN_MS - elapsed);
  }, [lastReaction, now]);

  const isLocked = cooldownRemaining > 0;

  const previewReaction = useMemo(() => {
    if (lastReaction) {
      return REACTIONS.find((r) => r.type === lastReaction.type) || REACTIONS[0];
    }
    return REACTIONS[0];
  }, [lastReaction]);

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

  // Auto-close the bar 10s after it's opened. Cleared automatically (via the
  // effect cleanup) if the user closes it earlier or the component unmounts,
  // and re-armed each time `expanded` flips back to true.
  useEffect(() => {
    if (!expanded) return undefined;
    const id = window.setTimeout(() => setExpanded(false), AUTO_CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [expanded]);

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

  const handleOpen = () => setExpanded(true);
  const handleClose = () => setExpanded(false);

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
          padding-top: 16px;
        }
        
         .ej-bar {
          position: relative;
          display: flex;
          align-items: center;
          gap: clamp(4px, 1.2vw, 6px);
          padding: clamp(10px, 3vw, 13px) clamp(8px, 2.5vw, 12px) clamp(7px, 2.2vw, 10px);
          border: 1px solid ${THEME.border};
          border-radius: 999px;
          background: ${THEME.cardBg};
          box-shadow: 0 6px 16px rgba(15,31,27,.14);
          overflow: visible;
          transition: opacity .35s ease, box-shadow .35s ease,
                      backdrop-filter .35s ease, -webkit-backdrop-filter .35s ease;
        }
        /* Collapsed (only the preview emoji + ">"): dimmed + frosted so it
           stays quiet and doesn't highlight itself on the page. */
        .ej-bar.is-collapsed {
          opacity: .5;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          box-shadow: 0 4px 12px rgba(15,31,27,.07);
        }
        /* Restore full visibility when the user actually interacts with it */
        .ej-bar.is-collapsed:hover,
        .ej-bar.is-collapsed:focus-within {
          opacity: 1;
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);
          box-shadow: 0 6px 16px rgba(15,31,27,.14);
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
            font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
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
        .ej-toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 50%;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          flex-shrink: 0;
          transition: background .2s ease, color .2s ease, transform .2s ease;
        }
        .ej-toggle-btn:hover {
          background: rgba(156,163,175,.15);
          color: #6b7280;
        }
        .ej-toggle-btn:active {
          transform: scale(.9);
        }
        .ej-toggle-btn svg {
          width: 14px;
          height: 14px;
        }
        .ej-emoji-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: clamp(35px, 8vw, 45px);
          height: clamp(35px, 8vw, 45px);
          border: none;
          border-radius: 50%;
          font-size: clamp(20px, 4vw, 25px);
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
        /* Count badge — pushed fully outside the emoji circle so it never
           overlaps the face, with pointer-events: none so it can't block
           hover/click on the button beneath it. */
        .ej-count-dot {
          position: absolute;
          top: -10px;
          right: -8px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          background: var(--ej-dark);
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          font-family: var(--ej-fancy-font);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 2;
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
        .ej-cooldown-chip {
          padding: 0 8px 0 6px;
          margin-left: 2px;
          font-size: clamp(10px, 2.6vw, 12px);
          font-weight: 600;
          letter-spacing: .01em;
          color: #b4483a;
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

        /* Smooth expand/collapse for the reaction options + total chip.
           The WRAP clips horizontally during the width animation (needed so
           content doesn't spill out while collapsed/collapsing). The INNER
           must stay overflow:visible at all times, or tooltips popping
           upward and count badges poking outward get clipped/squashed once
           the bar is open — that was the actual bug causing both the
           missing tooltip and the badges appearing to cover the emojis. */
        .ej-expand-wrap {
          display: grid;
          overflow: hidden;
          transition: grid-template-columns .5s ease-in-out;
        }
        .ej-expand-wrap.is-open {
          overflow: visible;
        }
        .ej-expand-inner {
          display: flex;
          align-items: center;
          gap: clamp(4px, 1.2vw, 6px);
          min-width: 0;
          overflow: visible;
          opacity: 0;
          transition: opacity .5s ease-in-out;
        }
        .ej-expand-wrap.is-open .ej-expand-inner {
          opacity: 1;
          transition-delay: .15s;
        }

        @media (max-width: 600px) {
          .ej-root { left: 25px; bottom: 25px; padding-top: 14px; }
          .ej-bar { gap: 3px; padding: 9px 7px 6px; }
          .ej-emoji-btn { width: 38px; height: 38px; font-size: 23px; }
          .ej-close-btn { width: 17px; height: 17px; font-size: 10px; }
          .ej-toggle-btn { width: 17px; height: 17px; }
          .ej-toggle-btn svg { width: 12px; height: 12px; }
          .ej-count-dot { min-width: 13px; height: 13px; font-size: 8px; top: -8px; right: -6px; }
          .ej-total-chip { display: none; }
          .ej-tooltip { font-size: 10px; padding: 4px 7px; }
          .ej-cooldown-chip { display: none; }
        }

        @media (max-width: 340px) {
          .ej-bar { padding: 8px 6px 5px; gap: 2px; }
          .ej-emoji-btn { width: 33px; height: 33px; font-size: 20px; }
          .ej-total-chip { font-size: 9px; padding: 0 4px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
        }
      `}</style>

            <div className={`ej-bar${expanded ? "" : " is-collapsed"}`} role="group" aria-label="React to this">
        {!expanded && (
          <button
            type="button"
            className="ej-emoji-btn"
            style={{ background: `linear-gradient(135deg, ${previewReaction.from}, ${previewReaction.to})` }}
            aria-label="Show reaction options"
            onClick={handleOpen}
          >
            {previewReaction.emoji}
            {reactions[previewReaction.type] > 0 && (
              <span className="ej-count-dot" aria-hidden="true">
                {reactions[previewReaction.type] > 99 ? "99+" : reactions[previewReaction.type]}
              </span>
            )}
          </button>
        )}

        {!expanded && (
          <button
            type="button"
            className="ej-toggle-btn"
            aria-label="Show reaction options"
            onClick={handleOpen}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        )}

        <div className={`ej-expand-wrap${expanded ? " is-open" : ""}`} style={{ gridTemplateColumns: expanded ? "1fr" : "0fr" }}>
          <div className="ej-expand-inner">
            <button
              type="button"
              className="ej-toggle-btn"
              aria-label="Hide reaction options"
              onClick={handleClose}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>

            {REACTIONS.map((reaction) => {
              const isSelected = lastReaction?.type === reaction.type;
              const disableThis = (isLocked && !isSelected) || isSaving;
              const count = reactions[reaction.type];

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
                  <span className="ej-tooltip" role="tooltip">{reaction.tooltip}</span>
                  {count > 0 && <span className="ej-count-dot" aria-hidden="true">{count > 99 ? "99+" : count}</span>}
                </button>
              );
            })}

            <div className="ej-divider" aria-hidden="true" />
            <span className="ej-total-chip">{loading ? "…" : `${total} react${total === 1 ? "" : "s"}`}</span>

            {isLocked && (
              <span className="ej-cooldown-chip">Next in {formatRemaining(cooldownRemaining)}</span>
            )}

            <button
              type="button"
              className="ej-close-btn"
              aria-label="Hide reaction bar"
              onClick={() => setIsDismissed(true)}
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {error && expanded && <p className="ej-status is-error">{error}</p>}
    </div>
  );
}