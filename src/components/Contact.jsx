// Contact.jsx
import { useState, useEffect } from "react";

import { BACKEND_URL } from "./apiConfig";
import { useToast } from "./Toast";

// ---------- Single source of truth for font + colors, used everywhere below ----------
import THEME from "./theme";

/* ---------- Icons ---------- */

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.5 21 3 13.5 3 4.1c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.3 1L6.6 10.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.33 4.96L2 22l5.27-1.38a9.9 9.9 0 0 0 4.77 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.07c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.05.28-3.53-.73-3-1.22-4.9-4.24-5.05-4.44-.14-.2-1.2-1.6-1.2-3.05s.76-2.17 1.03-2.46c.27-.3.6-.37.8-.37.2 0 .4 0 .58.01.19.01.44-.07.68.53.25.6.85 2.08.92 2.23.07.14.12.32.02.51-.1.2-.15.32-.3.49-.15.17-.31.38-.44.5-.15.15-.3.3-.13.6.17.3.77 1.28 1.66 2.08 1.14 1.02 2.1 1.34 2.4 1.5.3.14.47.12.65-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.68-.15.28.1 1.78.84 2.08 1 .3.14.5.22.57.34.08.13.08.72-.16 1.4Z" />
    </svg>
  );
}

/* ---------- Contact info row (used for main + additional entries) ---------- */

function ContactRow({ icon, label, value, href }) {
  if (!value) return null;

  const content = (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3 border transition-colors duration-200"
      style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
    >
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${THEME.accent}0D`, color: THEME.accent }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p
          className="text-xs uppercase tracking-wide"
          style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}
        >
          {label}
        </p>
        <p
          className="text-sm md:text-base font-medium truncate"
          style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}
        >
          {value}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block hover:shadow-md transition-shadow duration-200 rounded-lg"
      >
        {content}
      </a>
    );
  }

  return content;
}

/* ---------- Info skeleton while loading ---------- */

function InfoSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div
        className="w-28 h-28 md:w-36 md:h-36 rounded-full mx-auto md:mx-0"
        style={{ backgroundColor: THEME.skeletonBg }}
      />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-14 rounded-lg" style={{ backgroundColor: THEME.skeletonBg }} />
      ))}
    </div>
  );
}

/* ---------- Shared field styling for the form (one place to edit) ---------- */

const fieldClass =
  "w-full rounded-lg px-5 py-3.5 text-sm md:text-base outline-none border transition-colors duration-200";

const fieldStyle = {
  borderColor: THEME.borderStrong,
  backgroundColor: THEME.fieldBg,
  color: THEME.textDark,
  fontFamily: THEME.fontFamily,
};

const fieldFocus = (e) => (e.currentTarget.style.borderColor = THEME.accent);
const fieldBlur = (e) => (e.currentTarget.style.borderColor = THEME.borderStrong);

/* ---------- Main section ---------- */

export default function Contact() {
  const { showToast } = useToast();

  const [info, setInfo] = useState(null);
  const [infoError, setInfoError] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/contact-info`)
      .then((res) => {
        if (!res.ok) throw new Error("backend not reachable");
        return res.json();
      })
      .then((data) => setInfo(data))
      .catch(() => setInfoError(true));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");

    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", message: "" });
        showToast(data.message || "Your message was sent successfully!", "success");
      } else {
        setStatus("error");
        showToast(data.error || "Something went wrong — please try again.", "error");
      }
    } catch {
      setStatus("error");
      showToast("Could not reach the server. Please try again later.", "error");
    } finally {
      setTimeout(() => setStatus("idle"), 4000);
    }
  };

  return (
    <section
      id="contact"
      className="relative w-full pt-16 pb-24 md:pt-20 md:pb-32 overflow-hidden"
      style={{ backgroundColor: THEME.sectionBg, scrollMarginTop: "80px" }}
    >
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${THEME.accent}22 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 75% 65% at 50% 25%, black 30%, transparent 88%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 25%, black 30%, transparent 88%)",
        }}
      />
      <div
        className="absolute -top-20 -left-20 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.accentLight}, transparent 70%)` }}
      />
      <div
        className="absolute bottom-0 -right-24 w-72 h-72 md:w-[26rem] md:h-[26rem] rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.accent}, transparent 70%)` }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-3 text-center md:text-left"
          style={{ color: THEME.accentLight, fontFamily: THEME.fontFamily }}
        >
          Let's talk
        </p>
        <h2
          className="text-3xl md:text-6xl font-extrabold leading-tight mb-14 text-center md:text-left"
          style={{ color: THEME.textDark, fontFamily: THEME.headingFont }}
        >
          Contact
        </h2>

        <div className="grid md:grid-cols-[1fr_1.2fr] gap-12 md:gap-16">
          {/* Left — my info, all from backend */}
          <div>
            {infoError ? (
              <p className="text-sm" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
                Couldn't load contact details right now — please check back shortly.
              </p>
            ) : info === null ? (
              <InfoSkeleton />
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center md:items-start gap-4">
                  <h3
                    className="text-xl md:text-2xl font-extrabold text-center md:text-left"
                    style={{ color: THEME.textDark, fontFamily: THEME.fontFamily }}
                  >
                    {info.name}
                  </h3>
                </div>

                <div className="flex flex-col gap-3">
                  <ContactRow icon={<PhoneIcon />} label="Phone" value={info.phone} href={info.phone ? `tel:${info.phone}` : null} />
                  <ContactRow icon={<MailIcon />} label="Email" value={info.email} href={info.email ? `mailto:${info.email}` : null} />
                  <ContactRow
                    icon={<WhatsappIcon />}
                    label="WhatsApp"
                    value={info.whatsapp}
                    href={info.whatsapp ? `https://wa.me/${info.whatsapp.replace(/[^\d]/g, "")}` : null}
                  />
                  <ContactRow icon={<PhoneIcon />} label="Additional Number" value={info.additionalPhone} href={info.additionalPhone ? `tel:${info.additionalPhone}` : null} />
                  <ContactRow icon={<MailIcon />} label="Additional Email" value={info.additionalEmail} href={info.additionalEmail ? `mailto:${info.additionalEmail}` : null} />
                </div>
              </div>
            )}
          </div>

          {/* Right — the form */}
          <div className="mt-8 md:mt-12">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border p-6 md:p-8 flex flex-col gap-4"
              style={{
                borderColor: THEME.borderStrong,
                background: `linear-gradient(180deg, ${THEME.cardBg}, ${THEME.fieldBg})`,
                boxShadow: `0 10px 30px -12px ${THEME.accent}22`,
              }}
            >
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
                className={fieldClass}
                style={fieldStyle}
                onFocus={fieldFocus}
                onBlur={fieldBlur}
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                className={fieldClass}
                style={fieldStyle}
                onFocus={fieldFocus}
                onBlur={fieldBlur}
              />

              <textarea
                name="message"
                placeholder="Enter What You Want to Say"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                className={`${fieldClass} resize-none`}
                style={fieldStyle}
                onFocus={fieldFocus}
                onBlur={fieldBlur}
              />

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-lg py-3.5 text-sm md:text-base font-semibold text-white transition-opacity duration-200 disabled:opacity-60"
                style={{ backgroundColor: THEME.accent, fontFamily: THEME.fontFamily }}
              >
                {status === "sending" ? "Sending..." : status === "sent" ? "Sent ✓" : "Send"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}