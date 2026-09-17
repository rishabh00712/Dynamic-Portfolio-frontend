import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { BACKEND_URL } from "./apiConfig";
import { google_auth_font } from "./theme";

export default function GoogleLoginCorner() {
  const [status, setStatus] = useState("checking"); // checking | idle | success | error
  const [expanded, setExpanded] = useState(false); // is the hint line currently open
  const [widgetDismissed, setWidgetDismissed] = useState(false); // resets to false on every reload — nothing persisted

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/google-login/session`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setStatus(data.loggedIn ? "success" : "idle"))
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

  // Nothing renders once logged in, still checking, OR once the user has
  // dismissed the whole widget (logo included) for this page view.
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

      await res.json();
      setStatus("success");
    } catch (err) {
      console.error("[GoogleLoginCorner] Login request failed:", err);
      setStatus("error");
    }
  };

  const handleError = () => setStatus("error");

  // ">" — opens the hint line
  const handleOpen = () => setExpanded(true);

  // "<" — closes just the line; the ">" toggle comes back so it can be reopened
  const handleClose = () => setExpanded(false);

  // "X" — dismisses the ENTIRE widget (logo + everything), for this page
  // view only. Nothing is saved anywhere, so a reload brings it right back.
  const handleDismiss = () => setWidgetDismissed(true);

  return (
    <div className="fixed top-4 left-4 z-50">
      <div
        className="relative flex items-center gap-[clamp(0.15rem,0.6vw,0.3rem)] rounded-full border-2 border-[#4285F4]/20 bg-white pl-[clamp(0.75rem,2vw,1.25rem)] pr-[clamp(0.5rem,1.5vw,0.85rem)] py-[clamp(0.4rem,1.5vw,0.6rem)] shadow-lg animate-[popIn_0.4s_ease-out]"
        style={{ boxShadow: "0 6px 0 rgba(66,133,244,0.15), 0 10px 24px rgba(0,0,0,0.08)" }}
      >
        {/* Clickable logo — the real GoogleLogin button sits invisibly on top
            of it so the actual ID-token flow fires on click. */}
        <div
          className="relative shrink-0 h-[clamp(1.75rem,5vw,2.5rem)] w-[clamp(4rem,11vw,5.75rem)] cursor-pointer transition-transform duration-300 ease-out hover:scale-105 [animation:shake_3s_ease-in-out_infinite] hover:[animation-play-state:paused]"
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

        {/* ">" — shown only when collapsed */}
        {!expanded && (
          <button
            onClick={handleOpen}
            aria-label="Show info"
            className="flex h-[clamp(1.25rem,3.5vw,1.5rem)] w-[clamp(1.25rem,3.5vw,1.5rem)] shrink-0 items-center justify-center rounded-full text-[#4285F4] transition-all duration-300 ease-out hover:bg-[#4285F4]/10 active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        )}

        {/* Expandable hint line — holds both "<" (collapse) and "X" (dismiss whole widget) */}
        <div
          className="grid overflow-hidden transition-[grid-template-columns] duration-500 ease-in-out"
          style={{ gridTemplateColumns: expanded ? "1fr" : "0fr" }}
        >
          <div className="min-w-0 overflow-hidden">
            <div
              className={`flex items-center gap-[clamp(0.4rem,1.2vw,0.6rem)] whitespace-nowrap pl-[clamp(0.25rem,1vw,0.5rem)] transition-opacity duration-500 ease-in-out ${
                expanded ? "opacity-100 delay-150" : "opacity-0 delay-0"
              }`}
            >
              {/* "<" — collapses the line, ">" comes back so it can reopen */}
              <button
                onClick={handleClose}
                aria-label="Hide info"
                className="flex h-[clamp(1.25rem,3.5vw,1.5rem)] w-[clamp(1.25rem,3.5vw,1.5rem)] shrink-0 items-center justify-center rounded-full text-[#4285F4] transition-all duration-300 ease-out hover:bg-[#4285F4]/10 active:scale-90"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>

              <p
                className="whitespace-nowrap text-[clamp(0.7rem,1.8vw,0.85rem)] leading-none text-[#4285F4]"
                style={{ fontFamily: google_auth_font }}
              >
                give the logo a click so we know it's you! ✨
              </p>

              {/* "X" — dismisses the entire widget, logo included */}
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