"use client";

/**
 * GrainFooter: a drop-in website footer whose image band gets a grainy, matte print effect.
 * One file, zero dependencies besides React. MIT, from grainfoot (https://github.com/VedSoni-dev/grainfoot).
 *
 *   <GrainFooter config={{ brand: { name: "Acme" }, images: ["/footer/a.jpg", "/footer/b.jpg"] }} />
 *
 * One image shows still. Several crossfade on a timer and/or move on when the band is hovered.
 * The grain is an SVG feTurbulence tile blended over the image, plus a faint horizontal weave.
 * Motion stops for people who ask for reduced motion.
 */
import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";

export type SocialType = "x" | "linkedin" | "youtube" | "github" | "instagram" | "link";

export interface GrainFooterConfig {
  brand: { name: string; logo?: string; tagline?: string; href?: string };
  columns?: { title: string; links: { label: string; href: string }[] }[];
  /** Your images, in order. Paths or URLs: ["/footer/a.jpg", "/footer/b.jpg"]. */
  images: string[];
  imageAlt?: string;
  status?: { label: string; ok?: boolean } | null;
  socials?: { type: SocialType; href: string }[];
  /** Defaults to "©<year> <brand>. All rights reserved." */
  copyright?: string;
  credit?: { label: string; name: string; href?: string } | null;
  grain?: {
    /** 0–1, how strong the grain is. Default 0.55. */
    amount?: number;
    /** 1–4, size of a grain. Default 1.6. */
    size?: number;
    /** 0–1, the faint horizontal weave lines. Default 0.35. */
    weave?: number;
    /** A colour washed over the image for a matte print look. Default "#f3e9dc". */
    tint?: string;
    /** Let the grain shimmer. Default false. */
    animate?: boolean;
  };
  rotate?: {
    /** Milliseconds between images when there are several. 0 = no timer. Default 5000. */
    intervalMs?: number;
    /** Hovering the band shows the next image. Default true. */
    onHover?: boolean;
  };
  /** Band height as width / height. Default 4.4 (2.2 on phones). */
  aspect?: number;
  theme?: "light" | "dark";
}

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** The grain tile: fractal noise, greyscale, as a data URL. */
export function noiseUrl(size = 1.6): string {
  const f = (0.95 / clamp(size, 0.5, 6)).toFixed(3);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
}

/** CSS variables that drive the effect, for the band element. */
export function grainVars(g: GrainFooterConfig["grain"] = {}): Record<string, string> {
  const amount = clamp(g.amount ?? 0.55, 0, 1);
  const weave = clamp(g.weave ?? 0.35, 0, 1);
  return {
    "--gf-noise": noiseUrl(g.size ?? 1.6),
    "--gf-amount": amount.toFixed(2),
    "--gf-amount-soft": (amount * 0.6).toFixed(2),
    "--gf-weave": (weave * 0.5).toFixed(2),
    "--gf-tint": g.tint ?? "#f3e9dc",
    "--gf-tint-amount": (0.08 + amount * 0.14).toFixed(2),
    "--gf-sat": (1 - amount * 0.22).toFixed(2),
  };
}

export const GRAINFOOT_CSS = `
.gf{--gf-bg:#fff;--gf-ink:#111;--gf-muted:#5f5f5f;--gf-line:#ececec;box-sizing:border-box;background:var(--gf-bg);color:var(--gf-ink);font-family:inherit;padding:clamp(28px,5vw,64px) clamp(16px,4vw,64px) clamp(16px,3vw,40px)}
.gf[data-theme=dark]{--gf-bg:#0f0f0e;--gf-ink:#f2f0ea;--gf-muted:#9c988f;--gf-line:#262624}
.gf *{box-sizing:border-box}
.gf-top{display:flex;flex-wrap:wrap;justify-content:space-between;gap:40px 48px;margin-bottom:clamp(32px,5vw,64px)}
.gf-brand{max-width:340px}
.gf-mark{display:inline-flex;align-items:center;gap:10px;color:inherit;text-decoration:none;font-size:22px;font-weight:500;letter-spacing:-.02em}
.gf-logo{width:32px;height:32px;border-radius:50%;object-fit:cover;background:var(--gf-line);display:grid;place-items:center;font-size:15px;font-weight:600}
.gf-tagline{margin:16px 0 0;color:var(--gf-muted);font-size:15px;line-height:1.5}
.gf-cols{display:flex;flex-wrap:wrap;gap:32px clamp(32px,6vw,96px)}
.gf-col h3{margin:0 0 18px;font-size:15px;font-weight:500;color:var(--gf-ink)}
.gf-col ul{list-style:none;margin:0;padding:0;display:grid;gap:14px}
.gf-col a{color:var(--gf-muted);text-decoration:none;font-size:15px;transition:color .2s}
.gf-col a:hover{color:var(--gf-ink)}
.gf-band{position:relative;overflow:hidden;border-radius:4px;aspect-ratio:var(--gf-aspect,4.4);background:#d9d4cc;isolation:isolate;color:#fff}
.gf-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.04);filter:saturate(var(--gf-sat)) contrast(1.06) brightness(1.02);transition:opacity 1.1s ease,transform 6s ease}
.gf-img[data-on]{opacity:1;transform:scale(1)}
.gf-fx{position:absolute;inset:0;pointer-events:none}
.gf-tint{background:var(--gf-tint);mix-blend-mode:soft-light;opacity:var(--gf-tint-amount)}
.gf-grain{inset:-50%;background-image:var(--gf-noise);background-size:240px 240px;mix-blend-mode:overlay;opacity:var(--gf-amount)}
.gf-grain2{background-image:var(--gf-noise);background-size:240px 240px;background-position:120px 60px;mix-blend-mode:soft-light;opacity:var(--gf-amount-soft)}
.gf-weave{background:repeating-linear-gradient(0deg,rgba(0,0,0,.55) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(255,255,255,.25) 0 1px,transparent 1px 5px);mix-blend-mode:overlay;opacity:var(--gf-weave)}
.gf-shade{background:linear-gradient(180deg,rgba(0,0,0,.22),transparent 28%,transparent 68%,rgba(0,0,0,.28))}
.gf[data-animate] .gf-grain{animation:gf-shimmer .9s steps(5) infinite}
@keyframes gf-shimmer{0%{transform:translate(0,0)}20%{transform:translate(-6%,4%)}40%{transform:translate(5%,-7%)}60%{transform:translate(-3%,8%)}80%{transform:translate(8%,2%)}100%{transform:translate(0,0)}}
.gf-over{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:clamp(12px,2vw,22px) clamp(14px,2vw,24px);font-size:clamp(12px,1.2vw,15px);text-shadow:0 1px 8px rgba(0,0,0,.25)}
.gf-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
.gf-status{display:inline-flex;align-items:center;gap:8px}
.gf-dot{width:8px;height:8px;border-radius:50%;background:#3ee06a;box-shadow:0 0 0 3px rgba(62,224,106,.25)}
.gf-dot[data-bad]{background:#ffb02e;box-shadow:0 0 0 3px rgba(255,176,46,.25)}
.gf-socials{display:flex;gap:14px}
.gf-socials a{color:#fff;display:inline-flex;opacity:.92;transition:opacity .2s,transform .2s}
.gf-socials a:hover{opacity:1;transform:translateY(-1px)}
.gf-credit a{color:#fff;text-underline-offset:3px}
.gf-dots{display:flex;gap:6px;position:absolute;left:50%;bottom:clamp(12px,2vw,22px);transform:translateX(-50%)}
.gf-dots button{width:6px;height:6px;padding:0;border:0;border-radius:3px;background:rgba(255,255,255,.5);cursor:pointer;transition:width .3s,background .3s}
.gf-dots button[aria-current=true]{width:18px;background:#fff}
.gf a:focus-visible,.gf button:focus-visible{outline:2px solid currentColor;outline-offset:2px}
@media (max-width:640px){.gf-band{aspect-ratio:min(var(--gf-aspect,4.4),2.2)}.gf-over .gf-row:last-child{flex-direction:column;align-items:flex-start;gap:4px}.gf-dots{display:none}}
@media (prefers-reduced-motion:reduce){.gf-img{transition:opacity .01s}.gf[data-animate] .gf-grain{animation:none}}
`;

function Icon({ type }: { type: SocialType }) {
  const p = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (type) {
    case "x": return <svg {...p}><path d="M4 4l16 16M20 4L4 20" /></svg>;
    case "linkedin": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></svg>;
    case "youtube": return <svg {...p}><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="M10 9.5v5l4.5-2.5z" /></svg>;
    case "github": return <svg {...p}><path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.9-2.4c3-.3 6-1.5 6-6.6a5 5 0 0 0-1.4-3.6 4.7 4.7 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12 12 0 0 0-6.4 0C6.1 1.1 5 1.4 5 1.4a4.7 4.7 0 0 0-.1 3.5A5 5 0 0 0 3.5 8.5c0 5.1 3 6.3 6 6.6a3 3 0 0 0-.9 2.4V21" /></svg>;
    case "instagram": return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5v.01" /></svg>;
    default: return <svg {...p}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>;
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const on = () => setReduced(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function GrainFooter({ config, className, style }: { config: GrainFooterConfig; className?: string; style?: CSSProperties }) {
  const c = config;
  const images = c.images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const reduced = useReducedMotion();
  const label = useId();
  const interval = c.rotate?.intervalMs ?? 5000;
  const onHover = c.rotate?.onHover ?? true;
  const many = images.length > 1;

  useEffect(() => { if (active >= images.length) setActive(0); }, [images.length, active]);
  useEffect(() => {
    if (!many || reduced || interval <= 0 || hovering) return;
    const t = setInterval(() => setActive((i) => (i + 1) % images.length), Math.max(1200, interval));
    return () => clearInterval(t);
  }, [many, reduced, interval, hovering, images.length]);

  const vars = useMemo(() => ({ ...grainVars(c.grain), "--gf-aspect": String(c.aspect ?? 4.4) }) as CSSProperties, [c.grain, c.aspect]);
  const year = new Date().getFullYear();
  const copyright = c.copyright ?? `©${year} ${c.brand.name}. All rights reserved`;
  const animate = !!c.grain?.animate && !reduced;

  return (
    <footer className={["gf", className].filter(Boolean).join(" ")} data-theme={c.theme ?? "light"} data-animate={animate || undefined} style={style}>
      <style href="grainfoot" precedence="default">{GRAINFOOT_CSS}</style>
      <div className="gf-top">
        <div className="gf-brand">
          <a className="gf-mark" href={c.brand.href ?? "/"}>
            {c.brand.logo ? <img className="gf-logo" src={c.brand.logo} alt="" /> : <span className="gf-logo" aria-hidden>{c.brand.name.slice(0, 1).toUpperCase()}</span>}
            {c.brand.name}
          </a>
          {c.brand.tagline && <p className="gf-tagline">{c.brand.tagline}</p>}
        </div>
        {!!c.columns?.length && (
          <nav className="gf-cols" aria-label="Footer">
            {c.columns.map((col, i) => (
              <div className="gf-col" key={i}>
                <h3>{col.title}</h3>
                <ul>{col.links.map((l, j) => <li key={j}><a href={l.href}>{l.label}</a></li>)}</ul>
              </div>
            ))}
          </nav>
        )}
      </div>

      <div
        className="gf-band"
        style={vars}
        aria-labelledby={label}
        onMouseEnter={() => { setHovering(true); if (many && onHover && !reduced) setActive((i) => (i + 1) % images.length); }}
        onMouseLeave={() => setHovering(false)}
      >
        <span id={label} hidden>{c.imageAlt ?? `${c.brand.name} footer image`}</span>
        {images.map((src, i) => (
          <img key={src + i} className="gf-img" src={src} alt={i === active ? c.imageAlt ?? "" : ""} aria-hidden={i !== active} data-on={i === active || undefined} loading="lazy" decoding="async" />
        ))}
        <div className="gf-fx gf-tint" />
        <div className="gf-fx gf-grain" />
        <div className="gf-fx gf-grain2" />
        <div className="gf-fx gf-weave" />
        <div className="gf-fx gf-shade" />
        <div className="gf-over">
          <div className="gf-row">
            {c.status ? <span className="gf-status"><span className="gf-dot" data-bad={c.status.ok === false || undefined} />{c.status.label}</span> : <span />}
            {!!c.socials?.length && (
              <div className="gf-socials">
                {c.socials.map((s, i) => <a key={i} href={s.href} aria-label={s.type} target="_blank" rel="noopener noreferrer"><Icon type={s.type} /></a>)}
              </div>
            )}
          </div>
          <div className="gf-row">
            <span>{copyright}</span>
            {c.credit && <span className="gf-credit">{c.credit.label} {c.credit.href ? <a href={c.credit.href} target="_blank" rel="noopener noreferrer">{c.credit.name}</a> : c.credit.name}</span>}
          </div>
        </div>
        {many && (
          <div className="gf-dots">
            {images.map((_, i) => <button key={i} type="button" aria-label={`Show image ${i + 1}`} aria-current={i === active} onClick={() => setActive(i)} />)}
          </div>
        )}
      </div>
    </footer>
  );
}

export default GrainFooter;
