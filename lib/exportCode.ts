// Turns a footer config into the code people paste: a React usage snippet and a plain HTML/CSS/JS version.
import { GRAINFOOT_CSS, grainVars, type GrainFooterConfig } from "@/components/GrainFooter";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ICONS: Record<string, string> = {
  x: '<path d="M4 4l16 16M20 4L4 20"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  youtube: '<rect x="2.5" y="5" width="19" height="14" rx="4"/><path d="M10 9.5v5l4.5-2.5z"/>',
  github: '<path d="M9 19c-4 1.3-4-2-6-2.5M15 21v-3.5a3 3 0 0 0-.9-2.4c3-.3 6-1.5 6-6.6a5 5 0 0 0-1.4-3.6 4.7 4.7 0 0 0-.1-3.5s-1.1-.3-3.6 1.4a12 12 0 0 0-6.4 0C6.1 1.1 5 1.4 5 1.4a4.7 4.7 0 0 0-.1 3.5A5 5 0 0 0 3.5 8.5c0 5.1 3 6.3 6 6.6a3 3 0 0 0-.9 2.4V21"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>',
  link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
};

export function reactSnippet(config: GrainFooterConfig): string {
  return `// 1. Save GrainFooter.tsx into your components folder.
// 2. Put your images in public/ at the paths listed below.
// 3. Use it:
import { GrainFooter, type GrainFooterConfig } from "@/components/GrainFooter";

const footer: GrainFooterConfig = ${JSON.stringify(config, null, 2)};

export function SiteFooter() {
  return <GrainFooter config={footer} />;
}
`;
}

export function htmlSnippet(c: GrainFooterConfig): string {
  const vars = Object.entries({ ...grainVars(c.grain), "--gf-aspect": String(c.aspect ?? 4.4) })
    .map(([k, v]) => `${k}:${v.replace(/"/g, "'")}`).join(";");
  const year = new Date().getFullYear();
  const copyright = c.copyright ?? `©${year} ${c.brand.name}. All rights reserved`;
  const imgs = c.images.filter(Boolean);
  const cols = (c.columns ?? []).map((col) => `      <div class="gf-col"><h3>${esc(col.title)}</h3><ul>${col.links.map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join("")}</ul></div>`).join("\n");
  const socials = (c.socials ?? []).map((s) => `<a href="${esc(s.href)}" aria-label="${s.type}" target="_blank" rel="noopener noreferrer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[s.type] ?? ICONS.link}</svg></a>`).join("");
  const interval = c.rotate?.intervalMs ?? 5000;
  const onHover = c.rotate?.onHover ?? true;
  return `<!-- grainfoot: plain HTML version. Paste the <style> once, then the <footer>, then the <script>. MIT. -->
<style>${GRAINFOOT_CSS}</style>

<footer class="gf" data-theme="${c.theme ?? "light"}"${c.grain?.animate ? " data-animate" : ""}>
  <div class="gf-top">
    <div class="gf-brand">
      <a class="gf-mark" href="${esc(c.brand.href ?? "/")}">${c.brand.logo ? `<img class="gf-logo" src="${esc(c.brand.logo)}" alt="">` : `<span class="gf-logo" aria-hidden="true">${esc(c.brand.name.slice(0, 1).toUpperCase())}</span>`}${esc(c.brand.name)}</a>
      ${c.brand.tagline ? `<p class="gf-tagline">${esc(c.brand.tagline)}</p>` : ""}
    </div>
    <nav class="gf-cols" aria-label="Footer">
${cols}
    </nav>
  </div>
  <div class="gf-band" style="${vars}">
${imgs.map((src, i) => `    <img class="gf-img" src="${esc(src)}" alt="${i === 0 ? esc(c.imageAlt ?? "") : ""}"${i === 0 ? " data-on" : ""} loading="lazy">`).join("\n")}
    <div class="gf-fx gf-tint"></div><div class="gf-fx gf-grain"></div><div class="gf-fx gf-grain2"></div><div class="gf-fx gf-weave"></div><div class="gf-fx gf-shade"></div>
    <div class="gf-over">
      <div class="gf-row">${c.status ? `<span class="gf-status"><span class="gf-dot"${c.status.ok === false ? " data-bad" : ""}></span>${esc(c.status.label)}</span>` : "<span></span>"}<div class="gf-socials">${socials}</div></div>
      <div class="gf-row"><span>${esc(copyright)}</span>${c.credit ? `<span class="gf-credit">${esc(c.credit.label)} ${c.credit.href ? `<a href="${esc(c.credit.href)}" target="_blank" rel="noopener noreferrer">${esc(c.credit.name)}</a>` : esc(c.credit.name)}</span>` : ""}</div>
    </div>
  </div>
</footer>

<script>
(function () {
  var band = document.currentScript.previousElementSibling.querySelector(".gf-band");
  var imgs = band.querySelectorAll(".gf-img"), i = 0, hover = false;
  if (imgs.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  function show(n) { imgs[i].removeAttribute("data-on"); i = n % imgs.length; imgs[i].setAttribute("data-on", ""); }
  ${interval > 0 ? `setInterval(function () { if (!hover) show(i + 1); }, ${Math.max(1200, interval)});` : ""}
  band.addEventListener("mouseenter", function () { hover = true; ${onHover ? "show(i + 1);" : ""} });
  band.addEventListener("mouseleave", function () { hover = false; });
})();
</script>
`;
}
