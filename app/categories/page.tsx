"use client";

import { useEffect, useMemo, useState } from "react";

type Category = { id:string; name:string; icon?:string|null; color?:string|null; sortOrder:number; isActive:boolean };
const defaultDraft = { name:"", color:"#64748B", icon:"circle-dot", isActive:true };

export default function CategoriesPage() {
  const [categories,setCategories]=useState<Category[]>([]);
  const [editing,setEditing]=useState<Record<string,Category>>({});
  const [draft,setDraft]=useState(defaultDraft);
  const [message,setMessage]=useState("");
  const [showInactive,setShowInactive]=useState(false);

  async function loadCategories(){
    const r=await fetch("/api/categories");
    const d=await r.json();
    setCategories(d);
    const e:Record<string,Category>={};
    d.forEach((c:Category)=>e[c.id]=c);
    setEditing(e);
  }
  useEffect(()=>{loadCategories()},[]);
  const visible=useMemo(()=>categories.filter(c=>showInactive||c.isActive),[categories,showInactive]);

  async function addCategory(ev:React.FormEvent){
    ev.preventDefault(); setMessage("");
    const r=await fetch("/api/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)});
    const d=await r.json();
    if(!r.ok){setMessage(d.error||"Could not create category.");return}
    setDraft(defaultDraft); setMessage("Category added."); await loadCategories();
  }
  async function saveCategory(id:string){
    const r=await fetch(`/api/categories/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing[id])});
    const d=await r.json();
    if(!r.ok){setMessage(d.error||"Could not save category.");return}
    setMessage("Category saved."); await loadCategories();
  }
  async function hideCategory(id:string){
    if(!confirm("Hide this category? Existing expenses will keep it, but it will no longer be active."))return;
    const r=await fetch(`/api/categories/${id}`,{method:"DELETE"});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){setMessage(d.error||"Could not hide category.");return}
    setMessage("Category hidden."); await loadCategories();
  }

  return <main className="shell"><header className="header"><div className="logo"><div className="logo-mark"/><div><h1 className="h-title">Categories</h1><p className="h-sub">Manage RatioSplit expense categories</p></div></div><div className="action-row"><a className="btn secondary" href="/">Back to RatioSplit</a><button className="btn secondary" onClick={loadCategories}>Refresh</button></div></header>{message&&<div className="notice" style={{marginTop:14}}>{message}</div>}<section className="main-layout"><div className="left-column"><div className="card"><h2 className="panel-title">New category</h2><form className="form" onSubmit={addCategory}><div className="field"><label>Name</label><input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="e.g. Utilities"/></div><div className="row"><div className="field"><label>Color</label><input type="color" value={draft.color} onChange={e=>setDraft({...draft,color:e.target.value})}/></div><div className="field"><label>Icon name</label><input value={draft.icon} onChange={e=>setDraft({...draft,icon:e.target.value})}/></div></div><label><input type="checkbox" checked={draft.isActive} onChange={e=>setDraft({...draft,isActive:e.target.checked})}/> Active</label><button className="btn full">Add category</button></form></div><div className="card"><h2 className="panel-title">Notes</h2><p className="muted">Hiding a category does not delete old expense history. It only removes the category from active category lists.</p></div></div><div className="right-column"><div className="card"><div className="toolbar"><div><h2 className="panel-title">Categories</h2><div className="muted">{visible.length} shown of {categories.length}</div></div><label><input type="checkbox" checked={showInactive} onChange={e=>setShowInactive(e.target.checked)}/> Show hidden</label></div><div className="expense-list">{visible.map(c=>{const v=editing[c.id]??c;return <div className="expense-item" key={c.id} style={{borderLeftColor:v.color??"#64748B",cursor:"default"}}><div className="expense-item-header"><div><div className="expense-title">{c.name}</div><div className="expense-meta">{c.isActive?"Active":"Hidden"} - sort order {c.sortOrder}</div></div><span className={c.isActive?"badge locked":"badge open"}>{c.isActive?"Active":"Hidden"}</span></div><div className="form"><div className="row"><div className="field"><label>Name</label><input value={v.name} onChange={e=>setEditing({...editing,[c.id]:{...v,name:e.target.value}})}/></div><div className="field"><label>Color</label><input type="color" value={v.color??"#64748B"} onChange={e=>setEditing({...editing,[c.id]:{...v,color:e.target.value}})}/></div></div><div className="row"><div className="field"><label>Icon name</label><input value={v.icon??""} onChange={e=>setEditing({...editing,[c.id]:{...v,icon:e.target.value}})}/></div><div className="field"><label>Sort order</label><input inputMode="numeric" value={String(v.sortOrder??0)} onChange={e=>setEditing({...editing,[c.id]:{...v,sortOrder:Number(e.target.value)||0}})}/></div></div><label><input type="checkbox" checked={v.isActive} onChange={e=>setEditing({...editing,[c.id]:{...v,isActive:e.target.checked}})}/> Active</label><div className="edit-actions"><button className="btn full" onClick={()=>saveCategory(c.id)}>Save</button><button className="btn danger full" onClick={()=>hideCategory(c.id)}>Hide</button></div></div></div>})}{!visible.length&&<div className="muted">No categories to show.</div>}</div></div></div></section></main>
}
