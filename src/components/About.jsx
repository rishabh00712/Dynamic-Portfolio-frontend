// About.jsx
import { useState, useEffect } from "react";

import { BACKEND_URL } from "./apiConfig";

// ---------- Single source of truth for font + colors — same shape as Header.jsx / Contact.jsx / Projects.jsx / Experience.jsx / Education.jsx / Certificates.jsx ----------
import THEME from "./theme";

export default function About() {
  const [summary, setSummary] = useState(null);
  const [activities, setActivities] = useState(null);
  const [aboutInfo, setAboutInfo] = useState(null);
  const [summaryError, setSummaryError] = useState(false);
  const [activitiesError, setActivitiesError] = useState(false);
  const [aboutInfoError, setAboutInfoError] = useState(false);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/about-summary`)
      .then((res) => {
        if (!res.ok) throw new Error("backend not reachable");
        return res.json();
      })
      .then((data) => setSummary(data.summary))
      .catch(() => setSummaryError(true));

    fetch(`${BACKEND_URL}/api/extracurricular`)
      .then((res) => {
        if (!res.ok) throw new Error("backend not reachable");
        return res.json();
      })
      .then((data) => setActivities(data.activities))
      .catch(() => setActivitiesError(true));

    fetch(`${BACKEND_URL}/api/about`)
      .then((res) => {
        if (!res.ok) throw new Error("backend not reachable");
        return res.json();
      })
      .then((data) => setAboutInfo(data))
      .catch(() => setAboutInfoError(true));
  }, []);

  return (
    <section
      id="about"
       className="relative w-full pt-14 pb-20 md:pt-16 md:pb-28 overflow-hidden"
      style={{ backgroundColor: THEME.sectionBg }}
    >
      {/* Dot-grid texture, consistent with Header but distinct tint marks a new section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${THEME.border} 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, black 30%, transparent 85%)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.accentLight}, transparent 70%)` }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-3 font-mono text-center md:text-left"
          style={{ color: THEME.accentLight }}
        >
          Get to know me
        </p>

        <h2
          className="text-3xl md:text-6xl font-extrabold leading-tight mb-14 text-center md:text-left"
          style={{ color: THEME.textDark, fontFamily: THEME.headingFont }}
        >
          About Me
        </h2>

        <div className="grid md:grid-cols-2 gap-12 md:gap-16">
          {/* Summary column */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-sm mb-6"
              style={{ backgroundColor: THEME.textDark, color: THEME.accentLight }}
            >
              <span style={{ color: THEME.accent }}>&gt;</span>
              <span style={{ color: THEME.sectionBg }}>Summary</span>
            </div>

            {summaryError ? (
              <p className="text-sm max-w-xl" style={{ color: THEME.textMuted }}>
                Couldn't load the sumamary right now — please check back shortly.
              </p>
            ) : summary === null ? (
              <SummarySkeleton />
            ) : (
              <p
                className="max-w-xl text-base md:text-lg leading-relaxed"
                style={{ color: THEME.textBody }}
              >
                {summary}
              </p>
            )}
            <p
          className="text-xs font-mono uppercase tracking-wide mt-8 mb-3"
          style={{ color: THEME.textMuted }}
        >
          Current preference
        </p>
            {/* Quick facts — balances this column against the activities list on desktop */}
            <div className="mt-4 flex flex-col gap-3 max-w-xl">
              {aboutInfoError ? (
                <p className="text-sm" style={{ color: THEME.textMuted }}>
                  Couldn't load quick facts right now — please check back shortly.
                </p>
              ) : aboutInfo === null ? (
                <QuickFactsSkeleton />
              ) : (
                Object.values(aboutInfo).map((fact) => (
  <div
    key={fact.label}
    className="flex items-center justify-between rounded-lg px-4 py-3 border"
    style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
  >
    <span className="text-xs font-mono uppercase tracking-wide" style={{ color: THEME.textMuted }}>
      {fact.label}
    </span>
    <span className="text-sm font-medium flex items-center gap-2" style={{ color: THEME.textDark }}>
      {fact.isOpen && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}
      {fact.value}
    </span>
  </div>
))
              )}
            </div>
          </div>

          {/* Extracurricular column */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-sm mb-6"
              style={{ backgroundColor: THEME.textDark, color: THEME.accentLight }}
            >
              <span style={{ color: THEME.accent }}>&gt;</span>
              <span style={{ color: THEME.sectionBg }}>Extracurricular Activities </span>
            </div>

            {activitiesError ? (
              <p className="text-sm max-w-xl" style={{ color: THEME.textMuted }}>
                Couldn't load activities right now — please check back shortly.
              </p>
            ) : activities === null ? (
              <ActivitiesSkeleton />
            ) : activities.length === 0 ? (
              <p className="text-sm max-w-xl" style={{ color: THEME.textMuted }}>
                Nothing to show here yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3 max-w-xl">
                {activities.map((activity, i) => {
                  const title = typeof activity === "string" ? activity : activity.title;
                  const description = typeof activity === "string" ? null : activity.description;

                  return (
                    <li
                      key={i}
                      className="rounded-lg px-5 py-4 border transition-colors duration-200"
                      style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="mt-1 w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: THEME.accent }}
                        />
                        <div>
                          <p
                            className="text-sm md:text-base font-medium leading-snug"
                            style={{ color: THEME.textDark }}
                          >
                            {title}
                          </p>
                          {description && (
                            <p className="text-sm mt-1 leading-relaxed" style={{ color: THEME.textMuted }}>
                              {description}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummarySkeleton() {
  return (
    <div className="max-w-xl flex flex-col gap-3 animate-pulse">
      <div className="h-4 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "100%" }} />
      <div className="h-4 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "92%" }} />
      <div className="h-4 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "85%" }} />
      <div className="h-4 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "60%" }} />
    </div>
  );
}

function ActivitiesSkeleton() {
  return (
    <div className="max-w-xl flex flex-col gap-3 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-lg px-5 py-4 border"
          style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
        >
          <div className="h-4 rounded mb-2" style={{ backgroundColor: THEME.skeletonBg, width: "70%" }} />
          <div className="h-3 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "90%" }} />
        </div>
      ))}
    </div>
  );
}

function QuickFactsSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg px-4 py-3 border"
          style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
        >
          <div className="h-3 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "70px" }} />
          <div className="h-3 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "110px" }} />
        </div>
      ))}
    </div>
  );
}