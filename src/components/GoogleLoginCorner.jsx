import { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { BACKEND_URL } from "./apiConfig";
import { google_auth_font } from "./theme";

export default function GoogleLoginCorner() {
  const [status, setStatus] = useState("checking"); // checking | idle | success | error
  const [dismissed, setDismissed] = useState(false);

  // On mount, ask the backend if this browser already has a session cookie.
  // If so, skip showing the card entirely — no re-login, no expiry.
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/google-login/session`, {
      credentials: "include", // required so the cookie is sent/read
    })
      .then((res) => res.json())
      .then((data) => setStatus(data.loggedIn ? "success" : "idle"))
      .catch(() => setStatus("idle")); // if the check fails, just show the card
  }, []);

  // Log this visit regardless of whether they're signed in — the backend
  // logs them as "Anonymous" (with IP) if there's no session cookie, or by
  // name/email if there is one. Fire-and-forget: a logging failure should
  // never affect the UI.
  //
  // Guarded with sessionStorage so this only ever fires once per tab. This
  // matters for two reasons: (1) React StrictMode intentionally mounts
  // every component twice in development, which would otherwise fire this
  // effect — and the request — twice in a row; and (2) it also stops every
  // re-mount/navigation within the same tab from logging a fresh row.
  useEffect(() => {
    if (sessionStorage.getItem("portfolio_visit_logged")) return;
    sessionStorage.setItem("portfolio_visit_logged", "1");

    fetch(`${BACKEND_URL}/api/track-visit`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // If the request itself failed, allow a retry on the next mount
      // instead of permanently marking this tab as "already logged".
      sessionStorage.removeItem("portfolio_visit_logged");
    });
  }, []);

  if (dismissed || status === "success" || status === "checking") return null;

  const handleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // required so the backend's Set-Cookie sticks
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

  return (
    <div className="fixed top-4 left-4 z-50">
      <div
        className="relative flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)] rounded-full border-2 border-[#4285F4]/20 bg-white px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.4rem,1.5vw,0.6rem)] pr-[clamp(1.75rem,4vw,2.25rem)] shadow-lg animate-[popIn_0.4s_ease-out]"
        style={{ boxShadow: "0 6px 0 rgba(66,133,244,0.15), 0 10px 24px rgba(0,0,0,0.08)" }}
      >
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="absolute right-[clamp(0.4rem,1.2vw,0.6rem)] top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Clickable logo — the real GoogleLogin button sits invisibly on top
            of it so the actual ID-token flow still fires on click. The shake
            keyframe pulses briefly every 3s to draw the eye, and yields to a
            manual tilt+scale on hover. */}
        <div
          className="relative shrink-0 h-[clamp(1.75rem,5vw,2.5rem)] w-[clamp(4.5rem,13vw,6.5rem)] cursor-pointer transition-transform duration-300 hover:scale-105 [animation:shake_3s_ease-in-out_infinite] hover:[animation-play-state:paused]"
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

        <p
          className="whitespace-nowrap text-[clamp(0.7rem,1.8vw,0.85rem)] leading-none text-[#4285F4]"
          style={{ fontFamily: google_auth_font }}
        >
          give the logo a click so we know it's you! ✨
        </p>

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