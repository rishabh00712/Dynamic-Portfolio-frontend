// Experience.jsx
import { useState, useEffect } from "react";

import { BACKEND_URL } from "./apiConfig";

// ---------- Single source of truth for font + colors — same shape as Header.jsx / Contact.jsx / Projects.jsx ----------
import THEME from "./theme";

/* ---------- Icons ---------- */

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="11" x2="12" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="1.15" fill="currentColor" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
  // briefcase
  (props) => (
    <svg {...props} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  // building
  (props) => (
    <svg {...props} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  // graduation / mentorship
  (props) => (
    <svg {...props} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M2 8l10-4 10 4-10 4-10-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 10.5V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
];
function formatDuration(totalMonths) {
  if (totalMonths <= 0) return "";
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts = [];
  if (years > 0) parts.push(`${years} yr${years !== 1 ? "s" : ""}`);
  if (months > 0 || years === 0) parts.push(`${months} mo${months !== 1 ? "s" : ""}`);
  return parts.join(" ");
}

function monthsBetween(start, end) {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(months, 0);
}
function getCategoryDuration(experiences) {
  const ranges = (experiences ?? [])
    .filter((e) => e.startDate)
    .map((e) => ({
      start: new Date(e.startDate.slice(0, 10)),
      end: e.endDate ? new Date(e.endDate.slice(0, 10)) : new Date(),
    }))
    .sort((a, b) => a.start - b.start);

  if (ranges.length === 0) return "0 mos"; // <-- changed from ""

  const merged = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    const curr = ranges[i];
    if (curr.start <= last.end) {
      if (curr.end > last.end) last.end = curr.end;
    } else {
      merged.push({ ...curr });
    }
  }

  const totalMonths = merged.reduce((sum, r) => sum + monthsBetween(r.start, r.end), 0);
  return formatDuration(totalMonths) || "0 mos"; // <-- fallback in case formatDuration also returns ""
}

function formatDateRange(startDate, endDate) {
  if (!startDate) return "";
  const opts = { month: "short", year: "numeric" };
  const start = new Date(startDate.slice(0, 10)).toLocaleDateString("en-US", opts);
  const end = endDate ? new Date(endDate.slice(0, 10)).toLocaleDateString("en-US", opts) : "Present";
  return `${start} – ${end}`;
}
/* ---------- Icon button used in the card footer ---------- */

function IconAction({ label, onClick, href, children }) {
  const sharedClass = "w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200 border";
  const sharedStyle = { color: THEME.accent, borderColor: THEME.borderStrong, backgroundColor: `${THEME.accent}0D` };

  const handleEnter = (e) => {
    e.currentTarget.style.backgroundColor = THEME.accent;
    e.currentTarget.style.color = "#FFFFFF";
  };
  const handleLeave = (e) => {
    e.currentTarget.style.backgroundColor = `${THEME.accent}0D`;
    e.currentTarget.style.color = THEME.accent;
  };

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className={sharedClass}
        style={sharedStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={sharedClass}
      style={sharedStyle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </button>
  );
}

/* ---------- Experience card ---------- */

function ExperienceCard({ experience, onOpenDetails }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(experience)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpenDetails(experience);
      }}
      className="rounded-xl overflow-hidden border flex flex-col cursor-pointer transition-transform duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
    >
      <div className="w-full h-44 md:h-48 overflow-hidden" style={{ backgroundColor: THEME.textDark }}>
        <img src={experience.image} alt={experience.companyName} className="w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h4 className="text-base md:text-lg font-bold mb-2" style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}>
          {experience.companyName}
        </h4>
        <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
          {experience.role}
        </p>

        <div
          className="flex items-center gap-2 pt-3 border-t"
          style={{ borderColor: THEME.border }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconAction label={`About ${experience.companyName}`} onClick={() => onOpenDetails(experience)}>
            <InfoIcon />
          </IconAction>

          {experience.certificateUrl && (
            <IconAction label={`View ${experience.companyName} certificate`} href={experience.certificateUrl}>
              <LinkIcon />
            </IconAction>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Full grid — every card visible, no scrolling required ---------- */

function ExperienceGrid({ experiences, onOpenDetails }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {experiences.map((experience) => (
        <ExperienceCard key={experience.id} experience={experience} onOpenDetails={onOpenDetails} />
      ))}
    </div>
  );
}

/* ---------- Collapsible category block — smooth on mobile via grid-template-rows ---------- */

function CategorySection({ label, experiences, isExpanded, onToggle, onOpenDetails, iconIndex }) {
  const count = experiences?.length ?? 0;
  const totalDuration = getCategoryDuration(experiences);
  const CategoryGlyph = CATEGORY_ICONS[iconIndex % CATEGORY_ICONS.length];

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
          <CategoryGlyph />
        </span>

        <div className="flex-1 min-w-0">
          <h3
            className="text-sm md:text-base font-semibold tracking-wide"
            style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}
          >
            {label}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
            {count} {count === 1 ? "role" : "roles"} · Total {totalDuration} Of Experiences
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
                <ExperienceGrid experiences={experiences} onOpenDetails={onOpenDetails} />
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

/* ---------- Detail modal ---------- */
/*
  z-[9999] + backdrop-blur-md keeps this above every other fixed element
  (hamburger menu, sticky nav, etc.) and blurs everything behind it.
  The × button lives in a non-scrolling outer wrapper so it stays fixed
  in place at top-4 right-6 no matter how far the content is scrolled.
*/
function ExperienceModal({ experience, onClose }) {
  useEffect(() => {
    document.body.style.overflow = experience ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [experience]);

  if (!experience) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 backdrop-blur-md"
      style={{ backgroundColor: "rgba(15,31,27,0.55)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: THEME.cardBg }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-6 z-10 w-9 h-9 rounded-full shadow-md flex items-center justify-center text-lg"
          style={{ backgroundColor: THEME.cardBg, color: THEME.textDark }}
        >
          ×
        </button>

        <div className="max-h-[85vh] overflow-y-auto">
          <div className="w-full h-48 md:h-56 overflow-hidden" style={{ backgroundColor: THEME.textDark }}>
            <img src={experience.image} alt={experience.companyName} className="w-full h-full object-cover" />
          </div>

          <div className="p-6 md:p-7">
            <h3 className="text-xl md:text-2xl font-extrabold mb-1" style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}>
              {experience.companyName}
            </h3>

            <p className="text-sm mb-1" style={{ color: THEME.accent, fontFamily: THEME.fontFamily }}>
              {experience.role}
              {experience.duration ? ` · ${experience.duration}` : ""}
            </p>

            {experience.startDate && (
              <p className="text-xs mb-4" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
                {formatDateRange(experience.startDate, experience.endDate)}
              </p>
            )}

            <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: THEME.textBody, fontFamily: THEME.fontFamily }}>
              {experience.description}
            </p>

            {experience.techStack?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: THEME.accentLight, fontFamily: THEME.fontFamily }}>
                  Skills / tools
                </p>
                <div className="flex flex-wrap gap-2">
                  {experience.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-xs px-3 py-1.5 rounded-full border"
                      style={{ borderColor: THEME.borderStrong, color: THEME.accent, backgroundColor: `${THEME.accent}0D`, fontFamily: THEME.fontFamily }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {experience.certificateUrl && (
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={experience.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg"
                  style={{ backgroundColor: THEME.textDark, color: THEME.accentLight, fontFamily: THEME.fontFamily }}
                >
                  <LinkIcon /> Certificate
                </a>
              </div>
            )}
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
        <span style={{ color: THEME.accent, fontWeight: 600 }}>Tip:</span> click a category to see the roles
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

export default function Experience() {
  const [categories, setCategories] = useState(null); // [{ id, label, experiences: [...] }, ...] — fully backend-driven
  const [error, setError] = useState(false);
  const [activeExperience, setActiveExperience] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/experience`)
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
      id="experience"
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

      {/* Soft green blobs — same treatment as Header/Projects */}
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
          Where I've worked
        </p>
        <h2
          className="text-3xl md:text-6xl font-extrabold leading-tight mb-8 text-center md:text-left"
          style={{ color: THEME.textDark, fontFamily: THEME.headingFont }}
        >
          Experience
        </h2>

        {error ? (
          <p className="text-sm" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
            Couldn't load experience right now — please check back shortly.
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
                  experiences={category.experiences}
                  isExpanded={!!expanded[category.id]}
                  onToggle={() => toggleCategory(category.id)}
                  onOpenDetails={setActiveExperience}
                  iconIndex={index}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ExperienceModal experience={activeExperience} onClose={() => setActiveExperience(null)} />
    </section>
  );
}