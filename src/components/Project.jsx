// Projects.jsx
import { useState, useEffect } from "react";

import { BACKEND_URL } from "./apiConfig";

// ---------- Single source of truth for font + colors — same shape as Header.jsx / Contact.jsx ----------
// ---------- Single source of truth for font + colors — same shape as Contact.jsx ----------
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

function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.16v3.2c0 .3.21.66.79.55A11.5 11.5 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

function ChevronIcon({ expanded }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="transition-transform duration-300 ease-in-out" style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>
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

// Category glyphs — purely decorative, cycled by index so any number of backend categories gets one
const CATEGORY_ICONS = [
  // code brackets
  (props) => (
    <svg {...props} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M8 5 3 12l5 7M16 5l5 7-5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  // server/stack
  (props) => (
    <svg {...props} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
      <circle cx="7" cy="17" r="1" fill="currentColor" />
    </svg>
  ),
  // spark / AI
  (props) => (
    <svg {...props} width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
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
      
        <a href={href}
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

/* ---------- Project card ---------- */

function ProjectCard({ project, onOpenDetails }) {
  return (
    <div
      onClick={() => onOpenDetails(project)}
      className="rounded-xl overflow-hidden border flex flex-col cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
    >
      <div className="w-full h-44 md:h-48 overflow-hidden" style={{ backgroundColor: THEME.textDark }}>
        <img src={project.image} alt={project.name} className="w-full h-full object-cover" loading="lazy" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h4 className="text-base md:text-lg font-bold mb-2" style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}>
          {project.name}
        </h4>
        <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
          {project.shortDescription}
        </p>

        <div
          className="flex items-center gap-2 pt-3 border-t"
          style={{ borderColor: THEME.border }}
          onClick={(e) => e.stopPropagation()}
        >
          <IconAction label={`About ${project.name}`} onClick={() => onOpenDetails(project)}>
            <InfoIcon />
          </IconAction>

          {project.liveUrl && (
            <IconAction label={`Open ${project.name} live`} href={project.liveUrl}>
              <LinkIcon />
            </IconAction>
          )}

          {project.githubUrl && (
            <IconAction label={`View ${project.name} on GitHub`} href={project.githubUrl}>
              <GithubIcon />
            </IconAction>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Full grid — every card visible, no scrolling required ---------- */

function ProjectGrid({ projects, onOpenDetails }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onOpenDetails={onOpenDetails} />
      ))}
    </div>
  );
}

/* ---------- Collapsible category block — now a proper card, not bare text ---------- */

function CategorySection({ label, projects, isExpanded, onToggle, onOpenDetails, iconIndex }) {
  const count = projects?.length ?? 0;
  const CategoryGlyph = CATEGORY_ICONS[iconIndex % CATEGORY_ICONS.length];

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-300"
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
            {count} {count === 1 ? "project" : "projects"}
          </p>
        </div>

        <span
          className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 transition-colors duration-200"
          style={{ backgroundColor: isExpanded ? THEME.accent : `${THEME.accent}14`, color: isExpanded ? "#FFFFFF" : THEME.accent }}
        >
          <ChevronIcon expanded={isExpanded} />
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: isExpanded ? "4000px" : "0px", opacity: isExpanded ? 1 : 0 }}
      >
        <div className="px-5 pb-6 pt-2 md:px-6 md:pb-7" style={{ borderTop: `1px solid ${THEME.border}` }}>
          <div className="pt-5">
            {count > 0 ? (
              <ProjectGrid projects={projects} onOpenDetails={onOpenDetails} />
            ) : (
              <p className="text-sm" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
                Nothing here yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Detail modal ---------- */

function ProjectModal({ project, onClose }) {
  useEffect(() => {
    document.body.style.overflow = project ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [project]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(15,31,27,0.55)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ backgroundColor: THEME.cardBg }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-48 md:h-56 overflow-hidden" style={{ backgroundColor: THEME.textDark }}>
          <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
        </div>

        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full shadow-md flex items-center justify-center text-lg"
          style={{ backgroundColor: THEME.cardBg, color: THEME.textDark }}
        >
          ×
        </button>

        <div className="p-6 md:p-7">
          <h3 className="text-xl md:text-2xl font-extrabold mb-4" style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}>
            {project.name}
          </h3>

          <p className="text-sm md:text-base leading-relaxed mb-6" style={{ color: THEME.textBody, fontFamily: THEME.fontFamily }}>
            {project.description}
          </p>

          {project.techStack?.length > 0 && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: THEME.accentLight, fontFamily: THEME.fontFamily }}>
                Tech stack
              </p>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech) => (
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

          {project.why && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: THEME.accentLight, fontFamily: THEME.fontFamily }}>
                Why I built this
              </p>
              <p className="text-sm leading-relaxed" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
                {project.why}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {project.liveUrl && (
              
                <a href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg"
                style={{ backgroundColor: THEME.textDark, color: THEME.accentLight, fontFamily: THEME.fontFamily }}
              >
                <LinkIcon /> Live demo
              </a>
            )}
            {project.githubUrl && (
              
                <a href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border"
                style={{ borderColor: THEME.borderStrong, color: THEME.accent, fontFamily: THEME.fontFamily }}
              >
                <GithubIcon /> Source
              </a>
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
        <span style={{ color: THEME.accent, fontWeight: 600 }}>Tip:</span> click a category to see its projects
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

export default function Projects() {
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/projects`)
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
      id="projects"
      className="relative w-full pt-16 pb-24 md:pt-20 md:pb-32 overflow-hidden"
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
          What I've built
        </p>
        <h2
          className="text-3xl md:text-6xl font-extrabold leading-tight mb-8 text-center md:text-left"
          style={{ color: THEME.textDark, fontFamily: THEME.headingFont }}
        >
          Projects
        </h2>

        {error ? (
          <p className="text-sm" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
            Couldn't load projects right now — please check back shortly.
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
                  projects={category.projects}
                  isExpanded={!!expanded[category.id]}
                  onToggle={() => toggleCategory(category.id)}
                  onOpenDetails={setActiveProject}
                  iconIndex={index}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <ProjectModal project={activeProject} onClose={() => setActiveProject(null)} />
    </section>
  );
}