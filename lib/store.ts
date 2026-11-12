// Everything the playground keeps lives in this browser (localStorage). Nothing is sent anywhere.
import type { GrainFooterConfig, SocialType } from "@/components/GrainFooter";

export type ImageItem = { id: string; src: string; path: string; name: string; sample?: boolean };
export type Draft = {
  v: 1;
  brand: { name: string; tagline: string; logo: string; href: string };
  images: ImageItem[];
  columns: { title: string; lines: string }[];
  status: { show: boolean; label: string; ok: boolean };
  socials: Record<SocialType, string>;
  copyright: string;
  credit: { show: boolean; label: string; name: string; href: string };
  grain: { amount: number; size: number; weave: number; tint: string; animate: boolean };
  rotate: { seconds: number; onHover: boolean };
  aspect: number;
  theme: "light" | "dark";
  guideDone?: boolean;
};

const KEY = "grainfoot:draft:v1";
export const uid = () => Math.random().toString(36).slice(2, 10);

export function newDraft(name: string, tagline: string): Draft {
  return {
    v: 1,
    brand: { name, tagline, logo: "", href: "/" },
    images: [],
    columns: [
      { title: "Product", lines: "Overview, /product\nPricing, /pricing\nChangelog, /changelog" },
      { title: "Resources", lines: "Docs, /docs\nBlog, /blog\nGuides, /guides" },
      { title: "Company", lines: "About, /about\nContact, /contact\nPrivacy, /privacy" },
    ],
    status: { show: true, label: "All systems normal", ok: true },
    socials: { x: "", linkedin: "", youtube: "", github: "", instagram: "", link: "" },
    copyright: "",
    credit: { show: false, label: "Designed by", name: "", href: "" },
    grain: { amount: 0.55, size: 1.6, weave: 0.35, tint: "#f3e9dc", animate: false },
    rotate: { seconds: 5, onHover: true },
    aspect: 4.4,
    theme: "light",
  };
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return d && d.v === 1 && d.brand ? d : null;
  } catch {
    return null;
  }
}

/** Returns an error message when the browser refuses (usually: uploaded images are too big for storage). */
export function saveDraft(d: Draft): string | null {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    return null;
  } catch {
    return "This browser's storage is full, so your last change isn't saved. Remove an uploaded image or use image URLs instead.";
  }
}

export function clearDraft() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

export function parseLines(lines: string) {
  return lines.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
    const at = l.lastIndexOf(",");
    return at > 0 ? { label: l.slice(0, at).trim(), href: l.slice(at + 1).trim() || "#" } : { label: l, href: "#" };
  });
}

/** For the live preview: images use their real source (uploads are data URLs). */
export function toConfig(d: Draft, forExport = false): GrainFooterConfig {
  const socials = (Object.entries(d.socials) as [SocialType, string][]).filter(([, h]) => h.trim()).map(([type, href]) => ({ type, href: href.trim() }));
  const cfg: GrainFooterConfig = {
    brand: { name: d.brand.name || "Your brand", ...(d.brand.tagline ? { tagline: d.brand.tagline } : {}), ...(d.brand.logo ? { logo: d.brand.logo } : {}), href: d.brand.href || "/" },
    columns: d.columns.filter((c) => c.title.trim() || c.lines.trim()).map((c) => ({ title: c.title, links: parseLines(c.lines) })),
    images: d.images.map((i) => (forExport ? i.path : i.src)),
    status: d.status.show ? { label: d.status.label, ok: d.status.ok } : null,
    socials,
    ...(d.copyright.trim() ? { copyright: d.copyright.trim() } : {}),
    credit: d.credit.show && d.credit.name.trim() ? { label: d.credit.label, name: d.credit.name, ...(d.credit.href ? { href: d.credit.href } : {}) } : null,
    grain: { ...d.grain },
    rotate: { intervalMs: Math.round(d.rotate.seconds * 1000), onHover: d.rotate.onHover },
    aspect: d.aspect,
    theme: d.theme,
  };
  return cfg;
}

export const slugFile = (name: string) =>
  (name.toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "image") + ".jpg";

/** Shrinks an uploaded photo to at most 2000px wide JPEG so it fits in browser storage. */
export async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("That file isn't an image this browser can open.")); i.src = url; });
    const scale = Math.min(1, 2000 / img.naturalWidth);
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}
