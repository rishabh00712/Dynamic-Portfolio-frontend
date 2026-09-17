// Certificates.jsx
import { useState, useEffect } from "react";

import { BACKEND_URL } from "./apiConfig";

// ---------- Single source of truth for font + colors — same shape as Header.jsx / Contact.jsx / Projects.jsx / Experience.jsx / Education.jsx ----------
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
  // ribbon / award
  (props) => (
    <svg {...props} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // shield check
  (props) => (
    <svg {...props} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // scroll / diploma
  (props) => (
    <svg {...props} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h9a3 3 0 0 1 3 3v13a2 2 0 0 1-2-2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 9h7M8 13h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
];

/* ---------- Icon button used in the card footer ---------- */

function IconAction({ label, onClick, href, children }) {
  const sharedClass = "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 border";
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

/* ---------- Certificate card ---------- */

function CertificateCard({ certificate, onOpenDetails }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(certificate)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpenDetails(certificate);
      }}
      className="rounded-xl overflow-hidden border flex flex-col cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
    >
      <div className="w-full h-44 md:h-48 overflow-hidden" style={{ backgroundColor: THEME.textDark }}>
        <img src={certificate.image} alt={certificate.certificateName} className="w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h4 className="text-base md:text-lg font-bold mb-2" style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}>
          {certificate.certificateName}
        </h4>
        <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
          {certificate.organization}
        </p>

        <div
          className="flex items-center gap-2 pt-3 border-t"
          style={{ borderColor: THEME.border }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconAction label={`About ${certificate.certificateName}`} onClick={() => onOpenDetails(certificate)}>
            <InfoIcon />
          </IconAction>

          {certificate.certificateUrl && (
            <IconAction label={`View ${certificate.certificateName} certificate`} href={certificate.certificateUrl}>
              <LinkIcon />
            </IconAction>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Full grid — every card visible, no scrolling required ---------- */

function CertificateGrid({ certificates, onOpenDetails }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {certificates.map((certificate) => (
        <CertificateCard key={certificate.id} certificate={certificate} onOpenDetails={onOpenDetails} />
      ))}
    </div>
  );
}

/* ---------- Collapsible category block — smooth on mobile via grid-template-rows ---------- */

function CategorySection({ label, certificates, isExpanded, onToggle, onOpenDetails, iconIndex }) {
  const count = certificates?.length ?? 0;
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
            {count} {count === 1 ? "certificate" : "certificates"}
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
                <CertificateGrid certificates={certificates} onOpenDetails={onOpenDetails} />
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
function CertificateModal({ certificate, onClose }) {
  useEffect(() => {
    document.body.style.overflow = certificate ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [certificate]);

  if (!certificate) return null;

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
            <img src={certificate.image} alt={certificate.certificateName} className="w-full h-full object-cover" />
          </div>

          <div className="p-6 md:p-7">
            <h3 className="text-xl md:text-2xl font-extrabold mb-1" style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}>
              {certificate.certificateName}
            </h3>

            <p className="text-sm mb-4" style={{ color: THEME.accent, fontFamily: THEME.fontFamily }}>
              {certificate.organization}
              {certificate.issuedDate ? ` · ${certificate.issuedDate}` : ""}
            </p>

            <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: THEME.textBody, fontFamily: THEME.fontFamily }}>
              {certificate.description}
            </p>

            {certificate.skills?.length > 0 && (
              <div className="mb-6">
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: THEME.accentLight, fontFamily: THEME.fontFamily }}>
                  Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {certificate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-3 py-1.5 rounded-full border"
                      style={{ borderColor: THEME.borderStrong, color: THEME.accent, backgroundColor: `${THEME.accent}0D`, fontFamily: THEME.fontFamily }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {certificate.certificateUrl && (
              <div className="flex items-center gap-3 pt-2">
                <a
                  href={certificate.certificateUrl}
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
        <span style={{ color: THEME.accent, fontWeight: 600 }}>Tip:</span> click a category to see its certificates
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

export default function Certificates() {
  const [categories, setCategories] = useState(null); // [{ id, label, certificates: [...] }, ...] — fully backend-driven
  const [error, setError] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/certificates`)
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
      id="certificates"
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

      {/* Soft green blobs — same treatment as Header/Projects/Experience/Education */}
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
          What I've earned
        </p>
        <h2
          className="text-3xl md:text-6xl font-extrabold leading-tight mb-8 text-center md:text-left"
          style={{ color: THEME.textDark, fontFamily: THEME.headingFont }}
        >
          Certificates
        </h2>

        {error ? (
          <p className="text-sm" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
            Couldn't load certificates right now — please check back shortly.
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
                  certificates={category.certificates}
                  isExpanded={!!expanded[category.id]}
                  onToggle={() => toggleCategory(category.id)}
                  onOpenDetails={setActiveCertificate}
                  iconIndex={index}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <CertificateModal certificate={activeCertificate} onClose={() => setActiveCertificate(null)} />
    </section>
  );
}