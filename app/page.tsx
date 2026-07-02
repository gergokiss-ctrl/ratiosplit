"use client";

import { useEffect, useMemo, useState } from "react";

type Person = { id: string; name: string; displayOrder: number };
type Category = { id: string; name: string; color?: string | null };
type Expense = { id:string; date:string; description:string; amountOriginalMinor:number; currency:string; exchangeRateToHufMicros:number; amountHufMinor:number; paidByPersonId:string; splitType:string; categoryId?:string|null; paidByPerson:Person; category?:Category|null; customSplits?: { personId:string; ratioBps:number|null }[] };
type Settlement = { paid1:number; paid2:number; owed1:number; owed2:number; balance1:number; balance2:number; settlementDirection:string; settlementAmount:number };

const splitLabels: Record<string,string> = { MONTHLY_RATIO:"Havi arány", EQUAL:"50/50", PERSON_1_ONLY:"Csak Gergo", PERSON_2_ONLY:"Csak Partner", CUSTOM_PERCENT:"Egyedi %", EXCLUDED:"Kihagyva" };

function currentMonthKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function toDateInput(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function huf(minor:number) { return new Intl.NumberFormat("hu-HU", { style:"currency", currency:"HUF", maximumFractionDigits:0 }).format(minor/100); }
function money(minor:number, currency:string) { return new Intl.NumberFormat("hu-HU", { style:"currency", currency: currency === "OTHER" ? "HUF" : currency, maximumFractionDigits:2 }).format(minor/100); }
function pctFromBps(bps?:number|null) { return bps == null ? "nincs" : `${(bps/100).toLocaleString("hu-HU", { maximumFractionDigits:2 })}%`; }

export default function Home() {
  const [people,setPeople] = useState<Person[]>([]);
  const [categories,setCategories] = useState<Category[]>([]);
  const [expenses,setExpenses] = useState<Expense[]>([]);
  const [settlement,setSettlement] = useState<Settlement|null>(null);
  const [month,setMonth] = useState(currentMonthKey());
  const [monthRatio,setMonthRatio] = useState<{person1RatioBps:number|null; person2RatioBps:number|null}>({person1RatioBps:null, person2RatioBps:null});
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");

  const p1 = people[0]; const p2 = people[1];

  const [form,setForm] = useState({ date:toDateInput(), description:"", amount:"", currency:"HUF", exchangeRate:"1", paidByPersonId:"", splitType:"MONTHLY_RATIO", categoryId:"", note:"", customPerson1Percent:"50" });
  const [ratioInput,setRatioInput] = useState("");

  async function loadMeta() {
    const r = await fetch("/api/meta");
    const data = await r.json();
    setPeople(data.people); setCategories(data.categories);
    if (data.people?.[0]) setForm(f => ({...f, paidByPersonId: f.paidByPersonId || data.people[0].id}));
  }

  async function loadMonth() {
    const [er, sr, mr] = await Promise.all([
      fetch(`/api/expenses?monthKey=${month}`),
      fetch(`/api/settlement/${month}`),
      fetch(`/api/months/${month}`)
    ]);
    setExpenses(await er.json());
    const sdata = await sr.json(); setSettlement(sdata.settlement ?? null);
    const mdata = await mr.json();
    setMonthRatio({ person1RatioBps:mdata.person1RatioBps ?? null, person2RatioBps:mdata.person2RatioBps ?? null });
    if (mdata.person1RatioBps != null) setRatioInput(String(mdata.person1RatioBps/100));
  }

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { loadMonth(); }, [month]);

  const totals = useMemo(() => {
    const total = expenses.filter(e => e.splitType !== "EXCLUDED").reduce((a,e)=>a+e.amountHufMinor,0);
    const excluded = expenses.filter(e => e.splitType === "EXCLUDED").reduce((a,e)=>a+e.amountHufMinor,0);
    return { total, excluded, count: expenses.length };
  }, [expenses]);

  async function createExpense(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/expenses", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mentési hiba");
      setForm(f => ({...f, description:"", amount:"", note:""}));
      setMonth(data.monthKey);
      await loadMonth();
      setMessage("Költség mentve.");
    } catch(err:any) { setMessage(err.message); }
    finally { setLoading(false); }
  }

  async function saveRatio(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const res = await fetch(`/api/months/${month}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ person1Percent: ratioInput }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Mentési hiba");
      await loadMonth(); setMessage("Havi arány mentve.");
    } catch(err:any) { setMessage(err.message); }
    finally { setLoading(false); }
  }

  async function removeExpense(id:string) {
    if (!confirm("Törlöd ezt a költséget?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method:"DELETE" });
    if (res.ok) await loadMonth();
  }

  const resultText = useMemo(() => {
    if (!settlement || !p1 || !p2) return "Adj meg havi arányt és költségeket.";
    if (settlement.settlementDirection === "NONE") return "Nincs rendezendő összeg.";
    if (settlement.settlementDirection === "PERSON_2_TO_PERSON_1") return `${p2.name} fizessen ${p1.name} részére: ${huf(settlement.settlementAmount)}`;
    return `${p1.name} fizessen ${p2.name} részére: ${huf(settlement.settlementAmount)}`;
  }, [settlement,p1,p2]);

  return <main className="shell">
    <header className="header">
      <div className="logo"><div className="logo-mark"/><div><h1 className="h-title">RatioSplit</h1><p className="h-sub">Havi arányos közös költségelszámoló SQLite alapon</p></div></div>
      <div className="row" style={{maxWidth:360}}><div className="field"><label>Hónap</label><input value={month} onChange={e=>setMonth(e.target.value)} placeholder="2026-06" /></div><div className="field"><label>&nbsp;</label><a className="btn secondary" style={{textAlign:"center", textDecoration:"none"}} href={`/api/export/${month}`}>CSV export</a></div></div>
    </header>

    {message && <div className="notice" style={{marginBottom:16}}>{message}</div>}

    <section className="grid cards">
      <div className="card"><div className="metric-label">Elszámolt költség</div><div className="metric">{huf(totals.total)}</div><div className="muted">{totals.count} tétel</div></div>
      <div className="card"><div className="metric-label">{p1?.name ?? "Személy 1"} fizetett</div><div className="metric">{huf(settlement?.paid1 ?? 0)}</div><div className="muted">Része: {huf(settlement?.owed1 ?? 0)}</div></div>
      <div className="card"><div className="metric-label">{p2?.name ?? "Személy 2"} fizetett</div><div className="metric">{huf(settlement?.paid2 ?? 0)}</div><div className="muted">Része: {huf(settlement?.owed2 ?? 0)}</div></div>
      <div className="card"><div className="metric-label">Rendezés</div><div className="metric good">{settlement ? huf(settlement.settlementAmount) : "—"}</div><div className="muted">{resultText}</div></div>
    </section>

    <section className="layout">
      <div className="grid">
        <div className="card">
          <h2>Új költség</h2>
          <form className="form" onSubmit={createExpense}>
            <div className="row"><div className="field"><label>Dátum</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="field"><label>Fizette</label><select value={form.paidByPersonId} onChange={e=>setForm({...form,paidByPersonId:e.target.value})}>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
            <div className="field"><label>Leírás</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="pl. Lidl, benzin, villanyszámla"/></div>
            <div className="row"><div className="field"><label>Összeg</label><input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} inputMode="decimal" placeholder="18450"/></div><div className="field"><label>Deviza</label><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value,exchangeRate:e.target.value==="HUF"?"1":form.exchangeRate})}>{["HUF","EUR","USD","GBP","CHF","CZK","PLN","OTHER"].map(c=><option key={c} value={c}>{c}</option>)}</select></div></div>
            <div className="row"><div className="field"><label>Árfolyam HUF-hoz</label><input value={form.exchangeRate} onChange={e=>setForm({...form,exchangeRate:e.target.value})} inputMode="decimal" disabled={form.currency==="HUF"}/></div><div className="field"><label>Kategória</label><select value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}><option value="">Nincs</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
            <div className="field"><label>Split típus</label><select value={form.splitType} onChange={e=>setForm({...form,splitType:e.target.value})}>{Object.entries(splitLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
            {form.splitType === "CUSTOM_PERCENT" && <div className="field"><label>{p1?.name ?? "Személy 1"} egyedi százaléka</label><input value={form.customPerson1Percent} onChange={e=>setForm({...form,customPerson1Percent:e.target.value})} inputMode="decimal"/><span className="muted">A másik fél automatikusan a maradékot kapja.</span></div>}
            <div className="field"><label>Megjegyzés</label><textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} rows={2}/></div>
            <button className="btn" disabled={loading}>{loading ? "Mentés..." : "Költség mentése"}</button>
          </form>
        </div>

        <div className="card">
          <h2>Havi arány</h2>
          <form className="form" onSubmit={saveRatio}>
            <div className="field"><label>{p1?.name ?? "Személy 1"} aránya (%)</label><input value={ratioInput} onChange={e=>setRatioInput(e.target.value)} inputMode="decimal" placeholder="57" /></div>
            <div className="notice">Aktuális: {p1?.name}: {pctFromBps(monthRatio.person1RatioBps)} / {p2?.name}: {pctFromBps(monthRatio.person2RatioBps)}</div>
            <button className="btn secondary" disabled={loading}>Arány mentése</button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="toolbar"><div><h2>Költségek – {month}</h2><div className="muted">Kihagyott tételek: {huf(totals.excluded)}</div></div><button className="btn secondary" onClick={loadMonth}>Frissítés</button></div>
        <div className="table-wrap"><table><thead><tr><th>Dátum</th><th>Leírás</th><th>Összeg</th><th>HUF</th><th>Fizette</th><th>Split</th><th>Kategória</th><th></th></tr></thead><tbody>
          {expenses.map(e => <tr key={e.id}><td>{e.date.slice(0,10)}</td><td>{e.description}</td><td>{money(e.amountOriginalMinor,e.currency)}</td><td>{huf(e.amountHufMinor)}</td><td>{e.paidByPerson.name}</td><td><span className="badge">{splitLabels[e.splitType] ?? e.splitType}</span></td><td>{e.category?.name ?? "—"}</td><td><button className="btn danger" onClick={()=>removeExpense(e.id)}>Törlés</button></td></tr>)}
          {!expenses.length && <tr><td colSpan={8} className="muted">Nincs még költség ebben a hónapban.</td></tr>}
        </tbody></table></div>

        <div className="grid cards" style={{gridTemplateColumns:"repeat(2,minmax(0,1fr))", marginTop:16}}>
          <div className="card"><h3>{p1?.name} egyenlege</h3><div className={(settlement?.balance1 ?? 0) >= 0 ? "metric good" : "metric bad"}>{huf(settlement?.balance1 ?? 0)}</div></div>
          <div className="card"><h3>{p2?.name} egyenlege</h3><div className={(settlement?.balance2 ?? 0) >= 0 ? "metric good" : "metric bad"}>{huf(settlement?.balance2 ?? 0)}</div></div>
        </div>
      </div>
    </section>

    <p className="footer">Adatbázis: SQLite fájl a <code>/data/ratiosplit.db</code> útvonalon konténeren belül. Tailscale/LAN használatra tervezve.</p>
  </main>;
}
