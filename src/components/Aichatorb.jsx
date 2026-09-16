// npm install framer-motion three

/**
 * Bottom-right AI chat launcher: a shader-driven glowing mint-green orb with
 * tracked "eyes" that follow the pointer anywhere on the page and fall back
 * to a slow idle gaze-and-blink cycle when the pointer is still.
 *
 * Behavior notes (read before wiring up the backend):
 * - The person's display name is expected from the backend. This component
 *   fetches it once from `${BACKEND_URL}/api/profile` (expected shape:
 *   { name: "..." }). If that call fails, or you don't have that endpoint,
 *   pass a `personName` prop instead and the fetch is skipped.
 * - On first opening the chat (once per page load), the assistant sends two
 *   introductory messages automatically.
 * - While waiting for a backend reply, a single-line status note is shown
 *   instead of a bouncing-dots indicator. The panel is wider so this fits
 *   without wrapping.
 * - If a reply arrives while the chat window is closed, the little bubble
 *   that normally cycles through idle greetings instead shows a "your
 *   response is ready" notification until the user opens the chat.
 * - Assistant messages are lightly formatted: **bold**, line breaks, plain
 *   URLs, emails, and phone numbers become clickable, and GitHub links get
 *   a small "click here" + GitHub icon treatment.
 * - While the chat is open, a dimming + blurring backdrop covers the page and
 *   the whole launcher is lifted to z-[70]. The header's hamburger button and
 *   nav panel sit at z-[60], so they end up behind the backdrop and get
 *   blurred along with the rest of the page. Nothing in Header.jsx needs to
 *   change for this to work.
 */

import { useEffect, useRef, useState, Fragment } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import * as THREE from 'three'
import { BACKEND_URL } from './apiConfig'

// Optional: point this at a real portfolio URL if you have one. If left as
// '#', the word "portfolio" in the loading note is still shown but inert.
const PORTFOLIO_URL = '#'

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uActive;        // 0..1 lerp toward "alert"
  uniform vec2  uLook;          // -1..1, current look direction (cursor or idle script)
  uniform float uReduce;        // 1 = motion allowed, 0 = motion frozen

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;       // original mesh position — for stable surface speckles
  varying vec3 vViewPos;        // view-space position — fragment derives the displaced normal from this

  // Classic 3D simplex noise — Ashima Arts / Stefan Gustavson, MIT.
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(
              i.z+vec4(0.,i1.z,i2.z,1.))
            + i.y+vec4(0.,i1.y,i2.y,1.))
            + i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=1./7.;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    vLocalPos = position;            // stable surface coord — speckles stick here
    vec3 pos  = position;
    float t   = uTime * uReduce;

    // Slow anisotropic stretch — orb morphs through ovoid orientations over time.
    float ax = sin(t * 0.27 + 0.0) * 0.16;
    float ay = sin(t * 0.19 + 1.7) * 0.20;
    float az = sin(t * 0.23 + 3.1) * 0.12;
    pos *= vec3(1.0 + ax, 1.0 + ay, 1.0 + az);

    // Two octaves — keep the surface glossier/smoother for the new aesthetic.
    float nLow = snoise(pos * 0.55 + vec3( t * 0.18,  t * 0.13, -t * 0.15));
    float nMid = snoise(pos * 1.45 + vec3(-t * 0.22,  t * 0.20,  t * 0.18));

    // Look direction biases the noise sample — the "face" bulges where it looks.
    vec3 lookDir = vec3(uLook, 0.55);
    float facing = clamp(dot(normalize(pos), normalize(lookDir)), 0.0, 1.0);
    float bulge  = pow(facing, 2.5) * (0.08 + uActive * 0.10);

    // Gentle breath — overall radial pulse, very slow.
    float breath = sin(t * 0.55) * 0.022;

    float amp = mix(0.20, 0.34, uActive);
    float displacement = (nLow * 0.66 + nMid * 0.34) * amp + bulge + breath;

    pos += normal * displacement;

    vec4 mv  = modelViewMatrix * vec4(pos, 1.0);
    vNormal  = normalize(normalMatrix * normal);
    vViewDir = normalize(-mv.xyz);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAG = /* glsl */ `
  precision highp float;

  uniform vec3  uBase;
  uniform vec3  uRimA;     // bright green rim (upper-left light)
  uniform vec3  uRimB;     // soft white rim (lower-right light)
  uniform vec3  uSpeckA;   // green speckle
  uniform vec3  uSpeckB;   // white speckle
  uniform float uActive;

  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vLocalPos;
  varying vec3 vViewPos;

  // Simplex 3D noise — same as vertex, needed for speckle sampling.
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);
    vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(
              i.z+vec4(0.,i1.z,i2.z,1.))
            + i.y+vec4(0.,i1.y,i2.y,1.))
            + i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=1./7.;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main(){
    // True surface normal derived from view-space position derivatives — picks
    // up the actual wrinkles/ridges from the displaced geometry instead of the
    // smooth icosahedron normal. Gives proper shadow-in-valley, highlight-on-
    // ridge shading.
    vec3 dx = dFdx(vViewPos);
    vec3 dy = dFdy(vViewPos);
    vec3 n  = normalize(cross(dx, dy));
    vec3 v  = normalize(-vViewPos);

    // Fresnel — bright at glancing angles, dark where the surface faces us.
    float fres = 1.0 - clamp(dot(n, v), 0.0, 1.0);

    // ── Diffuse 3D lighting on the body ───────────────────────────────────────
    vec3 keyDir  = normalize(vec3(-0.45,  0.70,  0.85));
    vec3 fillDir = normalize(vec3( 0.65, -0.35,  0.55));

    float diffKey  = max(0.0, dot(n, keyDir));
    float diffFill = max(0.0, dot(n, fillDir));

    vec3 lit = uBase * (0.55 + diffKey * 0.75 + diffFill * 0.35);

    // ── Two-tone rim lights ──────────────────────────────────────────────────
    vec3 dirCyan    = normalize(vec3(-0.70,  0.55,  0.50));
    vec3 dirMagenta = normalize(vec3( 0.75, -0.30,  0.50));

    float cyanWrap    = max(0.0, dot(n, dirCyan));
    float magentaWrap = max(0.0, dot(n, dirMagenta));

    float rimCoreP = mix(2.2, 1.7, uActive);
    float rimCyan    = pow(cyanWrap,    1.3) * pow(fres, rimCoreP);
    float rimMagenta = pow(magentaWrap, 1.3) * pow(fres, rimCoreP);

    // ── Specular highlight on ridges ─────────────────────────────────────────
    vec3 halfKey = normalize(keyDir + v);
    float specKey = pow(max(0.0, dot(n, halfKey)), 32.0) * 0.55;

    vec3 col = lit
             + uRimA * rimCyan    * mix(1.10, 1.55, uActive)
             + uRimB * rimMagenta * mix(1.00, 1.45, uActive)
             + specKey * vec3(0.85, 1.00, 0.92);

    // ── Speckles ──────────────────────────────────────────────────────────────
    float speckBig   = snoise(vLocalPos * 10.0);
    float speckSmall = snoise(vLocalPos * 24.0 + 1.7);
    float maskBig    = smoothstep(0.66, 0.74, speckBig);
    float maskSmall  = smoothstep(0.72, 0.78, speckSmall) * 0.40;
    float speckMask  = max(maskBig, maskSmall);

    float colorPick  = snoise(vLocalPos * 4.0 + 5.3);
    vec3  speckColor = mix(uSpeckA, uSpeckB, smoothstep(0.55, 0.75, colorPick));

    float speckBody  = 1.0 - smoothstep(0.55, 0.95, fres);
    col += speckColor * speckMask * speckBody * 0.85;

    gl_FragColor = vec4(col, 1.0);
  }
`

// Softer mid-tone mint theme — a step darker than pure white/pastel, still nowhere near black.
const PALETTE = {
  base: [0.40, 0.62, 0.48],
  rimA: [0.14, 0.68, 0.36],
  rimB: [0.82, 0.92, 0.86],
  speckA: [0.18, 0.62, 0.34],
  speckB: [0.85, 0.95, 0.88],
  eye: 'rgba(10, 80, 42, 0.94)',
  eyeGlow: 'rgba(25, 150, 85, 0.65)',
}

// tune: adjust coordinates and durations to change the idle gaze pattern
const LOOK_SEQUENCE = [
  { x: -0.65, y: 0.0, dur: 2400 },
  { x: 0.32, y: 0.0, dur: 2800 },
  { x: -0.24, y: 0.0, dur: 2200 },
  { x: 0.0, y: -0.55, dur: 2800 },
  { x: 0.0, y: 0.0, dur: 2600 },
]

// Friendly idle lines shown near the orb's head while the chat is closed
// (shown only when there is no "response ready" notification pending).
// Each entry is a function of the resolved display name so the greeting
// always names the actual person instead of a generic placeholder.
const GREETINGS = [
  (name) => `Ask me anything about ${name}`,
  () => 'Click here to start chatting',
]

// How long the greeting bubble stays visible each time it pops up.
const GREETING_VISIBLE_MS = 4500
// Random idle gap between pop-ups: 10s to 15s.
const GREETING_MIN_GAP_MS = 10000
const GREETING_MAX_GAP_MS = 15000

// One-line status shown while the backend is working on a reply. Keep this
// short — the panel is sized to fit it on a single line without wrapping.
const LOADING_NOTE = 'This can take a moment — feel free to browse the portfolio, I will let you know when it is ready.'

// ── Inline message formatting ────────────────────────────────────────────
// Turns **bold**, line breaks, plain URLs, emails, and phone numbers into
// proper inline elements. GitHub links get a "click here" + logo treatment.

function GithubIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <path d="M12 .5C5.73.5.98 5.25.98 11.52c0 4.94 3.2 9.13 7.65 10.61.56.1.76-.24.76-.54v-1.9c-3.11.68-3.77-1.5-3.77-1.5-.51-1.3-1.24-1.64-1.24-1.64-1.02-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1 1.71 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.48-.28-5.1-1.24-5.1-5.53 0-1.22.44-2.22 1.15-3-.11-.28-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.08-1.15 3.08-1.15.61 1.54.22 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.3-2.63 5.24-5.13 5.52.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.77.54 4.44-1.48 7.64-5.67 7.64-10.61C23.02 5.25 18.27.5 12 .5z" />
    </svg>
  )
}

// Safety net: the model is instructed to never write markdown link syntax
// (it should just drop a bare URL), but if it slips and writes [text](url)
// — including nested cases like [GitHub]([click here](url)) — unwrap it
// down to the bare URL so the normal URL handling below can take over,
// instead of rendering literal brackets.
function stripMarkdownLinks(str) {
  let prev
  let out = str
  do {
    prev = out
    out = out.replace(/\[([^[\]]*)\]\((https?:\/\/[^\s()]+)\)/g, '$2')
  } while (out !== prev)
  return out
}

function parseInline(str, keyPrefix) {
  const nodes = []
  const cleaned = stripMarkdownLinks(str)
  const regex =
    /(\*\*[^*]+\*\*)|(https?:\/\/[^\s]+)|([\w.+-]+@[\w-]+\.[\w.-]+)|(\+?\d[\d\s().-]{7,}\d)/g
  let lastIndex = 0
  let match
  let key = 0

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(cleaned.slice(lastIndex, match.index))
    }
    const token = match[0]

    if (match[1]) {
      // **bold**
      nodes.push(<strong key={`${keyPrefix}-${key++}`}>{token.slice(2, -2)}</strong>)
    } else if (match[2]) {
      // URL
      const isGithub = /github\.com/i.test(token)
      if (isGithub) {
        nodes.push(
          <span key={`${keyPrefix}-${key++}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <a
              href={token}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#188049', fontWeight: 600, textDecoration: 'underline' }}
            >
              click here
            </a>
            <a href={token} target="_blank" rel="noopener noreferrer" aria-label="GitHub profile" style={{ color: '#0B4426' }}>
              <GithubIcon />
            </a>
          </span>
        )
      } else {
        nodes.push(
          <a
            key={`${keyPrefix}-${key++}`}
            href={token}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#188049', textDecoration: 'underline', wordBreak: 'break-all' }}
          >
            {token}
          </a>
        )
      }
    } else if (match[3]) {
      // email
      nodes.push(
        <a
          key={`${keyPrefix}-${key++}`}
          href={`mailto:${token}`}
          style={{ color: '#188049', textDecoration: 'underline' }}
        >
          {token}
        </a>
      )
    } else if (match[4]) {
      // phone number
      const digits = token.replace(/[^\d+]/g, '')
      nodes.push(
        <a
          key={`${keyPrefix}-${key++}`}
          href={`tel:${digits}`}
          style={{ color: '#188049', textDecoration: 'underline' }}
        >
          {token}
        </a>
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < cleaned.length) nodes.push(cleaned.slice(lastIndex))
  return nodes
}

function FormattedMessage({ text }) {
  const lines = String(text ?? '').split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {parseInline(line, `l${i}`)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  )
}

export default function AiChatOrb({ personName: personNameProp } = {}) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const canvasRef = useRef(null)
  const sizeRef = useRef({ w: 96, h: 96 })

  const lookTargetRef = useRef({ x: 0, y: 0 })
  const lookCurrentRef = useRef({ x: 0, y: 0 })
  const hoverActiveRef = useRef(false)
  const idleTimeoutRef = useRef(null)

  const activeRef = useRef(0)
  const targetRef = useRef(0)

  const eyeX = useMotionValue(0)
  const eyeY = useMotionValue(0)
  const sx = useSpring(eyeX, { stiffness: 200, damping: 22, mass: 0.4 })
  const sy = useSpring(eyeY, { stiffness: 200, damping: 22, mass: 0.4 })

  const [blinkAt, setBlinkAt] = useState(0)
  const [open, setOpen] = useState(0.85)
  const [orbHovered, setOrbHovered] = useState(false)

  // ── Person / identity ───────────────────────────────────────────────────
  const [personName, setPersonName] = useState(personNameProp || '')

  useEffect(() => {
    if (personNameProp) return // already supplied by the parent, skip fetching
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/profile`)
        if (!res.ok) return
        const data = await res.json()
        const name = data?.name
        if (!cancelled && name) setPersonName(name)
      } catch {
        // silently fall back to generic wording below
      }
    })()
    return () => {
      cancelled = true
    }
  }, [personNameProp])

  const displayName = personName || 'this person'

  // ── Chat state ──────────────────────────────────────────────────────────
  const [chatOpen, setChatOpen] = useState(false)
  const chatOpenRef = useRef(false)
  useEffect(() => {
    chatOpenRef.current = chatOpen
  }, [chatOpen])

  const [showGreeting, setShowGreeting] = useState(false)
  const [greetingIndex, setGreetingIndex] = useState(0)
  const [notification, setNotification] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const greetedRef = useRef(false)

  function openChat() {
    setChatOpen(true)
    setNotification(null)
  }

  // Close on Escape while the chat is open — matches what the backdrop click
  // does, and keeps the overlay keyboard-accessible.
  useEffect(() => {
    if (!chatOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setChatOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chatOpen])

  // First time the chat is opened, send the two intro messages from the bot.
  useEffect(() => {
    if (!chatOpen || greetedRef.current) return
    greetedRef.current = true
    const t1 = setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: `Hi, my name is XA — ${displayName}'s chat assistant. You may ask me anything about him.`,
        },
      ])
    }, 350)
    const t2 = setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: "If you're a recruiter, send me your company followed by the open role — I'll let you know if he'd be a good fit.",
        },
      ])
    }, 1300)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [chatOpen, displayName])

  // Pop the idle greeting bubble every 10-15s while the chat is closed and
  // there's no "response ready" notification waiting to be shown instead.
  useEffect(() => {
    if (chatOpen || notification) {
      setShowGreeting(false)
      return
    }
    let showTimer
    let hideTimer

    function scheduleNext() {
      const gap = GREETING_MIN_GAP_MS + Math.random() * (GREETING_MAX_GAP_MS - GREETING_MIN_GAP_MS)
      showTimer = window.setTimeout(() => {
        setGreetingIndex((i) => (i + 1) % GREETINGS.length)
        setShowGreeting(true)
        hideTimer = window.setTimeout(() => {
          setShowGreeting(false)
          scheduleNext()
        }, GREETING_VISIBLE_MS)
      }, gap)
    }

    scheduleNext()
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [chatOpen, notification])

  // Auto-scroll to the latest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, chatOpen])

  async function handleSend(e) {
    e.preventDefault()
    const text = inputValue.trim()
    if (!text || loading) return

    setMessages((m) => [...m, { role: 'user', text }])
    setInputValue('')
    setLoading(true)

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      const reply = data?.reply ?? data?.response ?? data?.message ?? '...'
      setMessages((m) => [...m, { role: 'assistant', text: reply }])
      if (!chatOpenRef.current) setNotification("Here's your response!")
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Something went wrong, please try again.' },
      ])
      if (!chatOpenRef.current) setNotification("Here's your response!")
    } finally {
      setLoading(false)
    }
  }

  // ── Orb shader setup ────────────────────────────────────────────────────
  useEffect(() => {
    const host = canvasRef.current
    if (!host) return

    const W = host.clientWidth || 96
    const H = host.clientHeight || 96
    sizeRef.current = { w: W, h: H }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100)
    camera.position.z = 4.4

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(0x000000, 0)
    host.appendChild(renderer.domElement)

    const detail = 32
    const geo = new THREE.IcosahedronGeometry(1, detail)

    const uniforms = {
      uTime: { value: 0 },
      uActive: { value: 0 },
      uLook: { value: new THREE.Vector2(0, 0) },
      uReduce: { value: 1 },
      uBase: { value: new THREE.Color(...PALETTE.base) },
      uRimA: { value: new THREE.Color(...PALETTE.rimA) },
      uRimB: { value: new THREE.Color(...PALETTE.rimB) },
      uSpeckA: { value: new THREE.Color(...PALETTE.speckA) },
      uSpeckB: { value: new THREE.Color(...PALETTE.speckB) },
    }

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
    })

    const mesh = new THREE.Mesh(geo, mat)
    scene.add(mesh)

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyMotion = () => {
      uniforms.uReduce.value = mql.matches ? 0 : 1
    }
    applyMotion()
    mql.addEventListener('change', applyMotion)

    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (!r) return
      const nw = Math.max(1, Math.floor(r.width))
      const nh = Math.max(1, Math.floor(r.height))
      sizeRef.current = { w: nw, h: nh }
      renderer.setSize(nw, nh)
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
    })
    ro.observe(host)

    let raf = 0
    const clock = new THREE.Clock()

    function tick() {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(clock.getDelta(), 0.05)
      uniforms.uTime.value += dt

      const ka = 1 - Math.exp(-dt * 6)
      activeRef.current += (targetRef.current - activeRef.current) * ka
      uniforms.uActive.value = activeRef.current

      const speed = hoverActiveRef.current ? 7 : 2.2
      const kl = 1 - Math.exp(-dt * speed)
      const lc = lookCurrentRef.current
      const lt = lookTargetRef.current
      lc.x += (lt.x - lc.x) * kl
      lc.y += (lt.y - lc.y) * kl

      uniforms.uLook.value.set(lc.x, -lc.y)

      const lean = 0.12 + activeRef.current * 0.06
      mesh.position.x += (lc.x * lean - mesh.position.x) * kl
      mesh.position.y += (-lc.y * lean - mesh.position.y) * kl

      const range = sizeRef.current.w * 0.18
      eyeX.set(lc.x * range)
      eyeY.set(lc.y * range)

      mesh.rotation.y += dt * 0.04
      mesh.rotation.x += dt * 0.015

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      mql.removeEventListener('change', applyMotion)
      ro.disconnect()
      geo.dispose()
      mat.dispose()
      try {
        renderer.forceContextLoss()
      } catch {}
      renderer.dispose()
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement)
    }
  }, [eyeX, eyeY])

  // ── Global pointer-driven eye tracking ──────────────────────────────────
  // Listens on the window (not just the orb) so the eyes follow the cursor
  // anywhere on the page, and fall back to the idle wave sequence a short
  // moment after the cursor stops moving.
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    function update(clientX, clientY) {
      const rect = stage.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const radius = rect.width / 2
      const dx = clientX - centerX
      const dy = clientY - centerY
      const nx = Math.max(-1, Math.min(1, dx / radius))
      const ny = Math.max(-1, Math.min(1, dy / radius))
      const dist = Math.sqrt(nx * nx + ny * ny)

      const onOrb = dist < 0.62
      setOrbHovered(onOrb)

      if (onOrb) {
        targetRef.current = 1
        lookTargetRef.current = { x: nx, y: ny }
        setOpen(0.32)
      } else {
        targetRef.current = 0.35
        lookTargetRef.current = { x: nx * 0.4, y: ny * 0.4 }
        setOpen(0.7)
      }
    }

    function onMove(e) {
      hoverActiveRef.current = true
      update(e.clientX, e.clientY)
      window.clearTimeout(idleTimeoutRef.current)
      idleTimeoutRef.current = window.setTimeout(() => {
        hoverActiveRef.current = false
        targetRef.current = 0
        setOpen(0.85)
        setOrbHovered(false)
      }, 1200)
    }

    function onDown(e) {
      update(e.clientX, e.clientY)
      setBlinkAt((v) => v + 1)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.clearTimeout(idleTimeoutRef.current)
    }
  }, [])

  // Idle gaze pattern — paused while the visitor's pointer is actively moving.
  useEffect(() => {
    if (typeof window === 'undefined') return
    let idx = 0
    let timer
    function step() {
      const s = LOOK_SEQUENCE[idx]
      if (!hoverActiveRef.current) {
        lookTargetRef.current = { x: s.x, y: s.y }
      }
      idx = (idx + 1) % LOOK_SEQUENCE.length
      timer = window.setTimeout(step, s.dur)
    }
    step()
    return () => window.clearTimeout(timer)
  }, [])

  // Occasional idle blink.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let t
    function schedule() {
      const wait = 3800 + Math.random() * 3200
      t = window.setTimeout(() => {
        setBlinkAt((v) => v + 1)
        schedule()
      }, wait)
    }
    schedule()
    return () => window.clearTimeout(t)
  }, [])

  const bubbleText = notification || (showGreeting ? GREETINGS[greetingIndex](displayName) : null)

  return (
    <div
      ref={containerRef}
      // While the chat is open the whole launcher is lifted above the
      // header's hamburger + nav panel (both z-[60]) so the backdrop below
      // covers and blurs them too. Closed, it drops back to z-50 so the nav
      // panel can still open over the orb as before.
      className={`fixed bottom-6 right-6 flex flex-col items-end gap-3 ${
        chatOpen ? 'z-[70]' : 'z-50'
      }`}
    >
      {/* Backdrop — dims and blurs the page behind the chat. First child in
          this stacking context, so the panel and orb below paint on top of
          it. Clicking it closes the chat. */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="chat-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setChatOpen(false)}
            aria-hidden="true"
            className="fixed inset-0"
            style={{
              backgroundColor: 'rgba(11, 68, 38, 0.18)',
              backdropFilter: 'blur(5px)',
              WebkitBackdropFilter: 'blur(5px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat panel — white with green accents, wider/taller to fit the
          single-line loading note, anchored to the bottom-right corner */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="relative z-10 w-[min(96vw,480px)] h-[min(82vh,600px)] rounded-2xl shadow-2xl flex flex-col overflow-hidden border"
            style={{ backgroundColor: '#F4F9F5', borderColor: 'rgba(20,110,60,0.30)' }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
              style={{ backgroundColor: '#CFEEDA', borderColor: 'rgba(20,110,60,0.22)' }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: '#188049',
                    boxShadow: '0 0 6px 2px rgba(24,128,73,0.55)',
                  }}
                />
                <span className="text-sm font-semibold" style={{ color: '#0B4426' }}>
                  {displayName}'s AI agent
                </span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                aria-label="Close chat"
                className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: '#0B4426' }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2" style={{ backgroundColor: '#F4F9F5' }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-snug ${
                    m.role === 'user' ? 'self-end' : 'self-start'
                  }`}
                  style={
                    m.role === 'user'
                      ? { backgroundColor: '#188049', color: '#FFFFFF' }
                      : { backgroundColor: '#DCF0E2', color: '#0B4426', border: '1px solid rgba(24,128,73,0.22)' }
                  }
                >
                  {m.role === 'assistant' ? <FormattedMessage text={m.text} /> : m.text}
                </div>
              ))}

              {/* One-line "working on it" status — replaces the bouncing dots.
                  Sized to fit the wider panel without wrapping. */}
              {loading && (
                <div
                  className="self-start w-full px-3 py-2 rounded-xl text-xs flex items-center gap-2"
                  style={{
                    backgroundColor: '#DCF0E2',
                    color: '#0B4426',
                    border: '1px solid rgba(24,128,73,0.22)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={LOADING_NOTE}
                >
                  <span
                    className="inline-block rounded-full flex-shrink-0"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: '#188049',
                      animation: 'ai-orb-pulse 1s ease-in-out infinite',
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    This can take a moment — feel free to browse the{' '}
                    {PORTFOLIO_URL && PORTFOLIO_URL !== '#' ? (
                      <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#188049', textDecoration: 'underline' }}>
                        portfolio
                      </a>
                    ) : (
                      'portfolio'
                    )}
                    , I'll let you know when it's ready.
                  </span>
                  <style>{`@keyframes ai-orb-pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }`}</style>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 px-3 py-3 border-t flex-shrink-0"
              style={{ backgroundColor: '#E5F4EA', borderColor: 'rgba(20,110,60,0.22)' }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm rounded-lg px-3 py-2 outline-none"
                style={{ backgroundColor: '#FFFFFF', color: '#0B4426', border: '1px solid rgba(24,128,73,0.30)' }}
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="text-sm font-medium rounded-lg px-3 py-2 disabled:opacity-40 transition-opacity"
                style={{ backgroundColor: '#188049', color: '#FFFFFF' }}
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble above the orb — shows the "response ready" notification when
          one is pending, otherwise cycles through idle greetings. */}
      <AnimatePresence>
        {!chatOpen && bubbleText && (
          <motion.div
            key={notification ? 'notification' : `greeting-${greetingIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 px-3 py-2 rounded-xl text-xs shadow-lg cursor-pointer select-none"
            style={{
              backgroundColor: notification ? '#188049' : '#F4F9F5',
              color: notification ? '#FFFFFF' : '#0B4426',
              border: notification ? 'none' : '1px solid rgba(24,128,73,0.35)',
              fontWeight: notification ? 600 : 400,
            }}
            onClick={openChat}
          >
            {bubbleText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb launcher — starts small, grows smoothly on hover, scales fluidly for mobile/tablet/desktop */}
      <motion.div
        ref={stageRef}
        onClick={() => (chatOpen ? setChatOpen(false) : openChat())}
        role="button"
        tabIndex={0}
        aria-label={chatOpen ? 'Close AI chat assistant' : 'Open AI chat assistant'}
        className="relative z-10 cursor-pointer select-none touch-none rounded-full"
        style={{
          width: 'clamp(64px, 15vw, 100px)',
          height: 'clamp(64px, 15vw, 100px)',
          boxShadow: '0 0 18px 4px rgba(31,168,90,0.30), 0 0 44px 12px rgba(31,168,90,0.14)',
        }}
        animate={{ scale: orbHovered ? 1.35 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <div ref={canvasRef} className="absolute inset-0 rounded-full overflow-hidden" />

        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-between"
          style={{ x: sx, y: sy, width: '11%', height: '15%' }}
        >
          <Eye open={open} blinkKey={blinkAt} />
          <Eye open={open} blinkKey={blinkAt} />
        </motion.div>
      </motion.div>
    </div>
  )
}

function Eye({ open, blinkKey }) {
  return (
    <motion.div
      style={{
        width: '32%',
        height: '100%',
        background: PALETTE.eye,
        borderRadius: 9999,
        boxShadow: `0 0 4px 0 ${PALETTE.eye}, 0 0 14px 1px ${PALETTE.eyeGlow}, 0 0 28px 4px ${PALETTE.eyeGlow}`,
        originY: 0.5,
      }}
      animate={{ scaleY: open }}
      transition={{ type: 'spring', stiffness: 240, damping: 22, mass: 0.4 }}
    >
      <motion.div
        key={blinkKey}
        className="h-full w-full"
        style={{ background: PALETTE.eye, borderRadius: 9999 }}
        initial={{ scaleY: 1 }}
        animate={{ scaleY: [1, 0.05, 1] }}
        transition={{ duration: 0.18, times: [0, 0.45, 1], ease: 'easeInOut' }}
      />
    </motion.div>
  )
}