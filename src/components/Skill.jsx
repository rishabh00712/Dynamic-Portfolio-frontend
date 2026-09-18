// Skills.jsx
import { useState, useEffect, useMemo } from "react";

import { BACKEND_URL } from "./apiConfig";

// ---------- Single source of truth for font + colors — same shape as Header.jsx / Contact.jsx / Projects.jsx / Experience.jsx / Education.jsx / Certificates.jsx / About.jsx ----------
import THEME from "./theme";

/* ---------- Icons ---------- */

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 4 2 9l10 5 10-5-10-5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AwardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth="2" />
      <path d="M8.5 12.5 7 21l5-2.5L17 21l-1.5-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 4h6v6M20 4l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---------- Section type -> display config ---------- */
// url: which field on the item holds its external link ("domain"), if any.

const SECTION_CONFIG = {
  projects: { label: "Project", icon: FolderIcon, listKey: "projects", fieldKey: "techStack", nameKey: "name", urlKey: "liveUrl" },
  experience: { label: "Experience", icon: BriefcaseIcon, listKey: "experiences", fieldKey: "techStack", nameKey: "companyName", urlKey: "certificateUrl" },
  education: { label: "Education", icon: CapIcon, listKey: "educations", fieldKey: "subjects", nameKey: "institutionName", urlKey: "scoreCardUrl" },
  certificates: { label: "Certificate", icon: AwardIcon, listKey: "certificates", fieldKey: "skills", nameKey: "certificateName", urlKey: "certificateUrl" },
};

const SECTION_ORDER = ["projects", "experience", "education", "certificates"];

function normalize(str) {
  return String(str || "").trim().toLowerCase();
}

/* ---------- Build skill -> [{ type, name, url }] index from the four
   backend responses. Every matching item is listed (not just one per
   type), so if three projects use a skill, all three show up. --- */

function buildSkillIndex(dataBySection) {
  const index = {};

  for (const section of SECTION_ORDER) {
    const { listKey, fieldKey, nameKey, urlKey, label } = SECTION_CONFIG[section];
    const categories = dataBySection[section] || [];

    for (const category of categories) {
      const items = category[listKey] || [];
      for (const item of items) {
        const tags = item[fieldKey] || [];
        for (const tag of tags) {
          const key = normalize(tag);
          if (!key) continue;
          if (!index[key]) index[key] = [];
          index[key].push({
            type: section,
            typeLabel: label,
            domain: category.label, // e.g. "AI Development", "Backend Development", "Full-time"...
            name: item[nameKey],
            url: item[urlKey] || null,
          });
        }
      }
    }
  }

  return index;
}

/* ---------- One skill chip + its dropdown list of matching items ----------
   On mobile (< md) the panel is a fixed, centered overlay with a dimmed
   backdrop — an absolutely-positioned dropdown anchored to the chip runs
   off-screen on narrow viewports, which is why it looked broken on mobile.
   From md upward it reverts to an anchored dropdown, whose anchor side
   (left or right of the chip) is controlled by the `align` prop so
   right-column categories can open toward the left instead of running
   off the edge of the page. --------- */

function SkillChip({ skill, matches, isOpen, onToggle, align = "left" }) {
  const hasMatches = matches && matches.length > 0;

  return (
    <div className="relative inline-block">
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-xs md:text-sm font-mono px-3.5 py-2 rounded-lg border transition-all duration-200"
        style={{
          borderColor: isOpen ? THEME.accent : `${THEME.accent}33`,
          color: isOpen ? THEME.cardBg : THEME.textDark,
          backgroundColor: isOpen ? THEME.accent : THEME.cardBg,
          boxShadow: isOpen ? "none" : "0 1px 2px rgba(15,31,27,0.04)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = THEME.accent;
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.borderColor = `${THEME.accent}33`;
        }}
      >
        {skill}
        {hasMatches && (
          <>
            <span
              className="inline-flex items-center justify-center text-[10px] font-bold rounded-full w-4 h-4 leading-none"
              style={{
                backgroundColor: isOpen ? "rgba(255,255,255,0.25)" : `${THEME.accent}14`,
                color: isOpen ? THEME.cardBg : THEME.accent,
              }}
            >
              {matches.length}
            </span>
            <ChevronDownIcon open={isOpen} />
          </>
        )}
      </button>

      {isOpen && (
        <>
          {/* click-outside-to-close backdrop — dimmed on mobile since the
              panel now floats over the whole screen, invisible on desktop
              where it's just there to catch outside clicks */}
          <div
            className="fixed inset-0 z-10 bg-black/40 md:bg-transparent"
            onClick={onToggle}
          />

          <div
            className={`fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,320px)] rounded-xl border bg-white shadow-xl overflow-hidden md:absolute md:top-full md:mt-2 md:translate-x-0 md:translate-y-0 md:w-auto md:min-w-[260px] md:max-w-[320px] ${
              align === "right" ? "md:right-0 md:left-auto" : "md:left-0"
            }`}
            style={{ borderColor: `${THEME.accent}33` }}
            onClick={(e) => e.stopPropagation()}
          >
            {!hasMatches ? (
              <p className="text-xs px-4 py-3" style={{ color: THEME.textMuted }}>
                Not linked to a project, experience, education, or certificate yet.
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto py-1.5">
                {matches.map((match, i) => {
                  const Icon = SECTION_CONFIG[match.type].icon;
                  return (
                    <div
                      key={`${match.type}-${match.name}-${i}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
                          style={{ backgroundColor: `${THEME.accent}14`, color: THEME.accent }}
                        >
                          <Icon />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-mono uppercase tracking-wide truncate" style={{ color: THEME.accentLight }}>
                            {match.typeLabel}
                            {match.domain ? ` · ${match.domain}` : ""}
                          </p>
                          <p className="text-sm font-medium truncate" style={{ color: THEME.textDark }} title={match.name}>
                            {match.name}
                          </p>
                        </div>
                      </div>

                      {match.url && (
                        
                          <a href={match.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${match.name}`}
                          className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0 border transition-all duration-200"
                          style={{ color: THEME.accent, borderColor: `${THEME.accent}33`, backgroundColor: `${THEME.accent}0D` }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = THEME.accent;
                            e.currentTarget.style.color = THEME.cardBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = `${THEME.accent}0D`;
                            e.currentTarget.style.color = THEME.accent;
                          }}
                        >
                          <LinkIcon />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- One skill category card (Languages, Libraries, ...) ---------- */

function SkillCategory({ category, skillIndex, activeChip, onToggleChip, align }) {
  return (
    <div className="rounded-xl border bg-white p-5 md:p-6" style={{ borderColor: THEME.border }}>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: THEME.accent }} />
        <p className="text-xs md:text-sm font-mono uppercase tracking-[0.2em]" style={{ color: THEME.textDark }}>
          {category.label}
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {category.skills.map((skill) => {
          const chipKey = `${category.id}:${skill}`;
          return (
            <SkillChip
              key={chipKey}
              skill={skill}
              matches={skillIndex[normalize(skill)]}
              isOpen={activeChip === chipKey}
              onToggle={() => onToggleChip(activeChip === chipKey ? null : chipKey)}
              align={align}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Loading skeleton ---------- */

function LoadingSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-5 animate-pulse">
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="rounded-xl border bg-white p-5 md:p-6" style={{ borderColor: THEME.border }}>
          <div className="h-3 rounded mb-4" style={{ backgroundColor: THEME.skeletonBg, width: "120px" }} />
          <div className="flex flex-wrap gap-2.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 rounded-lg" style={{ backgroundColor: THEME.skeletonBg, width: `${70 + i * 12}px` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Main section ---------- */

export default function Skills() {
  const [skillCategories, setSkillCategories] = useState(null); // [{ id, label, skills: [...] }, ...]
  const [linkedData, setLinkedData] = useState({}); // { projects: [...], experience: [...], education: [...], certificates: [...] }
  const [error, setError] = useState(false);
  const [activeChip, setActiveChip] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/skills`).then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch(`${BACKEND_URL}/api/projects`).then((r) => (r.ok ? r.json() : { categories: [] })).catch(() => ({ categories: [] })),
      fetch(`${BACKEND_URL}/api/experience`).then((r) => (r.ok ? r.json() : { categories: [] })).catch(() => ({ categories: [] })),
      fetch(`${BACKEND_URL}/api/education`).then((r) => (r.ok ? r.json() : { categories: [] })).catch(() => ({ categories: [] })),
      fetch(`${BACKEND_URL}/api/certificates`).then((r) => (r.ok ? r.json() : { categories: [] })).catch(() => ({ categories: [] })),
    ])
      .then(([skillsRes, projectsRes, experienceRes, educationRes, certificatesRes]) => {
        setSkillCategories(skillsRes.categories || []);
        setLinkedData({
          projects: projectsRes.categories || [],
          experience: experienceRes.categories || [],
          education: educationRes.categories || [],
          certificates: certificatesRes.categories || [],
        });
      })
      .catch(() => setError(true));
  }, []);

  const skillIndex = useMemo(() => buildSkillIndex(linkedData), [linkedData]);

  return (
    <section
      id="skills"
      className="relative w-full pt-12 pb-24 md:pt-14 md:pb-32 overflow-hidden"
      style={{ backgroundColor: THEME.sectionBg, scrollMarginTop: "0px" }}
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
        <p className="text-xs tracking-[0.3em] uppercase mb-3 font-mono text-center md:text-left" style={{ color: THEME.accentLight }}>
          What I work with
        </p>
        <h2
          className="text-3xl md:text-6xl font-extrabold leading-tight mb-3 text-center md:text-left"
          style={{ color: THEME.textDark, fontFamily: THEME.headingFont }}
        >
          Skills
        </h2>
        <p className="text-sm mb-10 text-center md:text-left" style={{ color: THEME.textMuted }}>
          Click a skill to see where it shows up.
        </p>

        {error ? (
          <p className="text-sm" style={{ color: THEME.textMuted }}>
            Couldn't load skills right now — please check back shortly.
          </p>
        ) : skillCategories === null ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {skillCategories.map((category, idx) => (
              <SkillCategory
                key={category.id}
                category={category}
                skillIndex={skillIndex}
                activeChip={activeChip}
                onToggleChip={setActiveChip}
                align={idx % 2 === 0 ? "left" : "right"}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}