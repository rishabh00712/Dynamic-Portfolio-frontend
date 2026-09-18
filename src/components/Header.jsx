// Header.jsx
import { useState, useEffect, useRef } from "react";

import { BACKEND_URL } from "./apiConfig";

// ---------- Single source of truth for font + colors — same shape as Contact.jsx ----------
import THEME from "./theme";
import { thead } from "framer-motion/client";

const NAV_LINKS = [
  { label: "Home", id: "home" },
  { label: "About", id: "about" },
  { label: "Projects", id: "projects" },
  { label: "Experience", id: "experience" },
  { label: "Education", id: "education" },
  { label: "Skills", id: "skills" },
  { label: "Certificates", id: "certificates" },
  { label: "Achievements", id: "achievements" },
  { label: "Contact", id: "contact" },
  { label: "Resume", id: "resume" },
];

/* ---------- Social icons — only rendered when backend supplies that id + url ---------- */

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.16v3.2c0 .3.21.66.79.55A11.5 11.5 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" />
    </svg>
  );
}

function LeetcodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M13.5 3.5 7 10c-.6.6-.9 1.4-.9 2.2s.3 1.6.9 2.2l4.8 4.8c1.2 1.2 3.2 1.2 4.4 0 .6-.6.9-1.4.9-2.2M9.5 12h9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CodeforcesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="10" width="5" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9.5" y="5" width="5" height="14" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="17" y="13" width="5" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CodechefIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.5 9.5c.6-1.2 1.9-2 3.5-2 2.2 0 4 1.5 4 3.3 0 1.4-1 2.3-2.3 2.7 1.5.4 2.6 1.4 2.6 3 0 2-1.9 3.5-4.3 3.5-1.6 0-3-.8-3.6-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const SOCIAL_ICON_MAP = {
  github: GithubIcon,
  linkedin: LinkedinIcon,
  leetcode: LeetcodeIcon,
  codeforces: CodeforcesIcon,
  codechef: CodechefIcon,
};

/* ---------- Hooks ---------- */

// FIX: throttle scroll handler to at most once per animation frame instead
// of once per native scroll event, so the whole Header doesn't re-render
// dozens of times per second while the user scrolls.
function useHideOnScroll(idleDelay = 800) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let scrollTimeout;
    let rafPending = false;

    const handleScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        rafPending = false;
        setVisible(false);
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => setVisible(true), idleDelay);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [idleDelay]);

  return visible;
}

function useTypewriter(words, typingSpeed = 75, deletingSpeed = 40, pause = 1400) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("typing");

  useEffect(() => {
    if (!words || words.length === 0) return;
    const current = words[wordIndex % words.length];
    let timeout;

    if (phase === "typing") {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), typingSpeed);
      } else {
        timeout = setTimeout(() => setPhase("pausing"), pause);
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("deleting"), pause / 2);
    } else if (phase === "deleting") {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(current.slice(0, text.length - 1)), deletingSpeed);
      } else {
        setWordIndex((i) => (i + 1) % words.length);
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [text, phase, wordIndex, words, typingSpeed, deletingSpeed, pause]);

  return text;
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [ids]);

  return active;
}

/* ---------- Shared pointer tracker ----------
   One global pointer position feeds BOTH effects below (the fluid canvas
   and the reactive heading), exactly like the original standalone demo
   where a single pointerClientX/Y drove everything. */

function usePointerTracker() {
  const pointerRef = useRef({ x: null, y: null, active: false });

  useEffect(() => {
    const handleMove = (e) => {
      const point = e.touches ? e.touches[0] : e;
      if (point) pointerRef.current = { x: point.clientX, y: point.clientY, active: true };
    };
    const handleLeave = () => {
      pointerRef.current = { x: null, y: null, active: false };
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("touchstart", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("mouseleave", handleLeave);
    window.addEventListener("touchend", handleLeave);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchstart", handleMove);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("touchend", handleLeave);
    };
  }, []);

  return pointerRef;
}

/* ---------- Shared "is scrolling right now" flag ----------
   Both heavy effects (fluid sim + fluid letters) check this instead of
   doing per-frame layout reads while the page is in motion. Scroll events
   set a flag; a short idle timer clears it. */

function useIsScrolling(idleDelay = 150) {
  const scrollingRef = useRef(false);

  useEffect(() => {
    let timeout;
    const handleScroll = () => {
      scrollingRef.current = true;
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        scrollingRef.current = false;
      }, idleDelay);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeout);
    };
  }, [idleDelay]);

  return scrollingRef;
}

// FIX: the fluid ripple canvas (stable-fluids solve + several canvas blur
// passes every frame) is by far the heaviest thing this component does.
// On phones there's also no hover/drag interaction to show it off, so we
// simply don't mount <FluidBackground> at all below this breakpoint.
// Desktops, laptops and tablets above the breakpoint are unaffected.
const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const handleChange = (e) => setIsMobile(e.matches);
    // Safari < 14 only supports addListener/removeListener; modern browsers
    // support addEventListener. Feature-detect so both work.
    if (mql.addEventListener) mql.addEventListener("change", handleChange);
    else mql.addListener(handleChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handleChange);
      else mql.removeListener(handleChange);
    };
  }, []);

  return isMobile;
}

/* ---------- Effect #1: reactive "liquid" letters ----------
   Same technique/constants as the fluid-surface demo's heading: each
   glyph's font-weight, scale and letter-spacing ease toward a target
   driven by an eased radial falloff around the pointer. Space
   characters never animate, so the line doesn't drift. */

const LETTER_INFLUENCE_RADIUS = 320;
const LETTER_MIN_WEIGHT = 150, LETTER_MAX_WEIGHT = 850;
const LETTER_MIN_SCALE = 1.0, LETTER_MAX_SCALE = 1.28;
const LETTER_MIN_LS = -0.02, LETTER_MAX_LS = 0.08;
const LETTER_EASE_ACTIVE = 0.15, LETTER_EASE_EXIT = 0.05;

// FIX: previously called el.getBoundingClientRect() for every letter on
// every animation frame. getBoundingClientRect forces a synchronous layout
// pass whenever anything is dirty, and during scroll that's basically every
// frame — this was the single biggest source of scroll jank alongside the
// canvas blur passes. Now we cache each letter's center once, and only
// recompute on resize or once scrolling has settled (not mid-scroll).
function useFluidLetters(text, pointerRef, isScrollingRef) {
  const lettersRef = useRef([]);
  const stateRef = useRef([]);
  const centersRef = useRef([]); // cached {cx, cy} per letter index
  const aliveRef = useRef(true);

  const recomputeCenters = () => {
    text.split("").forEach((ch, i) => {
      if (ch === " ") return;
      const el = lettersRef.current[i];
      if (!el) return;
      const rect = el.getBoundingClientRect();
      centersRef.current[i] = {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
      };
    });
  };

  useEffect(() => {
    aliveRef.current = true;

    text.split("").forEach((ch, i) => {
      if (ch === " ") return;
      if (!stateRef.current[i]) {
        stateRef.current[i] = { w: LETTER_MIN_WEIGHT, s: LETTER_MIN_SCALE, l: LETTER_MIN_LS };
      }
    });

    // Initial measurement (layout is stable right after mount/paint).
    recomputeCenters();

    let resizeRaf;
    const handleResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(recomputeCenters);
    };
    window.addEventListener("resize", handleResize);

    // Letters live in a fixed hero layout, so their position relative to
    // the viewport only changes with scroll. Instead of re-measuring every
    // frame, re-measure once when scrolling stops.
    let wasScrolling = false;

    let raf;
    let prevTime = performance.now();

    const animate = (now) => {
      if (!aliveRef.current) return;
      let dt = (now - prevTime) / 1000;
      prevTime = now;
      if (!(dt > 0)) dt = 1 / 60;

      const scrolling = isScrollingRef?.current;
      if (wasScrolling && !scrolling) {
        // Scrolling just stopped — refresh cached centers once.
        recomputeCenters();
      }
      wasScrolling = !!scrolling;

      const p = pointerRef.current;
      // Skip pointer-driven excitement entirely while actively scrolling —
      // cheap check, avoids per-letter math when the user isn't even
      // hovering intentionally.
      const active = !scrolling && p.active && p.x !== null;
      const mx = active ? p.x : -1e9;
      const my = active ? p.y : -1e9;
      const baseEase = active ? LETTER_EASE_ACTIVE : LETTER_EASE_EXIT;
      const step = Math.min(dt, 0.05);
      const k = 1 - Math.pow(1 - baseEase, step * 60);

      text.split("").forEach((ch, i) => {
        if (ch === " ") return;
        const el = lettersRef.current[i];
        if (!el) return;

        const center = centersRef.current[i];
        if (!center) return;
        const { cx, cy } = center;
        const dx = cx - mx;
        const dy = cy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let inf = 0;
        if (dist < LETTER_INFLUENCE_RADIUS) {
          inf = 1 - dist / LETTER_INFLUENCE_RADIUS;
          inf = inf * inf * (3 - 2 * inf); // smoothstep falloff
        }

        const tw = LETTER_MIN_WEIGHT + (LETTER_MAX_WEIGHT - LETTER_MIN_WEIGHT) * inf;
        const ts = LETTER_MIN_SCALE + (LETTER_MAX_SCALE - LETTER_MIN_SCALE) * inf;
        const tl = LETTER_MIN_LS + (LETTER_MAX_LS - LETTER_MIN_LS) * inf;

        const st = stateRef.current[i];
        st.w += (tw - st.w) * k;
        st.s += (ts - st.s) * k;
        st.l += (tl - st.l) * k;

        el.style.setProperty("--fw", st.w.toFixed(1));
        el.style.setProperty("--sc", st.s.toFixed(3));
        el.style.setProperty("--ls", `${st.l.toFixed(4)}em`);
      });

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => {
      aliveRef.current = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, pointerRef, isScrollingRef]);

  return (i) => (el) => {
    if (el) lettersRef.current[i] = el;
  };
}

function FluidLetter({ letter, style, letterRef, isSpace }) {
  return (
    <span
      ref={letterRef}
      className="inline-block select-none"
      style={
        isSpace
          ? { ...style, fontWeight: 200, letterSpacing: 0, transform: "none" }
          : {
              ...style,
              fontWeight: "var(--fw, 150)",
              letterSpacing: "var(--ls, -0.02em)",
              transform: "scale(var(--sc, 1))",
              transformOrigin: "center bottom",
              willChange: "transform, font-weight",
            }
      }
    >
      {letter === " " ? "\u00A0" : letter}
    </span>
  );
}

// NEW: groups the per-letter FluidLetter spans so that a whole word wraps
// as a single unit instead of breaking mid-word. Each run of non-space
// characters is wrapped in an inline-block, white-space: nowrap container;
// space characters are rendered directly between those containers, which
// is where the browser is still allowed to break the line. Letter indices
// (used for refs/measurement in useFluidLetters) are preserved exactly as
// before — this only changes how the spans are grouped in the JSX tree,
// not the animation logic itself.
function renderFluidHeading(headingText, getLetterRef, letterStyle) {
  const chars = headingText.split("");
  const elements = [];
  let wordBuffer = [];
  let wordKey = null;

  const flushWord = () => {
    if (wordBuffer.length === 0) return;
    elements.push(
      <span key={`word-${wordKey}`} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
        {wordBuffer}
      </span>
    );
    wordBuffer = [];
    wordKey = null;
  };

  chars.forEach((letter, i) => {
    const isSpace = letter === " ";
    if (isSpace) {
      flushWord();
      elements.push(
        <FluidLetter key={i} letter={letter} isSpace={true} style={letterStyle} letterRef={undefined} />
      );
    } else {
      if (wordKey === null) wordKey = i;
      wordBuffer.push(
        <FluidLetter key={i} letter={letter} isSpace={false} style={letterStyle} letterRef={getLetterRef(i)} />
      );
    }
  });
  flushWord();

  return elements;
}

/* ---------- Effect #2: fluid ripple background ----------
   A tiny stable-fluids solver (Jos Stam, "Real-Time Fluid Dynamics for
   Games"). Rendering is wave-only: the density field becomes glowing
   contour ripples that trail the pointer and melt away when it stops
   or leaves — same behaviour as the standalone demo, now painted with
   THEME colors and sized to the hero section instead of the full page. */

function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const bigint = parseInt(full, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// FIX: this component previously ran the full fluid solve + 4 canvas
// blur() passes every single frame regardless of visibility or scroll
// state. ctx.filter = 'blur()' is a genuinely expensive per-pixel
// convolution, and running it 4x/frame plus a 96x96 Jacobi solve was the
// dominant cost during scroll (main thread starves the compositor).
// Now: (1) an IntersectionObserver pauses the whole rAF loop when the
// hero is off-screen, (2) the loop is throttled to a lower step rate
// while the page is actively scrolling instead of running at full cost,
// and (3) one blur layer is dropped / iteration counts trimmed.
function FluidBackground({ pointerRef, isScrollingRef }) {
  const canvasRef = useRef(null);
  const cursorDotRef = useRef(null);
  const containerVisibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cursorDot = cursorDotRef.current;
    const ctx = canvas.getContext("2d");

    // Visibility gate: don't run the sim at all when the hero section is
    // scrolled out of view.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          containerVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const N = 96;
    const SIZE = N + 2;
    const IX = (x, y) => x + SIZE * y;
    const makeField = () => new Float32Array(SIZE * SIZE);

    let u = makeField(), v = makeField();
    let u0 = makeField(), v0 = makeField();
    let dens = makeField(), dens0 = makeField();
    let uSrc = makeField(), vSrc = makeField(), densSrc = makeField();
    const curlField = makeField();

    const DT = 0.1;
    const DIFF = 0.00002;
    const DIFFUSE_ITERS = 2;
    // FIX: trimmed from 12 -> 8. Visually near-identical for this size
    // grid/use-case, meaningfully cheaper per frame.
    const PROJECT_ITERS = 8;
    const VORTICITY_EPS = 12.0;

    const addSource = (x, s, dt) => {
      for (let i = 0; i < x.length; i++) x[i] += dt * s[i];
    };

    const setBnd = (b, x) => {
      for (let i = 1; i <= N; i++) {
        x[IX(0, i)] = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
        x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
        x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
        x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
      }
      x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
      x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
      x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
      x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
    };

    const diffuse = (b, x, x0, diff, dt) => {
      const a = dt * diff * N * N;
      if (a === 0) {
        x.set(x0);
        setBnd(b, x);
        return;
      }
      for (let k = 0; k < DIFFUSE_ITERS; k++) {
        for (let j = 1; j <= N; j++) {
          for (let i = 1; i <= N; i++) {
            x[IX(i, j)] =
              (x0[IX(i, j)] +
                a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) /
              (1 + 4 * a);
          }
        }
        setBnd(b, x);
      }
    };

    const advect = (b, d, d0, uu, vv, dt) => {
      const dt0 = dt * N;
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          let x = i - dt0 * uu[IX(i, j)];
          let y = j - dt0 * vv[IX(i, j)];
          if (x < 0.5) x = 0.5;
          if (x > N + 0.5) x = N + 0.5;
          const i0 = Math.floor(x), i1 = i0 + 1;
          if (y < 0.5) y = 0.5;
          if (y > N + 0.5) y = N + 0.5;
          const j0 = Math.floor(y), j1 = j0 + 1;
          const s1 = x - i0, s0 = 1 - s1, t1 = y - j0, t0 = 1 - t1;
          d[IX(i, j)] =
            s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
            s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
        }
      }
      setBnd(b, d);
    };

    const project = (uu, vv, p, div) => {
      const h = 1.0 / N;
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          div[IX(i, j)] =
            -0.5 * h * (uu[IX(i + 1, j)] - uu[IX(i - 1, j)] + vv[IX(i, j + 1)] - vv[IX(i, j - 1)]);
          p[IX(i, j)] = 0;
        }
      }
      setBnd(0, div);
      setBnd(0, p);
      for (let k = 0; k < PROJECT_ITERS; k++) {
        for (let j = 1; j <= N; j++) {
          for (let i = 1; i <= N; i++) {
            p[IX(i, j)] =
              (div[IX(i, j)] + p[IX(i - 1, j)] + p[IX(i + 1, j)] + p[IX(i, j - 1)] + p[IX(i, j + 1)]) / 4;
          }
        }
        setBnd(0, p);
      }
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          uu[IX(i, j)] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]) / h;
          vv[IX(i, j)] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]) / h;
        }
      }
      setBnd(1, uu);
      setBnd(2, vv);
    };

    const vorticityConfinement = (dt) => {
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          curlField[IX(i, j)] =
            0.5 * (v[IX(i + 1, j)] - v[IX(i - 1, j)] - (u[IX(i, j + 1)] - u[IX(i, j - 1)]));
        }
      }
      for (let j = 2; j < N; j++) {
        for (let i = 2; i < N; i++) {
          const idx = IX(i, j);
          let dx = (Math.abs(curlField[IX(i + 1, j)]) - Math.abs(curlField[IX(i - 1, j)])) * 0.5;
          let dy = (Math.abs(curlField[IX(i, j + 1)]) - Math.abs(curlField[IX(i, j - 1)])) * 0.5;
          const len = Math.sqrt(dx * dx + dy * dy) + 1e-5;
          dx /= len;
          dy /= len;
          const c = curlField[idx];
          u[idx] += VORTICITY_EPS * dy * c * dt;
          v[idx] -= VORTICITY_EPS * dx * c * dt;
        }
      }
    };

    const velStep = (dt) => {
      addSource(u, uSrc, dt);
      addSource(v, vSrc, dt);
      uSrc.fill(0);
      vSrc.fill(0);

      project(u, v, u0, v0);

      u0.set(u);
      v0.set(v);
      advect(1, u, u0, u0, v0, dt);
      advect(2, v, v0, u0, v0, dt);

      vorticityConfinement(dt);
      project(u, v, u0, v0);
    };

    const densStep = (dt) => {
      addSource(dens, densSrc, dt);
      densSrc.fill(0);

      dens0.set(dens);
      diffuse(0, dens, dens0, DIFF, dt);

      dens0.set(dens);
      advect(0, dens, dens0, u, v, dt);

      for (let i = 0; i < dens.length; i++) {
        if (dens[i] > 1.25) dens[i] = 1.25;
      }
    };

    // ---- fade pass: melts ripples back to nothing on idle / pointer-out ----
    const REVEAL_RADIUS = 11, REVEAL_FEATHER = 14;
    const D_NEAR = 0.72, D_FAR = 0.1, D_IDLE = 0.008;
    const V_NEAR = 0.86, V_FAR = 0.34, V_IDLE = 0.028;
    const RAMP_STEPS = 32;
    const densLUT = new Float32Array(RAMP_STEPS + 1);
    const velLUT = new Float32Array(RAMP_STEPS + 1);
    let lastMoveTime = -1e9;
    let pointerGrid = null;
    let pointerActive = false;

    const buildFadeLUT = (dt, idleT) => {
      for (let k = 0; k <= RAMP_STEPS; k++) {
        const t = k / RAMP_STEPS;
        let dr = D_NEAR + (D_FAR - D_NEAR) * t;
        let vr = V_NEAR + (V_FAR - V_NEAR) * t;
        dr += (D_IDLE - dr) * idleT;
        vr += (V_IDLE - vr) * idleT;
        densLUT[k] = Math.pow(dr, dt);
        velLUT[k] = Math.pow(vr, dt);
      }
    };

    const fadePass = (dt) => {
      const idleSec = (performance.now() - lastMoveTime) / 1000;
      let idleT = (idleSec - 0.1) / 1.15;
      idleT = idleT < 0 ? 0 : idleT > 1 ? 1 : idleT;
      idleT = idleT * idleT * (3 - 2 * idleT);

      buildFadeLUT(dt, idleT);

      const live = pointerActive && pointerGrid !== null;
      const px = live ? pointerGrid[0] : -9999;
      const py = live ? pointerGrid[1] : -9999;

      for (let j = 1; j <= N; j++) {
        const dy = j - py;
        for (let i = 1; i <= N; i++) {
          const idx = IX(i, j);
          const d = dens[idx];
          const uu = u[idx];
          const vv = v[idx];
          if (d === 0 && uu === 0 && vv === 0) continue;

          let k = RAMP_STEPS;
          if (live) {
            const dist = Math.sqrt((i - px) * (i - px) + dy * dy);
            let t = (dist - REVEAL_RADIUS) / REVEAL_FEATHER;
            t = t < 0 ? 0 : t > 1 ? 1 : t;
            t = t * t * (3 - 2 * t);
            k = (t * RAMP_STEPS) | 0;
          }

          const dm = densLUT[k];
          const vm = velLUT[k];
          const nd = d * dm;
          const nu = uu * vm;
          const nv = vv * vm;

          dens[idx] = nd < 0.004 ? 0 : nd;
          u[idx] = nu < 0.004 && nu > -0.004 ? 0 : nu;
          v[idx] = nv < 0.004 && nv > -0.004 ? 0 : nv;
        }
      }
    };

    // ---- pointer -> grid splats ----
    const SPLAT_SIGMA = 2.2, SPLAT_R = 4;
    const INV_2S2 = 1 / (2 * SPLAT_SIGMA * SPLAT_SIGMA);

    const splat = (gx, gy, du, dv, dd) => {
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      for (let j = y0 - SPLAT_R; j <= y0 + SPLAT_R; j++) {
        if (j < 1 || j > N) continue;
        const ddy = j - gy;
        for (let i = x0 - SPLAT_R; i <= x0 + SPLAT_R; i++) {
          if (i < 1 || i > N) continue;
          const ddx = i - gx;
          const f = Math.exp(-(ddx * ddx + ddy * ddy) * INV_2S2);
          if (f < 0.02) continue;
          const idx = IX(i, j);
          uSrc[idx] += du * f;
          vSrc[idx] += dv * f;
          densSrc[idx] += dd * f;
        }
      }
    };

    let last = null;

    // "Activity" — eased 0..1 level driven by how fast the pointer is
    // dragging, same role as the orb's uActive. Feeds the rim glow below
    // so fast drags flare brighter, slow ones stay gentle.
    let activityTarget = 0;
    let activityLevel = 0;

    const pointerToGrid = (px, py) => {
      const rect = canvas.getBoundingClientRect();
      const gx = Math.floor(((px - rect.left) / rect.width) * N) + 1;
      const gy = Math.floor(((py - rect.top) / rect.height) * N) + 1;
      return [Math.min(Math.max(gx, 1), N), Math.min(Math.max(gy, 1), N)];
    };

    const pointerStep = () => {
      const p = pointerRef.current;
      const rect = canvas.getBoundingClientRect();
      const inside =
        p.active &&
        p.x !== null &&
        p.x >= rect.left &&
        p.x <= rect.right &&
        p.y >= rect.top &&
        p.y <= rect.bottom;

      if (!inside) {
        pointerActive = false;
        pointerGrid = null;
        last = null;
        activityTarget = 0;
        if (cursorDot) cursorDot.style.opacity = "0";
        return;
      }

      pointerActive = true;
      pointerGrid = pointerToGrid(p.x, p.y);
      if (cursorDot) {
        cursorDot.style.left = p.x + "px";
        cursorDot.style.top = p.y + "px";
        cursorDot.style.opacity = "1";
        // Cursor halo flares with the same activity level as the wave rim.
        const glowScale = 1 + activityLevel * 0.6;
        cursorDot.style.boxShadow = `0 0 ${Math.round(26 * glowScale)}px ${Math.round(
          8 * glowScale
        )}px ${THEME.fluidGlowSoft || "#7dffb0"}${Math.round(90 + activityLevel * 40)
          .toString(16)
          .padStart(2, "0")}`;
      }

      const [gx, gy] = pointerGrid;
      if (!last) {
        last = [gx, gy];
        return;
      }

      const dx = gx - last[0];
      const dy = gy - last[1];
      const speed = Math.sqrt(dx * dx + dy * dy);
      if (speed < 0.03) {
        last = [gx, gy];
        activityTarget *= 0.9;
        return;
      }

      lastMoveTime = performance.now();
      activityTarget = Math.min(1, speed / 2.2);

      const steps = Math.min(14, Math.max(1, Math.ceil(speed / 0.7)));
      const vmag = Math.min(3.4, 1.0 + speed * 1.25);
      const dmag = Math.min(14, 5 + speed * 2.8);
      const inv = 1 / (speed || 1);
      const dirx = dx * inv, diry = dy * inv;

      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const x = last[0] + dx * t;
        const y = last[1] + dy * t;
        splat(x, y, (dirx * vmag) / steps, (diry * vmag) / steps, dmag / steps);
      }

      last = [gx, gy];
    };

    // ---- render: wave-only glow, colored from THEME ----
    const simCanvas = document.createElement("canvas");
    simCanvas.width = N;
    simCanvas.height = N;
    const simCtx = simCanvas.getContext("2d");
    const imgData = simCtx.createImageData(N, N);

    const GW = N * 4, GH = N * 4;
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = GW;
    glowCanvas.height = GH;
    const glowCtx = glowCanvas.getContext("2d");

    // Wave color ramp.
    const C0 = hexToRgb(THEME.C0); // icy mint highlight
    const C1 = hexToRgb(THEME.C1); // electric green mid
    const C2 = hexToRgb(THEME.C2); // intense neon core

    // Rim glow — the AI-orb trick ported to 2D.
    const RIM = hexToRgb("#f2fff8");
    const RIM_GAIN = 18;
    const RIM_POWER = 1.6;

    const WAVE_FREQ = 10.5, WAVE_SHARP = 7.0, CURL_WARP = 0.55;
    const mix = (a, b, t) => a + (b - a) * t;
    const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);

    const buildImage = (time, activity) => {
      const data = imgData.data;
      const shimmer = time * 0.09;

      for (let j = 1; j <= N; j++) {
        const row = (j - 1) * N;
        for (let i = 1; i <= N; i++) {
          const o = (row + (i - 1)) * 4;
          const idx = IX(i, j);
          const d = dens[idx];

          if (d < 0.004) {
            data[o + 3] = 0;
            continue;
          }

          const phase = d * WAVE_FREQ + curlField[idx] * CURL_WARP + shimmer;
          const s = Math.sin(phase * Math.PI);
          let band = Math.pow(Math.abs(s), WAVE_SHARP);

          if (band < 0.012) {
            data[o + 3] = 0;
            continue;
          }

          const sp = Math.sqrt(u[idx] * u[idx] + v[idx] * v[idx]);
          const boost = 1 + (sp < 1.1 ? sp * 0.9 : 1);

          let env = d * 1.5;
          if (env > 1) env = 1;
          env = Math.pow(env, 0.55);

          let a = band * env * boost;
          if (a > 1) a = 1;
          if (a < 0.012) {
            data[o + 3] = 0;
            continue;
          }

          const gx = dens[IX(i + 1, j)] - dens[IX(i - 1, j)];
          const gy = dens[IX(i, j + 1)] - dens[IX(i, j - 1)];
          const gradMag = Math.sqrt(gx * gx + gy * gy);
          const rim = Math.pow(clamp01(gradMag * RIM_GAIN), RIM_POWER);
          const rimGain = rim * (0.45 + activity * 0.55);

          a = Math.min(1, a + rimGain * 0.6);

          let r, g, b;
          const t = d > 1.15 ? 1 : d / 1.15;
          if (t < 0.5) {
            const k = t * 2;
            r = mix(C0[0], C1[0], k);
            g = mix(C0[1], C1[1], k);
            b = mix(C0[2], C1[2], k);
          } else {
            const k = (t - 0.5) * 2;
            r = mix(C1[0], C2[0], k);
            g = mix(C1[1], C2[1], k);
            b = mix(C1[2], C2[2], k);
          }

          r = mix(r, RIM[0], rimGain);
          g = mix(g, RIM[1], rimGain);
          b = mix(b, RIM[2], rimGain);

          data[o] = r;
          data[o + 1] = g;
          data[o + 2] = b;
          data[o + 3] = a * 255;
        }
      }
      simCtx.putImageData(imgData, 0, 0);
    };

    const glowLayer = (blurPx, alpha) => {
      glowCtx.clearRect(0, 0, GW, GH);
      glowCtx.filter = `blur(${blurPx}px)`;
      glowCtx.imageSmoothingEnabled = true;
      glowCtx.imageSmoothingQuality = "high";
      glowCtx.drawImage(simCanvas, 0, 0, N, N, 0, 0, GW, GH);
      glowCtx.filter = "none";

      ctx.globalAlpha = alpha;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(glowCanvas, 0, 0, GW, GH, 0, 0, canvas.width, canvas.height);
    };

    // FIX: dropped from 4 blur layers to 3 (removed the widest/cheapest-
    // looking-but-most-expensive 22px pass — the 12px + 6px + 2.2px stack
    // reads almost identically). This alone removes one full canvas
    // filter-blur convolution per frame.
    const render = (time, activity) => {
      buildImage(time, activity);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";

      const gb = activity * 0.18;
      glowLayer(12, 0.44 + gb);
      glowLayer(6, 0.6 + gb * 1.2);
      glowLayer(2.2, Math.min(1, 0.85 + gb * 1.4));

      ctx.globalAlpha = 1;
      ctx.filter = "blur(0.55px) saturate(1.25)";
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(simCanvas, 0, 0, N, N, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };
    window.addEventListener("resize", resize);
    resize();

    // gentle warm-up ripples so it isn't blank on load
    (function seed() {
      for (let k = 0; k < 4; k++) {
        const gx = 16 + Math.floor(Math.random() * (N - 32));
        const gy = 16 + Math.floor(Math.random() * (N - 32));
        const ang = Math.random() * Math.PI * 2;
        splat(gx, gy, Math.cos(ang) * 1.2, Math.sin(ang) * 1.2, 5);
      }
      for (let i = 0; i < 18; i++) {
        velStep(DT);
        densStep(DT);
      }
      dens.fill(0);
    })();

    let raf;
    let prevTime = performance.now();
    let alive = true;

    // FIX: main gate. While the hero is off-screen, skip the entire
    // solve+render (just keep the rAF chain alive cheaply so it resumes
    // instantly when scrolled back into view). While actively scrolling,
    // still step the sim (so it doesn't visibly freeze) but at a reduced
    // rate — every other frame — instead of full cost every frame.
    let frameParity = 0;

    const loop = (now) => {
      if (!alive) return;

      if (!containerVisibleRef.current) {
        raf = requestAnimationFrame(loop);
        return;
      }

      const scrolling = isScrollingRef?.current;
      frameParity ^= 1;
      if (scrolling && frameParity === 0) {
        // Skip every other frame's heavy work while scrolling; still
        // schedule the next frame so it stays responsive once idle.
        raf = requestAnimationFrame(loop);
        return;
      }

      let dt = (now - prevTime) / 1000;
      prevTime = now;
      if (!(dt > 0)) dt = 1 / 60;
      if (dt > 0.05) dt = 0.05;

      pointerStep();
      velStep(DT);
      densStep(DT);
      fadePass(dt);

      const ka = 1 - Math.exp(-dt * 6);
      activityLevel += (activityTarget - activityLevel) * ka;

      render(now / 1000, activityLevel);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io.disconnect();
    };
  }, [pointerRef, isScrollingRef]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
      <div
        ref={cursorDotRef}
        className="fixed pointer-events-none"
        style={{
          width: 22,
          height: 22,
          top: 0,
          left: 0,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, ${THEME.fluidGlowFaint}F5 0%, ${THEME.fluidGlowSoft}C0 45%, ${THEME.fluidGlowCore}00 100%)`,
          boxShadow: `0 0 26px 8px ${THEME.fluidGlowSoft}99, 0 0 46px 14px ${THEME.fluidGlowCore}55`,
          opacity: 0,
          transition: "opacity 0.15s ease",
          willChange: "transform, opacity",
          zIndex: 50,
        }}
      />
    </>
  );
}

/* ---------- Main component ---------- */

export default function Header() {
  const [imageUrl, setImageUrl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerInfo, setHeaderInfo] = useState(null); // { name, roles, tagline, socials, work }
  const [infoError, setInfoError] = useState(false);

  const activeSection = useActiveSection(NAV_LINKS.map((l) => l.id));
  const hamburgerVisible = useHideOnScroll();
  const typed = useTypewriter(headerInfo?.roles || []);
  const isMobile = useIsMobile();

  const headingText = headerInfo ? `Hi, I'm ${headerInfo.name}` : "";
  const pointerRef = usePointerTracker();
  const isScrollingRef = useIsScrolling();
  const getLetterRef = useFluidLetters(headingText, pointerRef, isScrollingRef);

  // ---- NEW: subtle 3D tilt on the profile image while hovering ----
  const imageWrapRef = useRef(null);
  const [imgTilt, setImgTilt] = useState({ rx: 0, ry: 0, scale: 1 });

  const handleImageMouseMove = (e) => {
    const el = imageWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const ry = (px - 0.5) * 16; // rotateY range ~ -8..8deg
    const rx = -(py - 0.5) * 16; // rotateX range ~ -8..8deg
    setImgTilt({ rx, ry, scale: 1.05 });
  };

  const handleImageMouseLeave = () => {
    setImgTilt({ rx: 0, ry: 0, scale: 1 });
  };

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/profile-image`)
      .then((res) => {
        if (!res.ok) throw new Error("backend not reachable");
        return res.json();
      })
      .then((data) => setImageUrl(data.url))
      .catch(() => console.error("Could not load profile image"));
  }, []);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/header-info`)
      .then((res) => {
        if (!res.ok) throw new Error("backend not reachable");
        return res.json();
      })
      .then((data) => setHeaderInfo(data))
      .catch(() => setInfoError(true));
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const goToSection = (id) => {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const socials = headerInfo?.socials || [];
  const work = headerInfo?.work;

  return (
    <section
      id="home"
      className="relative w-full min-h-screen flex items-center overflow-hidden"
      style={{ backgroundColor: THEME.sectionBgHeader }}
    >

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${THEME.accent}22 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 90%)",
        }}
      />

      {/* Soft color blobs */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 md:w-[28rem] md:h-[28rem] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.accentLight}, transparent 70%)` }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-72 h-72 md:w-96 md:h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${THEME.accent}, transparent 70%)` }}
      />

      {/* Fluid ripple background — reacts to the pointer anywhere over the
          hero. Skipped on mobile: no hover interaction there, and the
          canvas solve/blur cost isn't worth paying on phones. */}
      {!isMobile && <FluidBackground pointerRef={pointerRef} isScrollingRef={isScrollingRef} />}

      {/* Hamburger / close toggle */}
      <button
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        onClick={() => setMenuOpen((v) => !v)}
        className="fixed top-5 right-5 sm:top-7 sm:right-7 z-[60] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white shadow-md flex flex-col items-center justify-center gap-[5px] transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          opacity: menuOpen || hamburgerVisible ? 1 : 0,
          transform: menuOpen || hamburgerVisible ? "translateY(0)" : "translateY(-12px)",
          pointerEvents: menuOpen || hamburgerVisible ? "auto" : "none",
        }}
      >
        <span
          className="block w-5 h-[2px] rounded transition-all duration-300 ease-in-out"
          style={{ backgroundColor: THEME.textDark, transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none" }}
        />
        <span
          className="block w-5 h-[2px] rounded transition-all duration-300 ease-in-out"
          style={{ backgroundColor: THEME.textDark, opacity: menuOpen ? 0 : 1, transform: menuOpen ? "translateX(-6px)" : "none" }}
        />
        <span
          className="block w-5 h-[2px] rounded transition-all duration-300 ease-in-out"
          style={{ backgroundColor: THEME.textDark, transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none" }}
        />
      </button>

      {/* Backdrop — sits above every other fixed/floating element on the page
          (including the bottom-right AI chat orb, which is z-50) so nothing
          shows through on top of it once the menu is open, and blurs the
          page behind it for a soft focus effect. */}
      <div
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-[55] transition-opacity duration-300 ease-in-out ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          backgroundColor: "rgba(15,31,27,0.45)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Nav panel — full-width (capped) on very small screens, fixed width
          from sm up. z-[60] keeps it (and the hamburger button above) on top
          of everything else, including the AI chat orb. */}
      <nav
        className={`fixed top-0 right-0 z-[60] w-full max-w-xs sm:w-72 h-full bg-white p-6 flex flex-col gap-1 shadow-xl transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-12 mb-4" />
        {NAV_LINKS.map((link, i) => {
          const isActive = activeSection === link.id;
          return (
            <button
              key={link.id}
              onClick={() => goToSection(link.id)}
              className="text-left px-3 py-3 rounded-lg font-medium transition-all duration-200 ease-out"
              style={{
                color: isActive ? THEME.accent : THEME.textDark,
                backgroundColor: isActive ? `${THEME.accent}14` : "transparent",
                fontFamily: THEME.fontFamily,
                transform: menuOpen ? "translateX(0)" : "translateX(24px)",
                opacity: menuOpen ? 1 : 0,
                transitionDelay: menuOpen ? `${i * 40}ms` : "0ms",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "#F3F4F4";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Content grid — widened / given more breathing room specifically on
          laptop (lg) screens via lg: classes, so mobile/tablet stay unchanged. */}
      <div className="relative z-10 max-w-7xl lg:max-w-[1600px] mx-auto px-5 sm:px-8 md:px-16 lg:px-20 py-10 md:py-0 lg:py-8 grid md:grid-cols-[320px_1fr] lg:grid-cols-[420px_1fr] gap-8 md:gap-14 lg:gap-20 items-center pointer-events-none">
        {/* Left — PORTFOLIO label + image, stacked together so the label
            always sits directly above the photo and shares its alignment
            (centered on mobile, left-aligned from md up). */}
        <div className="flex flex-col items-center md:items-start">
          <p
            className="text-[12px] tracking-[0.35em] text-teal-700/80 font-semibold mb-20 uppercase"
            style={{ color: THEME.accentLight, fontFamily: THEME.fontFamily }}
          >
            Portfolio
          </p>

          <div
            ref={imageWrapRef}
            onMouseMove={handleImageMouseMove}
            onMouseLeave={handleImageMouseLeave}
            className="relative pointer-events-auto"
            style={{ perspective: "800px" }}
          >
            <div
              className="absolute -inset-3 rounded-full opacity-20"
              style={{ background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accentLight})` }}
            />
            <img
              src={imageUrl}
              className="relative w-44 h-44 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full object-cover border-4"
              style={{
                borderColor: THEME.sectionBgHeader,
                boxShadow: `0 0 0 2px ${THEME.accent}33`,
                transform: `rotateX(${imgTilt.rx}deg) rotateY(${imgTilt.ry}deg) scale(${imgTilt.scale})`,
                transition: "transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)",
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            />
          </div>
        </div>

        {/* Right — text */}
        <div className="text-center md:text-left">
          {infoError ? (
            <p className="text-sm" style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}>
              Couldn't load profile details right now.
            </p>
          ) : headerInfo === null ? (
            <div className="flex flex-col gap-3 animate-pulse max-w-md mx-auto md:mx-0">
              <div className="h-10 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "70%" }} />
              <div className="h-10 rounded" style={{ backgroundColor: THEME.skeletonBg, width: "50%" }} />
            </div>
          ) : (
            <>
              <h1
                className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-tight mb-5 md:mb-6 break-words"
                style={{ color: THEME.textDark, fontFamily: THEME.headingFont }}
              >
                {renderFluidHeading(headingText, getLetterRef, {
                  color: THEME.textDark,
                  fontFamily: THEME.headingFont,
                })}
              </h1>

              <div
                className="inline-flex items-center gap-2 sm:gap-3 rounded-lg px-4 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base md:text-lg lg:text-xl max-w-full"
                style={{ backgroundColor: THEME.textDark, color: THEME.accentLight, fontFamily: THEME.headingFont }}
              >
                <span style={{ color: THEME.accent }}>&gt;</span>
                <span style={{ color: THEME.sectionBgHeader }} className="truncate">
                  {typed}
                </span>
                <span
                  className="inline-block w-[9px] h-[1.1em] flex-shrink-0"
                  style={{ backgroundColor: THEME.accentLight, animation: "blink 1s steps(1) infinite" }}
                />
              </div>

              {headerInfo.tagline && (
                <p
                  className="mt-5 md:mt-6 max-w-md lg:max-w-lg mx-auto md:mx-0 text-sm lg:text-base"
                  style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}
                >
                  {headerInfo.tagline}
                </p>
              )}

              {/* Social icons — only rendered when backend supplies a matching id + url */}
              {socials.length > 0 && (
                <div className="mt-5 md:mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                  {socials.map((social) => {
                    const Icon = SOCIAL_ICON_MAP[social.id];
                    if (!Icon || !social.url) return null;
                    return (
                      
                        <a key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.id}
                        className="pointer-events-auto w-10 h-10 rounded-lg flex items-center justify-center border transition-all duration-200"
                        style={{ color: THEME.accent, borderColor: THEME.borderStrong, backgroundColor: `${THEME.accent}0D` }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = THEME.accent;
                          e.currentTarget.style.color = "#FFFFFF";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = `${THEME.accent}0D`;
                          e.currentTarget.style.color = THEME.accent;
                        }}
                      >
                        <Icon />
                      </a>
                    );
                  })}
                </div>
              )}

              {/* "Currently working at" card — company, role, and logo all from backend */}
              {work?.company && work?.role && (
                <div
                  className="mt-7 md:mt-8 inline-flex items-center gap-3 rounded-xl px-4 py-3 border max-w-full sm:max-w-md flex-wrap sm:flex-nowrap"
                  style={{ borderColor: THEME.border, backgroundColor: THEME.cardBg }}
                >
                  {work.logo && (
                    <img
                      src={work.logo}
                      alt={work.company}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      style={{ backgroundColor: THEME.fieldBg }}
                    />
                  )}
                  <p className="text-sm text-left break-words" style={{ color: THEME.textBody, fontFamily: THEME.fontFamily }}>
                    <span style={{ color: THEME.textMuted }}>Work at </span>
                    <span className="font-semibold" style={{ color: THEME.textDark }}>
                      {work.company}
                    </span>
                    <span style={{ color: THEME.textMuted }}> — </span>
                    <span style={{ color: THEME.accent }}>{work.role}</span>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Scroll cue */}
           {/* Scroll cue — hidden on mobile, only shown from md breakpoint up */}
      {!isMobile && (
        <button
          onClick={() => goToSection("about")}
          aria-label="Scroll to About section"
          className="absolute bottom-2 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-xs"
          style={{ color: THEME.textMuted, fontFamily: THEME.fontFamily }}
        >
          <span className="tracking-[0.2em] uppercase">Scroll</span>
          <span className="animate-bounce" style={{ color: THEME.accent }}>
            ↓
          </span>
        </button>
      )}

      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </section>

  );
}