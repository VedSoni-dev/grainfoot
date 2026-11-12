"use client";
import { useState } from "react";
import { GrainFooter, type GrainFooterConfig } from "@/components/GrainFooter";

const SAMPLES = ["/footer/dusk.jpg", "/footer/meadow.jpg", "/footer/coast.jpg"];

export const DEMO: GrainFooterConfig = {
  brand: { name: "Northlight", tagline: "Field notes and prints from a small studio by the sea." },
  columns: [
    { title: "Studio", links: [{ label: "Prints", href: "#" }, { label: "Commissions", href: "#" }, { label: "Workshops", href: "#" }, { label: "Journal", href: "#" }] },
    { title: "Resources", links: [{ label: "Shipping", href: "#" }, { label: "Care guide", href: "#" }, { label: "FAQ", href: "#" }] },
    { title: "Company", links: [{ label: "About", href: "#" }, { label: "Contact", href: "#" }, { label: "Terms of Service", href: "#" }, { label: "Privacy", href: "#" }] },
  ],
  images: SAMPLES,
  imageAlt: "Layered hills at dusk",
  status: { label: "Open for orders", ok: true },
  socials: [{ type: "x", href: "#" }, { type: "instagram", href: "#" }, { type: "youtube", href: "#" }],
  credit: { label: "Footer by", name: "grainfoot", href: "https://github.com/VedSoni-dev/grainfoot" },
  grain: { amount: 0.55, size: 1.6, weave: 0.35 },
  rotate: { intervalMs: 4500, onHover: true },
};

export function LandingDemo() {
  const [on, setOn] = useState(true);
  const [amount, setAmount] = useState(0.55);
  const cfg: GrainFooterConfig = { ...DEMO, grain: on ? { ...DEMO.grain, amount } : { amount: 0, weave: 0, tint: "transparent" } };
  return (
    <div className="demo">
      <div className="demo-bar">
        <div className="seg" role="group" aria-label="Grain">
          <button type="button" aria-pressed={!on} onClick={() => setOn(false)}>Plain photo</button>
          <button type="button" aria-pressed={on} onClick={() => setOn(true)}>With grain</button>
        </div>
        <label className="demo-slider">
          <span>Grain</span>
          <input type="range" min={0} max={1} step={0.01} value={amount} disabled={!on} onChange={(e) => setAmount(+e.target.value)} aria-label="Grain amount" />
        </label>
        <span className="muted demo-hint">Hover the picture to change it</span>
      </div>
      <div className="demo-frame">
        <GrainFooter config={cfg} />
      </div>
    </div>
  );
}
