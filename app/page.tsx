import Link from "next/link";
import { LandingDemo } from "@/components/LandingDemo";
import { GrainFooter } from "@/components/GrainFooter";
import { PublikPitch } from "@/components/PublikGate";
import "./landing.css";

const CONFIG = `<GrainFooter config={{
  brand: { name: "Northlight", tagline: "Prints from a small studio." },
  images: ["/footer/dusk.jpg", "/footer/meadow.jpg", "/footer/coast.jpg"],
  grain: { amount: 0.55, size: 1.6, weave: 0.35 },
  rotate: { intervalMs: 4500, onHover: true },
}} />`;

export default function Landing() {
  return (
    <>
      <header className="wrap nav">
        <Link href="/" className="logo"><img src="/icon.svg" alt="" width={26} height={26} />grainfoot</Link>
        <nav>
          <a href="https://github.com/VedSoni-dev/grainfoot" target="_blank" rel="noopener noreferrer">GitHub</a>
          <Link className="btn btn-primary btn-sm" href="/app">Open grainfoot →</Link>
        </nav>
      </header>

      <main>
        <section className="wrap hero">
          <h1>A footer with <em>grain</em>.<br />Bring your own photos.</h1>
          <p className="lede">
            A drop-in website footer whose image band gets a matte, grainy, printed look. List your image paths in one
            array, tune the grain, copy one file into your site. React or plain HTML. Free and MIT.
          </p>
          <div className="cta">
            <Link className="btn btn-primary" href="/app">Open grainfoot →</Link>
            <a className="btn" href="https://github.com/VedSoni-dev/grainfoot" target="_blank" rel="noopener noreferrer">Get the code</a>
          </div>
        </section>

        <section className="wrap" id="demo"><LandingDemo /></section>

        <section className="wrap how">
          <div>
            <h2>Your images, one array</h2>
            <p className="muted">One image stays still. Several crossfade on a timer and move on when someone hovers the band. The grain is an SVG noise filter and CSS blend modes over your real image, so it works on any photo, at any size, and you can turn it up or down.</p>
            <ul className="works">
              <li>One file, <code>GrainFooter.tsx</code>, no dependencies besides React</li>
              <li>A plain HTML + CSS + 10-line script version for any site</li>
              <li>Grain amount, grain size, weave, tint and an optional shimmer</li>
              <li>Status pill, social links, three link columns, credit line</li>
              <li>Stops moving for people who ask for reduced motion; stacks on phones</li>
            </ul>
          </div>
          <pre aria-label="Example config"><code>{CONFIG}</code></pre>
        </section>

        <section className="wrap steps">
          <h2>In the app</h2>
          <ol>
            <li><b>Add your photos.</b> Upload them or paste image URLs. Name the path each will live at in your site.</li>
            <li><b>Tune it.</b> Grain, weave, tint, speed, your links and brand, with the footer live as you go. Stuck on the links? Describe your site in a sentence and AI writes them.</li>
            <li><b>Copy it.</b> The component, your config, or a plain HTML version. Paste, drop the images in <code>public/</code>, done.</li>
          </ol>
          <Link className="btn btn-primary" href="/app">Open grainfoot →</Link>
        </section>

        <section className="wrap credit card">
          <h2>Where the layout comes from</h2>
          <p>
            The layout follows a footer design posted by Faris (<a href="https://x.com/Faris_rzk" target="_blank" rel="noopener noreferrer">@Faris_rzk on X</a>), rebuilt here in code from scratch
            with our own images and a placeholder brand. Someone asked for it as code they could drop their own photos into, so that&apos;s what this is.
            Want a custom footer or site designed properly? <a href="https://x.com/Faris_rzk" target="_blank" rel="noopener noreferrer">Hire him for a custom one →</a>
          </p>
        </section>

        <section className="wrap pitch">
          <h2>Free on publik</h2>
          <PublikPitch appName="grainfoot" className="pk-pitch-landing" />
        </section>
      </main>

      <GrainFooter
        config={{
          brand: { name: "grainfoot", tagline: "A footer with grain. Free and open source.", logo: "/icon.svg" },
          columns: [
            { title: "Use it", links: [{ label: "Open the app", href: "/app" }, { label: "Get the code", href: "https://github.com/VedSoni-dev/grainfoot" }] },
            { title: "Made by", links: [{ label: "@forkthis_ai", href: "https://x.com/forkthis_ai" }, { label: "publik", href: "https://publikhq.com" }] },
          ],
          images: ["/footer/coast.jpg", "/footer/dusk.jpg"],
          status: { label: "Free & open source", ok: true },
          socials: [{ type: "github", href: "https://github.com/VedSoni-dev/grainfoot" }, { type: "x", href: "https://x.com/forkthis_ai" }],
          copyright: "MIT · not affiliated with Faris or his clients",
          credit: { label: "Layout after a design by", name: "Faris", href: "https://x.com/Faris_rzk" },
          rotate: { intervalMs: 6000 },
        }}
      />
    </>
  );
}
