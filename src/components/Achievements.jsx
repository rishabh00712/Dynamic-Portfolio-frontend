// Achievements.jsx
import { useState, useEffect } from "react";

import { BACKEND_URL } from "./apiConfig";

// ---------- Single source of truth for font + colors — same shape as Header.jsx / Contact.jsx / Projects.jsx / Experience.jsx / Education.jsx / Certificates.jsx ----------
import THEME from "./theme";
/* ---------- Icons ---------- */

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 5H5a2 2 0 0 0 0 4h3M16 5h3a2 2 0 0 1 0 4h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13v3M9 20h6M10 20v-2.5a2 2 0 0 1 4 0V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      className="transition-transform duration-200 ease-out"
      style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
    >
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// Category glyphs — cycled by index, purely decorative, any number of backend categories gets one
const CATEGORY_ICONS = [
  // trophy
  TrophyIcon,
  // star burst
  (props) => (
    <svg {...props} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l2.2 5.3L20 9l-4.3 3.7L17 19l-5-3.4L7 19l1.3-6.3L4 9l5.8-.7L12 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  // medal
  (props) => (
    <svg {...props} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="15" r="6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 10 6 3M15 10l3-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
];

/* ---------- Achievement card ---------- */

function AchievementCard({ achievement, iconIndex }) {
  const CardGlyph = CATEGORY_ICONS[iconIndex % CATEGORY_ICONS.length];

  return (
    <div
      className="rounded-xl border p-5 md:p-6 flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
    >
      <span
        className="flex items-center justify-center w-10 h-10 rounded-lg mb-4"
        style={{ backgroundColor: `${THEME.accent}14`, color: THEME.accent }}
      >
        <CardGlyph />
      </span>

      <h4 className="text-base md:text-lg font-bold mb-2" style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}>
        {achievement.title}
      </h4>

      <p className="text-sm leading-relaxed" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
        {achievement.description}
      </p>

      {achievement.link && (
        <div className="pt-4 mt-4 border-t" style={{ borderColor: THEME.border }}>
          <a
            href={achievement.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs md:text-sm px-3.5 py-2 rounded-lg border transition-all duration-200"
            style={{ color: THEME.accent, borderColor: THEME.borderStrong, backgroundColor: `${THEME.accent}0D`, fontFamily: THEME.fontFamily }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = THEME.accent;
              e.currentTarget.style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${THEME.accent}0D`;
              e.currentTarget.style.color = THEME.accent;
            }}
          >
            <LinkIcon /> View
          </a>
        </div>
      )}
    </div>
  );
}

/* ---------- Full grid ---------- */

function AchievementGrid({ achievements }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {achievements.map((achievement, i) => (
        <AchievementCard key={achievement.id} achievement={achievement} iconIndex={i} />
      ))}
    </div>
  );
}

/* ---------- Collapsible category block — smooth on mobile via grid-template-rows ---------- */

function CategorySection({ label, achievements, isExpanded, onToggle, iconIndex }) {
  const count = achievements?.length ?? 0;
  const HeaderGlyph = CATEGORY_ICONS[iconIndex % CATEGORY_ICONS.length];

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-colors duration-300"
      style={{
        borderColor: isExpanded ? THEME.borderStrong : THEME.border,
        backgroundColor: THEME.cardBg,
        boxShadow: isExpanded ? `0 12px 30px -16px ${THEME.accent}44` : "none",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 md:px-6 md:py-5 text-left transition-colors duration-200"
        aria-expanded={isExpanded}
        style={{ backgroundColor: isExpanded ? THEME.fieldBg : "transparent" }}
      >
        <span
          className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 transition-colors duration-200"
          style={{
            backgroundColor: isExpanded ? THEME.accent : `${THEME.accent}14`,
            color: isExpanded ? "#FFFFFF" : THEME.accent,
          }}
        >
          <HeaderGlyph />
        </span>

        <div className="flex-1 min-w-0">
          <h3
            className="text-sm md:text-base font-semibold tracking-wide"
            style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}
          >
            {label}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
            {count} {count === 1 ? "achievement" : "achievements"}
          </p>
        </div>

        <span
          className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-colors duration-200"
          style={{ backgroundColor: isExpanded ? THEME.accent : `${THEME.accent}14`, color: isExpanded ? "#FFFFFF" : THEME.accent }}
        >
          <ChevronIcon expanded={isExpanded} />
        </span>
      </button>

      {/*
        Smooth expand/collapse using the CSS grid 0fr -> 1fr trick instead of
        max-height. Always animates proportional to the REAL content height
        (no arbitrary max-height like 4000px), which is what fixes the
        slow/laggy feel on mobile.
      */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isExpanded ? "1fr" : "0fr", willChange: "grid-template-rows" }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-5 pb-6 pt-2 md:px-6 md:pb-7" style={{ borderTop: `1px solid ${THEME.border}` }}>
            <div className="pt-5">
              {count > 0 ? (
                <AchievementGrid achievements={achievements} />
              ) : (
                <p className="text-sm" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
                  Nothing here yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Loading skeleton ---------- */

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[0, 1, 2].map((row) => (
        <div key={row} className="rounded-2xl border p-5 md:p-6" style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: THEME.skeletonBg }} />
            <div className="h-4 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "180px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Inline hint ---------- */

function ClickHint({ onDismiss }) {
  return (
    <div
      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 border text-xs md:text-sm"
      style={{ backgroundColor: `${THEME.accent}0D`, borderColor: THEME.borderStrong, color: THEME.textBody, fontFamily: THEME.fontFamily }}
    >
      <span>
        <span style={{ color: THEME.accent, fontWeight: 600 }}>Tip:</span> click a category to see the achievements
      </span>
      <button
        aria-label="Dismiss tip"
        onClick={onDismiss}
        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200"
        style={{ color: THEME.textMuted }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${THEME.accent}22`)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <CloseIcon />
      </button>
    </div>
  );
}

/* ---------- Main section ---------- */

export default function Achievements() {
  const [categories, setCategories] = useState(null); // [{ id, label, achievements: [...] }, ...] — fully backend-driven
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/achievements`)
      .then((res) => {
        if (!res.ok) throw new Error("backend not reachable");
        return res.json();
      })
      .then((data) => setCategories(data.categories || []))
      .catch(() => setError(true));
  }, []);

  const toggleCategory = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    setShowHint(false);
  };

  return (
    <section
      id="achievements"
      className="relative w-full pt-16 pb-24 md:pt-20 md:pb-32 overflow-hidden"
      style={{ backgroundColor: THEME.sectionBg, scrollMarginTop: "40px" }}
    >
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${THEME.accent}22 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 20%, black 30%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 20%, black 30%, transparent 90%)",
        }}
      />

      {/* Soft green blobs — same treatment as the other sections */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 md:w-[28rem] md:h-[28rem] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.accentLight}, transparent 70%)` }}
      />
      <div
        className="absolute bottom-0 -left-32 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.accent}, transparent 70%)` }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <p className="text-xs tracking-[0.3em] uppercase mb-3 text-center md:text-left" style={{ color: THEME.accentLight, fontFamily: THEME.fontFamily }}>
          What I'm proud of
        </p>
        <h2
          className="text-3xl md:text-6xl font-extrabold leading-tight mb-8 text-center md:text-left"
          style={{ color: THEME.textDark, fontFamily: THEME.headingFont }}
        >
          Achievements
        </h2>

        {error ? (
          <p className="text-sm" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
            Couldn't load achievements right now — please check back shortly.
          </p>
        ) : categories === null ? (
          <LoadingSkeleton />
        ) : (
          <>
            {showHint && (
              <div className="flex justify-center md:justify-start">
                <ClickHint onDismiss={() => setShowHint(false)} />
              </div>
            )}

            <div className="flex flex-col gap-4">
              {categories.map((category, index) => (
                <CategorySection
                  key={category.id}
                  label={category.label}
                  achievements={category.achievements}
                  isExpanded={!!expanded[category.id]}
                  onToggle={() => toggleCategory(category.id)}
                  iconIndex={index}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}