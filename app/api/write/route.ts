import { cookies } from "next/headers";
import { MODELS, publikChat, resolveProvider } from "@/lib/publik";

/*
 * "Write my footer": one sentence about the person's site → a tagline and three link columns.
 * publik API when they chose "Connect your plan" (the key stays in its sealed cookie on the server),
 * otherwise their own Anthropic key from a request header, used for this one call and never stored.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `You write website footers. Given a one-line description of a site, reply with JSON only, no prose:
{"tagline": string (max 70 chars, plain, no emoji), "columns": [{"title": string, "links": [{"label": string, "href": string}]}]}
Exactly 3 columns, 3 to 5 links each, short labels (1-3 words), hrefs as relative paths like "/pricing". Fit the links to that kind of site.`;

const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

type Out = { tagline: string; columns: { title: string; links: { label: string; href: string }[] }[] };

function parse(text: string): Out | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]) as Out;
    if (typeof o.tagline !== "string" || !Array.isArray(o.columns)) return null;
    return {
      tagline: o.tagline.slice(0, 120),
      columns: o.columns.slice(0, 4).map((c) => ({
        title: String(c?.title ?? "").slice(0, 40),
        links: (Array.isArray(c?.links) ? c.links : []).slice(0, 6).map((l) => ({ label: String(l?.label ?? "").slice(0, 40), href: String(l?.href ?? "#").slice(0, 200) })),
      })),
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const ownKey = req.headers.get("x-anthropic-key")?.trim();
  const p = resolveProvider(await cookies(), ownKey ? { baseURL: "https://api.anthropic.com", apiKey: ownKey } : null);
  if (p.kind === "needs_own_key") return json({ error: "Add your Anthropic API key below, or switch to your publik plan." }, 401);

  let about = "";
  try {
    const b = (await req.json()) as { about?: unknown; name?: unknown };
    about = `Site name: ${String(b.name ?? "").slice(0, 60)}\nAbout: ${String(b.about ?? "").slice(0, 400)}`;
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  let text = "";
  if (p.kind === "publik") {
    const r = await publikChat(p, { model: MODELS.fast, max_tokens: 800, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: about }] }, req.signal);
    if (!r.ok) return json({ error: r.message, ...(r.topUpUrl ? { topUpUrl: r.topUpUrl } : {}) }, r.status);
    text = r.text;
  } else {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": p.apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 800, system: SYSTEM, messages: [{ role: "user", content: about }] }),
      signal: req.signal,
    }).catch(() => null);
    if (!res) return json({ error: "Couldn't reach Anthropic. Try again." }, 502);
    const body = (await res.json().catch(() => ({}))) as { content?: { text?: string }[]; error?: { message?: string } };
    if (!res.ok) return json({ error: body.error?.message ?? `Anthropic answered ${res.status}.` }, res.status === 401 ? 401 : 502);
    text = (body.content ?? []).map((c) => c.text ?? "").join("");
  }
  const out = parse(text);
  return out ? json(out) : json({ error: "The model's answer wasn't usable. Try again with a bit more detail." }, 502);
}
