import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { BACKEND_URL } from "./apiConfig";
import { google_auth_font } from "./theme";

const IDENTITY_STORAGE_KEY = "portfolio_visitor_identity";

function readStoredIdentity() {
  try {
    const raw = localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.name && parsed.email) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeStoredIdentity({ name, email }) {
  try {
    localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify({ name, email }));
  } catch {
    // localStorage unavailable (private mode / storage disabled) — silently ignore,
    // the cookie-based backend session check still works as a fallback.
  }
}

export default function GoogleLoginCorner() {
  const [status, setStatus] = useState("checking"); // checking | idle | success | error
  const [expanded, setExpanded] = useState(false);
  const [widgetDismissed, setWidgetDismissed] = useState(false);

  useEffect(() => {
    // 1. Check localStorage first — instant, and survives the mobile browsers
    //    that are inconsistent about persisting third-party/SameSite cookies.
    const stored = readStoredIdentity();
    if (stored) {
      setStatus("success");
      return;
    }

    // 2. Fall back to the existing backend cookie session check, in case
    //    localStorage was cleared but the cookie is still valid.
    fetch(`${BACKEND_URL}/api/google-login/session`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          // Backfill localStorage so next load skips the network call.
          writeStoredIdentity({ name: data.name, email: data.email });
          setStatus("success");
        } else {
          setStatus("idle");
        }
      })
      .catch(() => setStatus("idle"));
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("portfolio_visit_logged")) return;
    sessionStorage.setItem("portfolio_visit_logged", "1");

    fetch(`${BACKEND_URL}/api/track-visit`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      sessionStorage.removeItem("portfolio_visit_logged");
    });
  }, []);

  // Auto-close the hint line 10s after it's opened. Only runs while
  // `expanded` is true, and re-arms itself each time it's opened again.
  useEffect(() => {
    if (!expanded) return;
    const timer = setTimeout(() => setExpanded(false), 10000);
    return () => clearTimeout(timer);
  }, [expanded]);

  if (status === "success" || status === "checking" || widgetDismissed) return null;

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (!res.ok) throw new Error("Login logging failed");

      const data = await res.json();

      // Persist locally so this browser is recognized instantly on the next
      // page load, without depending on the cookie surviving.
      if (data?.name && data?.email) {
        writeStoredIdentity({ name: data.name, email: data.email });
      } else {
        // Backend didn't echo back name/email — decode it client-side isn't
        // safe/necessary here since Google's own credential payload already
        // has it, but we don't have it in this scope. Fall back to session
        // endpoint so localStorage still gets populated correctly.
        fetch(`${BACKEND_URL}/api/google-login/session`, { credentials: "include" })
          .then((r) => r.json())
          .then((sessionData) => {
            if (sessionData.loggedIn) {
              writeStoredIdentity({ name: sessionData.name, email: sessionData.email });
            }
          })
          .catch(() => {});
      }

      setStatus("success");
    } catch (err) {
      console.error("[GoogleLoginCorner] Login request failed:", err);
      setStatus("error");
    }
  };

  const handleError = () => setStatus("error");
  const handleOpen = () => setExpanded(true);
  const handleClose = () => setExpanded(false);
  const handleDismiss = () => setWidgetDismissed(true);

  return (
    <div className="fixed top-4 left-4 z-50">
      <div
        className="relative flex items-center gap-[clamp(4px,1.2vw,6px)] rounded-full border-2 border-white bg-white pl-[clamp(0.75rem,2vw,1.25rem)] pr-[clamp(0.5rem,1.5vw,0.85rem)] py-[clamp(0.4rem,1.5vw,0.6rem)] animate-[popIn_0.4s_ease-out]"
        style={{ boxShadow: "0 6px 16px rgba(15,31,27,.14)" }}
      >
        {/* Clickable logo — the real GoogleLogin button sits invisibly on top
            of it so the actual ID-token flow fires on click. Bigger on mobile
            only (base, unprefixed size); sm: and up resets to the original
            size so tablet/desktop are untouched. */}
        <div
          className="relative shrink-0 h-[clamp(calc(2.05rem+7px),5.3vw,calc(2.8rem+7px))] w-[clamp(calc(4.3rem+7px),11.3vw,calc(6.05rem+7px))] sm:h-[clamp(2.05rem,5.3vw,2.8rem)] sm:w-[clamp(4.3rem,11.3vw,6.05rem)] cursor-pointer transition-transform duration-300 ease-out hover:scale-105 [animation:shake_3s_ease-in-out_infinite] hover:[animation-play-state:paused]"
        >
          <img
            src="https://res.cloudinary.com/udlemxig/image/upload/v1789470191/d5wl1j0-b0a1b5d6-6448-4147-85a6-32241e6aa6dd-removebg-preview.png"
            alt="Google"
            className="h-full w-full select-none object-contain"
            draggable={false}
          />
          <div className="absolute inset-0 overflow-hidden opacity-0">
            <GoogleLogin onSuccess={handleSuccess} onError={handleError} size="large" />
          </div>
        </div>

        {/* MOBILE ONLY: just an X, always visible, no ">" / "<" / hint line at all */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="flex sm:hidden h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors duration-300 ease-out hover:bg-slate-100 hover:text-slate-500"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* DESKTOP/TABLET ONLY (sm and up): ">" toggle — shown only when collapsed */}
        {!expanded && (
          <button
            onClick={handleOpen}
            aria-label="Show info"
            className="hidden sm:flex h-[clamp(1.25rem,3.5vw,1.5rem)] w-[clamp(1.25rem,3.5vw,1.5rem)] shrink-0 items-center justify-center rounded-full text-[#16A34A] transition-all duration-300 ease-out hover:bg-[#16A34A]/10 active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        )}

        {/* DESKTOP/TABLET ONLY (sm and up): expandable hint line with "<" and "X" */}
        <div
          className="hidden sm:grid overflow-hidden transition-[grid-template-columns] duration-500 ease-in-out"
          style={{ gridTemplateColumns: expanded ? "1fr" : "0fr" }}
        >
          <div className="min-w-0 overflow-hidden">
            <div
              className={`flex items-center gap-[clamp(0.4rem,1.2vw,0.6rem)] whitespace-nowrap pl-[clamp(0.25rem,1vw,0.5rem)] transition-opacity duration-500 ease-in-out ${
                expanded ? "opacity-100 delay-150" : "opacity-0 delay-0"
              }`}
            >
              <button
                onClick={handleClose}
                aria-label="Hide info"
                className="flex h-[clamp(1.25rem,3.5vw,1.5rem)] w-[clamp(1.25rem,3.5vw,1.5rem)] shrink-0 items-center justify-center rounded-full text-[#16A34A] transition-all duration-300 ease-out hover:bg-[#16A34A]/10 active:scale-90"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>

              <p
                className="whitespace-nowrap text-[clamp(0.7rem,1.8vw,0.85rem)] leading-none text-slate-500"
                style={{ fontFamily: google_auth_font }}
              >
                give the logo a click so we know it's you! ✨
              </p>

              <button
                onClick={handleDismiss}
                aria-label="Dismiss"
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors duration-300 ease-out hover:bg-slate-100 hover:text-slate-500"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {status === "error" && (
          <p className="whitespace-nowrap text-[clamp(0.6rem,1.5vw,0.7rem)] text-rose-400">
            that didn't work — try again?
          </p>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: translateY(-8px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shake {
          0%, 88%, 100% { transform: rotate(0deg); }
          90% { transform: rotate(-9deg); }
          91.5% { transform: rotate(8deg); }
          93% { transform: rotate(-6deg); }
          94.5% { transform: rotate(6deg); }
          96% { transform: rotate(-3deg); }
          97.5% { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  );
}