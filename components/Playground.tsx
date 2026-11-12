"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GrainFooter, type SocialType } from "@/components/GrainFooter";
import { PublikChoice, usePublik } from "@/components/PublikGate";
import { htmlSnippet, reactSnippet } from "@/lib/exportCode";
import { clearDraft, loadDraft, newDraft, saveDraft, shrinkImage, slugFile, toConfig, uid, type Draft, type ImageItem } from "@/lib/store";

const SAMPLES: ImageItem[] = [
  { id: "s-dusk", src: "/footer/dusk.jpg", path: "/footer/dusk.jpg", name: "dusk.jpg (sample)", sample: true },
  { id: "s-meadow", src: "/footer/meadow.jpg", path: "/footer/meadow.jpg", name: "meadow.jpg (sample)", sample: true },
  { id: "s-coast", src: "/footer/coast.jpg", path: "/footer/coast.jpg", name: "coast.jpg (sample)", sample: true },
];
const KEY_STORE = "grainfoot:anthropic-key";

/* ---------- image adding, shared by onboarding and the editor ---------- */

function AddImage({ onAdd, compact }: { onAdd: (items: ImageItem[]) => void; compact?: boolean }) {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setErr("");
    try {
      const items: ImageItem[] = [];
      for (const f of Array.from(files).slice(0, 6)) {
        const src = await shrinkImage(f);
        items.push({ id: uid(), src, path: `/footer/${slugFile(f.name)}`, name: f.name });
      }
      onAdd(items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't read that file.");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
    }
  }
  function addUrl() {
    const u = url.trim();
    if (!/^(https?:\/\/|\/)/.test(u)) { setErr("Paste a full image URL (https://…) or a path on your site (/footer/photo.jpg)."); return; }
    setErr("");
    onAdd([{ id: uid(), src: u, path: u, name: u.split("/").pop() || u }]);
    setUrl("");
  }
  return (
    <div className="add" id="add-image">
      <div
        className={"drop" + (compact ? " drop-sm" : "")}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); void upload(e.dataTransfer.files); }}
      >
        <button type="button" className="btn" disabled={busy} onClick={() => file.current?.click()}>{busy ? "Reading…" : "Upload photos"}</button>
        <span className="muted">or drop them here. Wide photos look best.</span>
        <input ref={file} type="file" accept="image/*" multiple hidden onChange={(e) => void upload(e.target.files)} />
      </div>
      <div className="row">
        <input className="input" placeholder="https://… or /footer/photo.jpg" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addUrl()} aria-label="Image URL or path" />
        <button type="button" className="btn" onClick={addUrl}>Add</button>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
    </div>
  );
}

/* ---------- first run ---------- */

function Onboarding({ onDone }: { onDone: (d: Draft) => void }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  return (
    <main className="onb">
      <div className="card onb-card">
        <p className="muted small">Step {step + 1} of 2</p>
        {step === 0 ? (
          <>
            <h1>Whose footer is this?</h1>
            <p className="muted">Your site&apos;s name and one line about it. You can change both later.</p>
            <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) setStep(1); }} className="stack">
              <label className="field">Site name<input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fieldwork Studio" maxLength={40} /></label>
              <label className="field">Tagline <span>optional</span><input className="input" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Brand and web design for small shops." maxLength={120} /></label>
              <button className="btn btn-primary" disabled={!name.trim()}>Next</button>
            </form>
          </>
        ) : (
          <>
            <h1>Add the photos for the band</h1>
            <p className="muted">These get the grain. One stays still; two or more crossfade. They stay in this browser.</p>
            <AddImage onAdd={(it) => setImages((x) => [...x, ...it])} />
            {images.length > 0 && (
              <ul className="thumbs">{images.map((i) => <li key={i.id}><img src={i.src} alt="" /><span>{i.name}</span></li>)}</ul>
            )}
            <div className="row">
              <button type="button" className="btn btn-primary" disabled={!images.length} onClick={() => onDone({ ...newDraft(name.trim(), tagline.trim()), images })}>
                Make my footer
              </button>
              <button type="button" className="btn" onClick={() => setStep(0)}>Back</button>
            </div>
            <p className="muted small">
              No photo handy?{" "}
              <button type="button" className="linkish" onClick={() => onDone({ ...newDraft(name.trim(), tagline.trim()), images: [SAMPLES[0]] })}>
                Start with a grainfoot sample image
              </button>{" "}
              and swap in yours later.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

/* ---------- editor ---------- */

function Panel({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <details className="panel" open id={id}>
      <summary>{title}</summary>
      <div className="panel-body">{children}</div>
    </details>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; fmt?: (n: number) => string }) {
  return (
    <label className="field">
      <div className="slider-head"><span>{label}</span><output>{fmt ? fmt(value) : value}</output></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </label>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn btn-sm" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* clipboard blocked */ }
    }}>{done ? "Copied" : label}</button>
  );
}

function WriteWithAi({ draft, apply }: { draft: Draft; apply: (p: Partial<Draft>) => void }) {
  const { choice } = usePublik();
  const [about, setAbout] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ msg: string; topUp?: string } | null>(null);
  useEffect(() => { try { setKey(localStorage.getItem(KEY_STORE) ?? ""); } catch { /* no storage */ } }, []);
  const viaPublik = choice === "publik";

  async function run() {
    setBusy(true); setErr(null);
    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (!viaPublik && key.trim()) headers["x-anthropic-key"] = key.trim();
      const res = await fetch("/api/write", { method: "POST", headers, body: JSON.stringify({ name: draft.brand.name, about }) });
      const body = await res.json();
      if (!res.ok) { setErr({ msg: body.error ?? "Something went wrong.", topUp: body.topUpUrl }); return; }
      apply({
        brand: { ...draft.brand, tagline: body.tagline },
        columns: (body.columns as { title: string; links: { label: string; href: string }[] }[]).slice(0, 3).map((c) => ({ title: c.title, lines: c.links.map((l) => `${l.label}, ${l.href}`).join("\n") })),
      });
    } catch {
      setErr({ msg: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="stack">
      <label className="field">Describe your site in a sentence
        <input className="input" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="e.g. a ceramics shop that also runs pottery classes" maxLength={300} />
      </label>
      {!viaPublik && (
        <label className="field">Your Anthropic API key <span>kept in this browser, sent only with this request</span>
          <input className="input" type="password" value={key} autoComplete="off" onChange={(e) => { setKey(e.target.value); try { localStorage.setItem(KEY_STORE, e.target.value); } catch { /* no storage */ } }} placeholder="sk-ant-…" />
        </label>
      )}
      <button type="button" className="btn btn-primary" disabled={busy || !about.trim() || (!viaPublik && !key.trim())} onClick={() => void run()}>
        {busy ? "Writing…" : "Write my tagline and links"}
      </button>
      {err && <p className="err" role="alert">{err.msg}{err.topUp && <> <a href={err.topUp} target="_blank" rel="noopener noreferrer">Top up on publik</a></>}</p>}
      <PublikChoice />
    </div>
  );
}

function Guide({ onClose, actions }: { onClose: () => void; actions: { add: () => void; grain: () => void; copy: () => void } }) {
  return (
    <div className="guide card" role="note">
      <div className="guide-head"><b>How to use grainfoot</b><button type="button" className="linkish" onClick={onClose}>Got it, hide this</button></div>
      <ol>
        <li><b>Add more photos</b> and they&apos;ll crossfade; hover the band to flip. <button type="button" className="linkish" onClick={actions.add}>Add a photo</button></li>
        <li><b>Tune the grain</b> with the sliders on the left. <button type="button" className="linkish" onClick={actions.grain}>Try heavy grain</button></li>
        <li><b>Copy the code</b> below the preview, put your photos in <code>public/</code> at the paths shown. <button type="button" className="linkish" onClick={actions.copy}>Show me the code</button></li>
      </ol>
    </div>
  );
}

export default function Playground() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"react" | "html" | "file">("react");
  const [component, setComponent] = useState("");
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraft(loadDraft()); setLoaded(true); }, []);
  useEffect(() => { if (draft) setSaveErr(saveDraft(draft)); }, [draft]);
  useEffect(() => {
    fetch("/grainfoot/GrainFooter.tsx").then((r) => (r.ok ? r.text() : "")).then(setComponent).catch(() => setComponent(""));
  }, []);

  const preview = useMemo(() => (draft ? toConfig(draft) : null), [draft]);
  const exportCfg = useMemo(() => (draft ? toConfig(draft, true) : null), [draft]);
  const code = useMemo(() => {
    if (!exportCfg) return "";
    return tab === "react" ? reactSnippet(exportCfg) : tab === "html" ? htmlSnippet(exportCfg) : component || "Loading…";
  }, [exportCfg, tab, component]);

  if (!loaded) return <main className="onb"><p className="muted">Loading…</p></main>;
  if (!draft || !preview) return <Onboarding onDone={setDraft} />;

  const set = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d));
  const moveImage = (i: number, dir: -1 | 1) => {
    const imgs = [...draft.images]; const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    set({ images: imgs });
  };
  const uploads = draft.images.filter((i) => i.src.startsWith("data:"));

  return (
    <div className="pg">
      <header className="pg-top">
        <a href="/" className="logo"><img src="/icon.svg" alt="" width={24} height={24} />grainfoot</a>
        <div className="row">
          <span className="muted small hide-sm">Saved in this browser</span>
          <button type="button" className="btn btn-sm" onClick={() => { if (confirm("Start over? This clears your footer from this browser.")) { clearDraft(); setDraft(null); } }}>Start over</button>
        </div>
      </header>

      <div className="pg-main">
        <aside className="pg-side">
          <Panel title="Photos">
            <ul className="imglist">
              {draft.images.map((im, i) => (
                <li key={im.id}>
                  <img src={im.src} alt="" />
                  <div className="imgmeta">
                    <span className="small">{im.name}</span>
                    <input className="input input-sm" value={im.path} aria-label="Path in your site" onChange={(e) => set({ images: draft.images.map((x) => (x.id === im.id ? { ...x, path: e.target.value } : x)) })} />
                  </div>
                  <div className="imgbtns">
                    <button type="button" aria-label="Move up" onClick={() => moveImage(i, -1)} disabled={i === 0}>↑</button>
                    <button type="button" aria-label="Move down" onClick={() => moveImage(i, 1)} disabled={i === draft.images.length - 1}>↓</button>
                    <button type="button" aria-label="Remove" onClick={() => set({ images: draft.images.filter((x) => x.id !== im.id) })}>✕</button>
                  </div>
                </li>
              ))}
            </ul>
            {!draft.images.length && <p className="muted small">No photos yet. The band shows a plain colour until you add one.</p>}
            <AddImage compact onAdd={(it) => set({ images: [...draft.images, ...it] })} />
          </Panel>

          <Panel title="Grain" id="grain">
            <Slider label="Amount" value={draft.grain.amount} min={0} max={1} step={0.01} onChange={(amount) => set({ grain: { ...draft.grain, amount } })} fmt={(n) => n.toFixed(2)} />
            <Slider label="Grain size" value={draft.grain.size} min={0.6} max={4} step={0.1} onChange={(size) => set({ grain: { ...draft.grain, size } })} fmt={(n) => n.toFixed(1)} />
            <Slider label="Weave lines" value={draft.grain.weave} min={0} max={1} step={0.01} onChange={(weave) => set({ grain: { ...draft.grain, weave } })} fmt={(n) => n.toFixed(2)} />
            <label className="field row-field">Tint<input type="color" value={draft.grain.tint} onChange={(e) => set({ grain: { ...draft.grain, tint: e.target.value } })} /></label>
            <label className="check"><input type="checkbox" checked={draft.grain.animate} onChange={(e) => set({ grain: { ...draft.grain, animate: e.target.checked } })} /> Shimmering grain</label>
          </Panel>

          <Panel title="Motion and shape">
            <Slider label="Seconds per photo (0 = no timer)" value={draft.rotate.seconds} min={0} max={15} step={0.5} onChange={(seconds) => set({ rotate: { ...draft.rotate, seconds } })} fmt={(n) => (n ? `${n}s` : "off")} />
            <label className="check"><input type="checkbox" checked={draft.rotate.onHover} onChange={(e) => set({ rotate: { ...draft.rotate, onHover: e.target.checked } })} /> Hover shows the next photo</label>
            <Slider label="Band shape (width ÷ height)" value={draft.aspect} min={1.6} max={6} step={0.1} onChange={(aspect) => set({ aspect })} fmt={(n) => `${n.toFixed(1)} : 1`} />
            <div className="seg" role="group" aria-label="Theme">
              <button type="button" aria-pressed={draft.theme === "light"} onClick={() => set({ theme: "light" })}>Light</button>
              <button type="button" aria-pressed={draft.theme === "dark"} onClick={() => set({ theme: "dark" })}>Dark</button>
            </div>
          </Panel>

          <Panel title="Brand">
            <label className="field">Name<input className="input" value={draft.brand.name} onChange={(e) => set({ brand: { ...draft.brand, name: e.target.value } })} /></label>
            <label className="field">Tagline<input className="input" value={draft.brand.tagline} onChange={(e) => set({ brand: { ...draft.brand, tagline: e.target.value } })} /></label>
            <label className="field">Logo image URL <span>optional</span><input className="input" value={draft.brand.logo} placeholder="/logo.svg" onChange={(e) => set({ brand: { ...draft.brand, logo: e.target.value } })} /></label>
            <label className="field">Copyright line <span>blank = ©year name</span><input className="input" value={draft.copyright} onChange={(e) => set({ copyright: e.target.value })} /></label>
          </Panel>

          <Panel title="Links">
            <p className="muted small">One link per line: <code>Label, /path</code></p>
            {draft.columns.map((c, i) => (
              <div key={i} className="stack-sm">
                <input className="input" value={c.title} aria-label={`Column ${i + 1} title`} onChange={(e) => set({ columns: draft.columns.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
                <textarea className="input" value={c.lines} aria-label={`Column ${i + 1} links`} onChange={(e) => set({ columns: draft.columns.map((x, j) => (j === i ? { ...x, lines: e.target.value } : x)) })} />
              </div>
            ))}
          </Panel>

          <Panel title="Write the links with AI">
            <WriteWithAi draft={draft} apply={set} />
          </Panel>

          <Panel title="On the photo">
            <label className="check"><input type="checkbox" checked={draft.status.show} onChange={(e) => set({ status: { ...draft.status, show: e.target.checked } })} /> Status pill</label>
            {draft.status.show && (
              <div className="row">
                <input className="input" value={draft.status.label} aria-label="Status text" onChange={(e) => set({ status: { ...draft.status, label: e.target.value } })} />
                <label className="check"><input type="checkbox" checked={draft.status.ok} onChange={(e) => set({ status: { ...draft.status, ok: e.target.checked } })} /> green</label>
              </div>
            )}
            {(Object.keys(draft.socials) as SocialType[]).map((k) => (
              <label key={k} className="field">{k === "x" ? "X" : k === "link" ? "Other link" : k[0].toUpperCase() + k.slice(1)}
                <input className="input" value={draft.socials[k]} placeholder="https://…" onChange={(e) => set({ socials: { ...draft.socials, [k]: e.target.value } })} />
              </label>
            ))}
            <label className="check"><input type="checkbox" checked={draft.credit.show} onChange={(e) => set({ credit: { ...draft.credit, show: e.target.checked } })} /> Credit line (e.g. Designed by …)</label>
            {draft.credit.show && (
              <div className="stack-sm">
                <input className="input" value={draft.credit.label} aria-label="Credit label" onChange={(e) => set({ credit: { ...draft.credit, label: e.target.value } })} />
                <input className="input" value={draft.credit.name} placeholder="Name" aria-label="Credit name" onChange={(e) => set({ credit: { ...draft.credit, name: e.target.value } })} />
                <input className="input" value={draft.credit.href} placeholder="https://…" aria-label="Credit link" onChange={(e) => set({ credit: { ...draft.credit, href: e.target.value } })} />
              </div>
            )}
          </Panel>
        </aside>

        <section className="pg-stage">
          {!draft.guideDone && (
            <Guide
              onClose={() => set({ guideDone: true })}
              actions={{
                add: () => document.querySelector<HTMLElement>("#add-image input.input")?.focus(),
                grain: () => set({ grain: { ...draft.grain, amount: 0.9, size: 2.2, weave: 0.6 } }),
                copy: () => codeRef.current?.scrollIntoView({ behavior: "smooth" }),
              }}
            />
          )}
          {saveErr && <p className="err" role="alert">{saveErr}</p>}
          <div className="preview card">
            <div className="fake-page" aria-hidden><span /><span /><span /></div>
            <GrainFooter config={preview} />
          </div>

          <div className="code card" ref={codeRef} id="code">
            <div className="code-head">
              <div className="seg" role="tablist" aria-label="Code">
                <button type="button" role="tab" aria-pressed={tab === "react"} onClick={() => setTab("react")}>Your config (React)</button>
                <button type="button" role="tab" aria-pressed={tab === "file"} onClick={() => setTab("file")}>GrainFooter.tsx</button>
                <button type="button" role="tab" aria-pressed={tab === "html"} onClick={() => setTab("html")}>Plain HTML</button>
              </div>
              <div className="row">
                <CopyButton text={code} label="Copy" />
                {tab === "file" && <a className="btn btn-sm" href="/grainfoot/GrainFooter.tsx" download="GrainFooter.tsx">Download</a>}
              </div>
            </div>
            <p className="muted small">
              {tab === "react" && <>Save <b>GrainFooter.tsx</b> into your components folder, then paste this. Image paths come from the Photos panel.</>}
              {tab === "file" && <>The whole component: one file, no dependencies besides React.</>}
              {tab === "html" && <>For any site without React: style, markup and a tiny script in one paste.</>}
            </p>
            <pre><code>{code}</code></pre>
            {uploads.length > 0 && (
              <div className="dl">
                <p className="small"><b>Your uploaded photos</b>: save each into your site at its path.</p>
                <div className="row wrap-row">
                  {uploads.map((u) => <a key={u.id} className="btn btn-sm" href={u.src} download={u.path.split("/").pop() || "image.jpg"}>Save {u.path}</a>)}
                </div>
              </div>
            )}
          </div>
          <p className="muted small foot">free &amp; open source · layout after a design by Faris (@Faris_rzk) · not affiliated with him or his clients</p>
        </section>
      </div>
    </div>
  );
}
