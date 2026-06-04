"use client";
import React, { useState, useEffect, useRef } from "react";

/* ===================== SHARED ENGINE (calls our own backend) ===================== */
function pw() { try { return localStorage.getItem("hq_pw") || ""; } catch { return ""; } }

async function callClaude(system, messages, maxTokens = 1024) {
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-app-password": pw() },
    body: JSON.stringify({ system, messages, max_tokens: maxTokens }),
  });
  if (r.status === 401) { try { localStorage.removeItem("hq_pw"); } catch {} throw new Error("Špatné heslo — refreshni stránku a zadej znovu."); }
  const data = await r.json();
  if (data.error) throw new Error(typeof data.error === "string" ? data.error : (data.error.message || "API error"));
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}
const stripJson = (t) => t.replace(/```json|```/g, "").trim();

// cloud storage přes náš backend (Supabase) — sdílený napříč zařízeníma
async function loadData(key) {
  try {
    const r = await fetch(`/api/data?key=${encodeURIComponent(key)}`, { headers: { "x-app-password": pw() } });
    if (!r.ok) return null;
    const d = await r.json();
    return d.value ?? null;
  } catch { return null; }
}
async function saveData(key, value) {
  try {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-app-password": pw() },
      body: JSON.stringify({ key, value }),
    });
  } catch {}
}

const ACCENT = "#30d158", BORDER = "rgba(255,255,255,0.09)", TEXT = "#f5f5f7", MUTED = "#86868b";
const fitColor = (f) => f === "good" ? ACCENT : f === "maybe" ? "#ffd60a" : f === "poor" ? "#ff453a" : MUTED;

const DEFAULT_BRAIN = `# FXSPEEDRUNNER — BRAND BRAIN
Forex edukace + signály. 3letej track record, top-2 na FTMO, 170+ platících členů, ~11,7k IG.
Funnel: free Discord -> placené tiery. Sales se řeší v Discordu (ne přes IG DM).

# TIERY  [OVĚŘ ceny + co přesně každý obsahuje]
- Basic ($99/měs?) — [signály? edukace? komunita?]
- VIP ($149/měs?) — [co navíc?]
- 1-on-1 ($249/měs?) — [rozsah mentoringu?]
- První měsíc / intro: [doplň]

# AUDIENCE
Začátečníci i pokročilejší tradeři, prop/FTMO challengeři. Chtějí konzistenci, ne get-rich-quick.

# VOICE / TÓN
Přímej, upřímnej, lidskej, casual (CZ + EN termíny). Žádný sliby zisku, žádnej hype, žádnej tlak.
Buduješ důvěru pravdou (trading je risk, většina prodělá) — ne přeprodejem.

# FAQ / OBJECTIONS
- "Drahý" -> hodnota vs. cena jedný unmanaged ztráty; co reálně dostane
- "Fungujou signály / scam?" -> 3letej track record, FTMO, transparentnost, žádný sliby
- "Najdu zadarmo" -> rozdíl = edukace + risk management + komunita, ne jen entry
- "Rozmyslím si to" -> dveře otevřený, pošli do free Discordu

# LINKY
Discord: [doplň odkaz] · IG: @[doplň] · web: [doplň]`;

function Copy({ text }) {
  const [c, setC] = useState(false);
  return <button className="hq-ghost" onClick={() => navigator.clipboard.writeText(text).then(() => { setC(true); setTimeout(() => setC(false), 1500); })}>{c ? "✓ zkopírováno" : "📋 kopírovat"}</button>;
}

/* ===================== APP ===================== */
export default function Page() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState("sales");
  const [brain, setBrain] = useState(DEFAULT_BRAIN);

  useEffect(() => {
    try { setAuthed(!!localStorage.getItem("hq_pw")); } catch {}
    setReady(true);
  }, []);

  // brain z cloudu (po přihlášení)
  useEffect(() => {
    if (!authed) return;
    (async () => { const b = await loadData("brain"); if (b) setBrain(b); })();
  }, [authed]);

  if (!ready) return null;
  if (!authed) return <Gate onSet={(p) => { try { localStorage.setItem("hq_pw", p); } catch {} setAuthed(true); }} />;

  const NAV = [
    { id: "sales", ic: "💬", label: "Sales" },
    { id: "chat", ic: "🤖", label: "Asistent" },
    { id: "posts", ic: "✍️", label: "Posty" },
    { id: "brain", ic: "🧠", label: "Brain" },
  ];

  return (
    <div className="hq">
      <aside className="hq-side">
        <div className="hq-logo">SPEEDRUNNER <span style={{ color: ACCENT }}>HQ</span></div>
        <nav className="hq-nav">
          {NAV.map((n) => (
            <div key={n.id} className={"hq-navi" + (tab === n.id ? " on" : "")} onClick={() => setTab(n.id)}>
              <span className="hq-ic">{n.ic}</span>{n.label}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: 24, paddingLeft: 8 }}>
          <div className="hq-mono" style={{ fontSize: 10.5, color: MUTED, marginBottom: 8 }}>v1 · interní</div>
          <span style={{ fontSize: 11, color: MUTED, cursor: "pointer", textDecoration: "underline" }}
                onClick={() => { try { localStorage.removeItem("hq_pw"); } catch {} setAuthed(false); }}>změnit heslo</span>
        </div>
      </aside>
      <main className="hq-main">
        {tab === "sales" && <Sales brain={brain} />}
        {tab === "chat" && <Chat brain={brain} />}
        {tab === "posts" && <Posts brain={brain} />}
        {tab === "brain" && <Brain brain={brain} setBrain={setBrain} />}
      </main>
    </div>
  );
}

/* ---------------- GATE ---------------- */
function Gate({ onSet }) {
  const [v, setV] = useState("");
  return (
    <div className="hq-gate">
      <div className="hq-logo" style={{ fontSize: 24 }}>SPEEDRUNNER <span style={{ color: ACCENT }}>HQ</span></div>
      <div style={{ color: MUTED, fontSize: 13 }}>Zadej heslo (to, co máš v APP_PASSWORD).</div>
      <input className="hq-ta" style={{ maxWidth: 260, textAlign: "center" }} type="password" value={v}
             onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && v) onSet(v); }} placeholder="heslo" />
      <button className="hq-btn" onClick={() => v && onSet(v)}>Vstoupit</button>
    </div>
  );
}

/* ---------------- SALES ---------------- */
function Sales({ brain }) {
  const [channel, setChannel] = useState("Discord");
  const [stage, setStage] = useState("první dotaz");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(null);

  const ENGINE = `You are the SALES CO-PILOT for FXSpeedrunner. You draft replies to prospects for the founder to review and SEND HIMSELF — you never send anything.
RULES: use ONLY facts in the brand brain; never invent prices/claims; if a fact is missing, list it in "missing" (don't guess). Reply in the prospect's language. Match the voice. NEVER promise profits, no hype, no pressure. Qualify lightly, recommend the fitting tier, handle the objection, stay concise & human, end with a low-pressure next step.
Return ONLY valid JSON: {"intent":"","tier":"or -","fit":"good|maybe|poor|unclear","reply":"","missing":[]}`;

  const go = async () => {
    if (!msg.trim()) return;
    setLoading(true); setErr(null); setRes(null);
    try {
      const t = await callClaude(ENGINE + "\n\n=== BRAND BRAIN ===\n" + brain,
        [{ role: "user", content: `Channel: ${channel}\nStage: ${stage}\n\nProspect:\n"""${msg.trim()}"""` }]);
      let p; try { p = JSON.parse(stripJson(t)); } catch { p = { intent: "—", tier: "—", fit: "unclear", reply: stripJson(t), missing: [] }; }
      setRes(p);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="hq-fade">
      <h2 className="hq-h">Sales co-pilot</h2>
      <div className="hq-sub">Pastni zprávu od prospekta → draft on-brand odpovědi. Kontroluješ a posíláš sám.</div>
      <div className="hq-card">
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
          <div><div className="hq-label" style={{ marginBottom: 6 }}>Kanál</div>
            <select className="hq-sel" value={channel} onChange={(e) => setChannel(e.target.value)}><option>Discord</option><option>Instagram</option><option>jiný</option></select></div>
          <div><div className="hq-label" style={{ marginBottom: 6 }}>Fáze</div>
            <select className="hq-sel" value={stage} onChange={(e) => setStage(e.target.value)}><option>první dotaz</option><option>otázka na cenu</option><option>objection</option><option>follow-up</option><option>obecný</option></select></div>
        </div>
        <div className="hq-label" style={{ marginBottom: 6 }}>Zpráva od prospekta</div>
        <textarea className="hq-ta" style={{ minHeight: 100 }} value={msg} onChange={(e) => setMsg(e.target.value)}
          placeholder='např. "ahoj, koukal jsem na vás na IG, jak to funguje a kolik to stojí? netradoval jsem nikdy"' />
        <div style={{ marginTop: 12 }}><button className="hq-btn" onClick={go} disabled={loading || !msg.trim()}>{loading ? <><span className="hq-spin" />&nbsp; Formuluju…</> : "Naformuluj odpověď →"}</button></div>
      </div>
      {err && <div className="hq-card" style={{ borderColor: "#ff453a55", color: "#ff453a" }}>{err}</div>}
      {res && (
        <div className="hq-card hq-fade">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 13 }}>
            <span className="hq-chip"><span className="hq-dot" style={{ background: MUTED }} />intent: <b>{res.intent || "—"}</b></span>
            <span className="hq-chip"><span className="hq-dot" style={{ background: ACCENT }} />tier: <b>{res.tier || "—"}</b></span>
            <span className="hq-chip"><span className="hq-dot" style={{ background: fitColor(res.fit) }} />fit: <b style={{ color: fitColor(res.fit) }}>{res.fit}</b></span>
          </div>
          <div className="hq-label" style={{ marginBottom: 8 }}>Draft</div>
          <div className="hq-out">{res.reply}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}><Copy text={res.reply || ""} /><button className="hq-ghost" onClick={go}>↻ jinak</button></div>
          {Array.isArray(res.missing) && res.missing.length > 0 && (
            <div style={{ marginTop: 13, padding: "10px 13px", background: "rgba(255,214,10,0.08)", border: "1px solid #ffd60a40", borderRadius: 10, fontSize: 13 }}>
              <b style={{ color: "#ffd60a" }}>Chybí v mozku:</b>
              <ul style={{ margin: "5px 0 0", paddingLeft: 18 }}>{res.missing.map((m, i) => <li key={i}>{m}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- CHAT ---------------- */
function Chat({ brain }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  // načti uloženej chat z cloudu jednou
  useEffect(() => {
    (async () => { const c = await loadData("chat"); if (Array.isArray(c)) setMsgs(c); setHydrated(true); })();
  }, []);
  // ukládej do cloudu při změně (až po načtení, ať prázdnej start nepřepíše uloženej chat)
  useEffect(() => {
    if (!hydrated) return;
    saveData("chat", msgs);
  }, [msgs, hydrated]);

  const clearChat = () => setMsgs([]);

  const SYS = `You are the internal FXSpeedrunner assistant for the founder (Kuba, CGO). Help with strategy, content ideas, pricing, member/community decisions, copywriting and quick thinking — practical, direct, honest. Use the brand brain for context. Push back honestly when something is a bad idea. Czech by default (he mixes CZ + EN terms). Be concise unless asked to go deep. Never promise trading profits.\n\n=== BRAND BRAIN ===\n${brain}`;

  const send = async () => {
    if (!input.trim() || loading) return;
    const next = [...msgs, { role: "user", content: input.trim() }];
    setMsgs(next); setInput(""); setLoading(true);
    try {
      const t = await callClaude(SYS, next.map((m) => ({ role: m.role, content: m.content })), 1024);
      setMsgs([...next, { role: "assistant", content: t || "(prázdná odpověď)" }]);
    } catch (e) { setMsgs([...next, { role: "assistant", content: "⚠ " + e.message }]); }
    finally { setLoading(false); }
  };

  return (
    <div className="hq-fade" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <h2 className="hq-h">Asistent</h2>
          <div className="hq-sub">Tvůj interní parťák — zná brand, pomáhá s rozhodnutíma, nápadama, textama. (Historie se ukládá v prohlížeči.)</div>
        </div>
        {msgs.length > 0 && <button className="hq-ghost" onClick={clearChat} style={{ flexShrink: 0 }}>Nový chat</button>}
      </div>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "4px 2px 14px" }}>
        {msgs.length === 0 && <div style={{ color: MUTED, fontSize: 13.5, margin: "auto", textAlign: "center", maxWidth: 360 }}>
          Zeptej se na cokoliv kolem Speedrunneru — „naplánuj mi obsah na tejden", „jak zvednout konverzi z free do VIP", „napiš onboarding zprávu pro nový členy"…</div>}
        {msgs.map((m, i) => <div key={i} className={"hq-bub " + (m.role === "user" ? "hq-u" : "hq-a")}>{m.content}</div>)}
        {loading && <div className="hq-bub hq-a"><span className="hq-spin" style={{ borderColor: "#30d15855", borderTopColor: ACCENT }} /> &nbsp;přemýšlím…</div>}
        <div ref={endRef} />
      </div>
      <div style={{ display: "flex", gap: 10, borderTop: "1px solid " + BORDER, paddingTop: 12 }}>
        <textarea className="hq-ta" style={{ minHeight: 46, flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="napiš zprávu… (Enter pošle, Shift+Enter nový řádek)" />
        <button className="hq-btn" onClick={send} disabled={loading || !input.trim()}>→</button>
      </div>
    </div>
  );
}

/* ---------------- POSTS ---------------- */
function Posts({ brain }) {
  const TYPES = ["IG caption", "Story text", "Daily trade recap", "Hooky / nápady na posty"];
  const [type, setType] = useState(TYPES[0]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState(null);
  const [err, setErr] = useState(null);

  const go = async () => {
    if (!topic.trim()) return;
    setLoading(true); setErr(null); setVariants(null);
    const SYS = `You write social content for FXSpeedrunner in the brand voice. Honest, human, no hype, NEVER promise profits, no false urgency. Use the brand brain. Match Czech/English to the topic input. Format fits "${type}". Give 3 distinct options.
Return ONLY valid JSON: {"variants":["option 1","option 2","option 3"]}\n\n=== BRAND BRAIN ===\n${brain}`;
    try {
      const t = await callClaude(SYS, [{ role: "user", content: `Type: ${type}\nTéma / detaily: ${topic.trim()}` }], 1024);
      let v; try { v = JSON.parse(stripJson(t)).variants; } catch { v = [stripJson(t)]; }
      setVariants(Array.isArray(v) ? v : [String(v)]);
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="hq-fade">
      <h2 className="hq-h">Post creator</h2>
      <div className="hq-sub">Drafty obsahu v tvým hlasu — 3 varianty na výběr.</div>
      <div className="hq-card">
        <div className="hq-label" style={{ marginBottom: 6 }}>Typ</div>
        <select className="hq-sel" style={{ marginBottom: 12 }} value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        <div className="hq-label" style={{ marginBottom: 6 }}>Téma / detaily</div>
        <textarea className="hq-ta" style={{ minHeight: 90 }} value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder='např. "dnešní XAUUSD trade +2R, jak jsme to brali podle RBOS" nebo "proč risk management > entry"' />
        <div style={{ marginTop: 12 }}><button className="hq-btn" onClick={go} disabled={loading || !topic.trim()}>{loading ? <><span className="hq-spin" />&nbsp; Píšu…</> : "Vygeneruj 3 varianty →"}</button></div>
      </div>
      {err && <div className="hq-card" style={{ borderColor: "#ff453a55", color: "#ff453a" }}>{err}</div>}
      {variants && variants.map((v, i) => (
        <div key={i} className="hq-card hq-fade">
          <div className="hq-label" style={{ marginBottom: 8 }}>Varianta {i + 1}</div>
          <div className="hq-out">{v}</div>
          <div style={{ marginTop: 10 }}><Copy text={v} /></div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- BRAIN ---------------- */
function Brain({ brain, setBrain }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await saveData("brain", brain);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 1600);
  };
  return (
    <div className="hq-fade">
      <h2 className="hq-h">Brand brain</h2>
      <div className="hq-sub">Sdílený mozek pro všechny nástroje. Čím přesnější (ceny, FAQ, tón, linky), tím lepší všechno ostatní. Ukládá se do cloudu — vidíš ho na všech zařízeních.</div>
      <div className="hq-card">
        <textarea className="hq-ta hq-mono" style={{ minHeight: 420, fontSize: 12.5 }} value={brain} onChange={(e) => setBrain(e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
          <button className="hq-btn" onClick={save} disabled={saving}>{saving ? "Ukládám…" : saved ? "✓ Uloženo" : "Uložit mozek"}</button>
          <span style={{ fontSize: 12, color: MUTED }}>Sales, Asistent i Posty z tohohle čerpaj.</span>
        </div>
      </div>
    </div>
  );
}
