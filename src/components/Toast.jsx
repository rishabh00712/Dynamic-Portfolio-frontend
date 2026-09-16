import { createContext, useCallback, useContext, useRef, useState } from "react";
import THEME from "./theme"; // adjust path to wherever your THEME file lives

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 5000;
const EXIT_ANIMATION_MS = 400;

/**
 * Wrap your app once with <ToastProvider>, then anywhere deeper in the tree:
 *
 *   const { showToast } = useToast();
 *   showToast("Your message was sent successfully!");
 *   showToast("Something went wrong.", "error");
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { id, message, type, leaving }
  const timers = useRef({ dismiss: null, remove: null });

  const clearTimers = () => {
    clearTimeout(timers.current.dismiss);
    clearTimeout(timers.current.remove);
  };

  const showToast = useCallback((message, type = "success") => {
    clearTimers();
    const id = Date.now();
    setToast({ id, message, type, leaving: false });

    timers.current.dismiss = setTimeout(() => {
      setToast((current) => (current && current.id === id ? { ...current, leaving: true } : current));

      timers.current.remove = setTimeout(() => {
        setToast((current) => (current && current.id === id ? null : current));
      }, EXIT_ANIMATION_MS);
    }, AUTO_DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} leaving={toast.leaving} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside a <ToastProvider>");
  return ctx;
}

function Toast({ message, type, leaving }) {
  const isError = type === "error";

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translate(-50%, -120%); opacity: 0; }
          to   { transform: translate(-50%, 0);      opacity: 1; }
        }
        @keyframes toast-slide-out {
          from { transform: translate(-50%, 0);      opacity: 1; }
          to   { transform: translate(-50%, -120%);  opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .toast-anim { animation-duration: 0.01ms !important; }
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        className="toast-anim"
        style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          zIndex: 9999,
          maxWidth: "calc(100vw - 32px)",
          width: "420px",
          animation: `${leaving ? "toast-slide-out" : "toast-slide-in"} ${EXIT_ANIMATION_MS}ms ease forwards`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "14px 16px",
            borderRadius: "12px",
            background: THEME.cardBg,
            border: `1px solid ${isError ? "#B4483A33" : THEME.borderStrong}`,
            boxShadow: "0 8px 24px rgba(15, 31, 27, 0.12)",
            fontFamily: THEME.fontFamily,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              flexShrink: 0,
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: 700,
              color: "#fff",
              background: isError
                ? THEME.error
                : `linear-gradient(135deg, ${THEME.C1}, ${THEME.accent})`,
            }}
          >
            {isError ? "!" : "✓"}
          </span>

          <p
            style={{
              margin: 0,
              fontSize: "14.5px",
              lineHeight: 1.45,
              color: isError ? THEME.error : THEME.textBody,
              wordBreak: "break-word",
            }}
          >
            {message}
          </p>
        </div>
      </div>
    </>
  );
}