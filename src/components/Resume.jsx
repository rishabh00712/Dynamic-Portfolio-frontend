// Resume.jsx
import { useState, useEffect } from "react";

import { BACKEND_URL } from "./apiConfig";

// ---------- Single source of truth for font + colors — same shape as Header.jsx / Contact.jsx / Projects.jsx / Experience.jsx / Education.jsx / Certificates.jsx / About.jsx / Skills.jsx ----------
import THEME from "./theme";

/* ---------- Icons ---------- */

function DocumentIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 4v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Resume card ---------- */

function ResumeCard({ resume }) {
  return (
    <div
      className="rounded-xl overflow-hidden border bg-white flex flex-col p-6 md:p-7"
      style={{ borderColor: THEME.border }}
    >
      <span
        className="flex items-center justify-center w-12 h-12 rounded-lg mb-5"
        style={{ backgroundColor: `${THEME.accent}14`, color: THEME.accent }}
      >
        <DocumentIcon />
      </span>

      <h4 className="text-base md:text-lg font-bold mb-2" style={{ color: THEME.textDark }}>
        {resume.title}
      </h4>

      <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: THEME.textMuted }}>
        {resume.description}
      </p>

      
        <a href={resume.downloadUrl}
        download={resume.fileName || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 text-sm font-mono px-4 py-2.5 rounded-lg transition-all duration-200"
        style={{ backgroundColor: THEME.textDark, color: THEME.accentLight }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <DownloadIcon /> Download resume
      </a>
    </div>
  );
}

/* ---------- Loading skeleton ---------- */

function LoadingSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border bg-white p-6 md:p-7" style={{ borderColor: THEME.border }}>
          <div className="w-12 h-12 rounded-lg mb-5" style={{ backgroundColor: THEME.skeletonBg }} />
          <div className="h-4 rounded mb-3" style={{ backgroundColor: THEME.skeletonBg, width: "70%" }} />
          <div className="h-3 rounded mb-2" style={{ backgroundColor: THEME.skeletonBg, width: "95%" }} />
          <div className="h-3 rounded mb-6" style={{ backgroundColor: THEME.skeletonBg, width: "80%" }} />
          <div className="h-9 rounded-lg" style={{ backgroundColor: THEME.skeletonBg, width: "160px" }} />
        </div>
      ))}
    </div>
  );
}

/* ---------- Main section ---------- */

export default function Resume() {
  const [resumes, setResumes] = useState(null); // [{ id, title, description, fileName, downloadUrl }, ...] — fully backend-driven
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/resume`)
      .then((res) => {
        if (!res.ok) throw new Error("backend not reachable");
        return res.json();
      })
      .then((data) => setResumes(data.resumes || []))
      .catch(() => setError(true));
  }, []);

  return (
    <section
      id="resume"
      className="relative w-full pt-16 pb-24 md:pt-20 md:pb-32 overflow-hidden"
      style={{ backgroundColor: THEME.sectionBg, scrollMarginTop: "80px" }}
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
          Take a copy with you
        </p>
        <h2
          className="text-3xl md:text-6xl font-extrabold leading-tight mb-8 text-center md:text-left"
          style={{ color: THEME.textDark, fontFamily: THEME.headingFont }}
        >
          Resume
        </h2>

        {error ? (
          <p className="text-sm" style={{ color: THEME.textMuted }}>
            Couldn't load resumes right now — please check back shortly.
          </p>
        ) : resumes === null ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}