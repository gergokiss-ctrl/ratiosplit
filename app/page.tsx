"use client";

import { useEffect, useMemo, useState } from "react";

type Person = { id: string; name: string; displayOrder: number };
type Category = { id: string; name: string; color?: string | null };
type Expense = { id:string; date:string; description:string; amountOriginalMinor:number; currency:string; exchangeRateToHufMicros:number; amountHufMinor:number; paidByPersonId:string; splitType:string; categoryId?:string|null; paidByPerson:Person; category?:Category|null; customSplits?: { personId:string; ratioBps:number|null }[] };
type Settlement = { paid1:number; paid2:number; owed1:number; owed2:number; balance1:number; balance2:number; settlementDirection:string; settlementAmount:number };

const splitLabels: Record<string,string> = { MONTHLY_RATIO:"Monthly ratio", EQUAL:"50/50", PERSON_1_ONLY:"Gergő only", PERSON_2_ONLY:"Judit only", CUSTOM_PERCENT:"Custom %", EXCLUDED:"Excluded" };
const currencies = ["HUF", "EUR"];

function currentMonthKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function toDateInput(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function huf(minor:number) { return new Intl.NumberFormat("en-US", { style:"currency", currency:"HUF", maximumFractionDigits:0 }).format(minor/100); }
function money(minor:number, currency:string) { return new Intl.NumberFormat("en-US", { style:"currency", currency, maximumFractionDigits:2 }).format(minor/100); }
function pctFromBps(bps?:number|null) { return bps == null ? "not set" : `${(bps/100).toLocaleString("en-US", { maximumFractionDigits:2 })}%`; }
function addMonths(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

export default function Home() {
  const [people,setPeople] = useState<Person[]>([]);
  const [categories,setCategories] = useState<Category[]>([]);
  const [expenses,setExpenses] = useState<Expense[]>([]);
  const [settlement,setSettlement] = useState<Settlement|null>(null);
  const [month,setMonth] = useState(currentMonthKey());
  const [monthRatio,setMonthRatio] = useState<{person1RatioBps:number|null; person2RatioBps:number|null}>({person1RatioBps:null, person2RatioBps:null});
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");
  const [showExpenseForm,setShowExpenseForm] = useState(false);
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
      fetch(`/api/expenses?monthKey=${month}`), fetch(`/api/settlement/${month}`), fetch(`/api/months/${month}`)
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
  const visibleExpenses = expenses.slice(0, 5);

  async function createExpense(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/expenses", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Save error");
      setForm(f => ({...f, description:"", amount:"", note:""})); setMonth(data.monthKey); await loadMonth(); setMessage("Expense saved."); setShowExpenseForm(false);
    } catch(err:any) { setMessage(err.message); } finally { setLoading(false); }
  }
  async function saveRatio(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    try {
      const res = await fetch(`/api/months/${month}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ person1Percent: ratioInput }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Save error");
      await loadMonth(); setMessage("Monthly ratio saved.");
    } catch(err:any) { setMessage(err.message); } finally { setLoading(false); }
  }
  async function removeExpense(id:string) {
    if (!confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method:"DELETE" }); if (res.ok) await loadMonth();
  }
  const resultText = useMemo(() => {
    if (!settlement || !p1 || !p2) return "Set a monthly ratio and add expenses.";
    if (settlement.settlementDirection === "NONE") return "Nothing to settle.";
    if (settlement.settlementDirection === "PERSON_2_TO_PERSON_1") return `${p2.name} should pay ${p1.name}: ${huf(settlement.settlementAmount)}`;
    return `${p1.name} should pay ${p2.name}: ${huf(settlement.settlementAmount)}`;
  }, [settlement,p1,p2]);

  const expenseForm = <form className="form" onSubmit={createExpense}>
    <div className="row"><div className="field"><label>Date</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></div><div className="field"><label>Paid by</label><select value={form.paidByPersonId} onChange={e=>setForm({...form,paidByPersonId:e.target.value})}>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
    <div className="field"><label>Description</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="e.g. groceries, fuel, utilities"/></div>
    <div className="row"><div className="field"><label>Amount</label><input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} inputMode="decimal" placeholder="18450"/></div><div className="field"><label>Currency</label><select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value,exchangeRate:e.target.value==="HUF"?"1":form.exchangeRate})}>{currencies.map(c=><option key={c} value={c}>{c}</option>)}</select></div></div>
    <div className="row"><div className="field"><label>Exchange rate to HUF</label><input value={form.exchangeRate} onChange={e=>setForm({...form,exchangeRate:e.target.value})} inputMode="decimal" disabled={form.currency==="HUF"}/></div><div className="field"><label>Category</label><select value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}><option value="">None</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
    <div className="field"><label>Split type</label><select value={form.splitType} onChange={e=>setForm({...form,splitType:e.target.value})}>{Object.entries(splitLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
    {form.splitType === "CUSTOM_PERCENT" && <div className="field"><label>{p1?.name ?? "Person 1"} custom percentage</label><input value={form.customPerson1Percent} onChange={e=>setForm({...form,customPerson1Percent:e.target.value})} inputMode="decimal"/><span className="muted">The other person automatically gets the remaining share.</span></div>}
    <div className="field"><label>Note</label><textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} rows={2}/></div>
    <button className="btn full" disabled={loading}>{loading ? "Saving..." : "Save expense"}</button>
  </form>;

  return <main className="shell">
    <header className="header">
      <div className="logo"><div className="logo-mark"/><div><h1 className="h-title">RatioSplit</h1><p className="h-sub">Monthly ratio-based shared expense tracker</p></div></div>
      <div className="month-controls">
        <button className="btn secondary month-nav-btn" onClick={()=>setMonth(addMonths(month, -1))} aria-label="Previous month">‹</button>
        <div className="field"><label>Month</label><input value={month} onChange={e=>setMonth(e.target.value)} placeholder="2026-07" /></div>
        <button className="btn secondary month-nav-btn" onClick={()=>setMonth(addMonths(month, 1))} aria-label="Next month">›</button>
        <a className="btn secondary" href={`/api/export/${month}`}>Export CSV</a>
      </div>
    </header>
    {message && <div className="notice" style={{marginBottom:16}}>{message}</div>}
    <section className="grid cards">
      <div className="card metric-card accent-green"><div className="metric-label">Tracked expenses</div><div className="metric">{huf(totals.total)}</div><div className="muted">{totals.count} items</div></div>
      <div className="card metric-card"><div className="metric-label">{p1?.name ?? "Person 1"} paid</div><div className="metric">{huf(settlement?.paid1 ?? 0)}</div><div className="muted">Share: {huf(settlement?.owed1 ?? 0)}</div></div>
      <div className="card metric-card"><div className="metric-label">{p2?.name ?? "Person 2"} paid</div><div className="metric">{huf(settlement?.paid2 ?? 0)}</div><div className="muted">Share: {huf(settlement?.owed2 ?? 0)}</div></div>
      <div className="card metric-card accent-orange"><div className="metric-label">Settlement</div><div className="metric good">{settlement ? huf(settlement.settlementAmount) : "—"}</div><div className="muted">{resultText}</div></div>
    </section>
    <section className="layout">
      <div className="grid">
        <button className="btn fab full" onClick={()=>setShowExpenseForm(true)}>+ Add expense</button>
        <div className="card"><h2 className="panel-title">Monthly ratio</h2><form className="form" onSubmit={saveRatio}>
          <div className="field"><label>{p1?.name ?? "Person 1"} share (%)</label><input value={ratioInput} onChange={e=>setRatioInput(e.target.value)} inputMode="decimal" placeholder="57" /></div>
          <div className="notice">Current: {p1?.name}: {pctFromBps(monthRatio.person1RatioBps)} / {p2?.name}: {pctFromBps(monthRatio.person2RatioBps)}</div>
          <button className="btn secondary full" disabled={loading}>Save ratio</button>
        </form></div>
      </div>
      <div className="card"><div className="toolbar"><div><h2 className="panel-title">Recent expenses – {month}</h2><div className="muted">Showing latest {visibleExpenses.length} of {expenses.length}. Excluded items: {huf(totals.excluded)}</div></div><button className="btn secondary" onClick={loadMonth}>Refresh</button></div>
        <div className="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>HUF</th><th>Paid by</th><th>Split</th><th>Category</th><th></th></tr></thead><tbody>
          {visibleExpenses.map(e => <tr key={e.id}><td>{e.date.slice(0,10)}</td><td>{e.description}</td><td>{money(e.amountOriginalMinor,e.currency)}</td><td>{huf(e.amountHufMinor)}</td><td>{e.paidByPerson.name}</td><td><span className="badge">{splitLabels[e.splitType] ?? e.splitType}</span></td><td>{e.category?.name ?? "—"}</td><td><button className="btn danger" onClick={()=>removeExpense(e.id)}>Delete</button></td></tr>)}
          {!visibleExpenses.length && <tr><td colSpan={8} className="muted">No expenses recorded for this month yet.</td></tr>}
        </tbody></table></div>
        <div className="expense-list-mobile">
          {visibleExpenses.map(e => <div className="expense-item" key={e.id}><div className="expense-item-header"><div><div className="expense-title">{e.description}</div><div className="expense-meta">{e.date.slice(0,10)} · paid by {e.paidByPerson.name}</div></div><strong>{huf(e.amountHufMinor)}</strong></div><div><span className="badge">{splitLabels[e.splitType] ?? e.splitType}</span> <span className="expense-meta">{e.category?.name ?? "No category"}</span></div><button className="btn danger" onClick={()=>removeExpense(e.id)}>Delete</button></div>)}
          {!visibleExpenses.length && <div className="muted">No expenses recorded for this month yet.</div>}
        </div>
        <div className="grid cards" style={{gridTemplateColumns:"repeat(2,minmax(0,1fr))", marginTop:16}}>
          <div className="card metric-card accent-green"><h3>{p1?.name} balance</h3><div className={(settlement?.balance1 ?? 0) >= 0 ? "metric good" : "metric bad"}>{huf(settlement?.balance1 ?? 0)}</div></div>
          <div className="card metric-card accent-orange"><h3>{p2?.name} balance</h3><div className={(settlement?.balance2 ?? 0) >= 0 ? "metric good" : "metric bad"}>{huf(settlement?.balance2 ?? 0)}</div></div>
        </div>
      </div>
    </section>
    {showExpenseForm && <div className="drawer-backdrop" onClick={()=>setShowExpenseForm(false)}><section className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><h2 className="panel-title">New expense</h2><button className="btn secondary" onClick={()=>setShowExpenseForm(false)}>Close</button></div>{expenseForm}</section></div>}
    <p className="footer">Database: SQLite file at <code>/data/ratiosplit.db</code> inside the container. Designed for Tailscale/LAN use.</p>
  </main>;
}
