
"use client";

import { useEffect, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
};

const defaultDraft = { name: "", color: "#64748B", icon: "circle-dot", isActive: true };

function orderedCategories(categories: Category[]) {
  return [...categories].sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));
}

function loadBool(key: string, fallback: boolean) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === "1";
  } catch {
    return fallback;
  }
}

function saveBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {}
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Record<string, Category>>({});
  const [draft, setDraft] = useState(defaultDraft);
  const [message, setMessage] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [newOpen, setNewOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [orderingOpen, setOrderingOpen] = useState(true);
  const [deletionRulesOpen, setDeletionRulesOpen] = useState(true);
  const [advancedIds, setAdvancedIds] = useState<Record<string, boolean>>({});
  const [newAdvancedOpen, setNewAdvancedOpen] = useState(false);

  useEffect(() => {
    setNewOpen(loadBool("rs-category-new-open", false));
    setCategoriesOpen(loadBool("rs-category-categories-open", true));
    setOrderingOpen(loadBool("rs-category-ordering-open", true));
    setDeletionRulesOpen(loadBool("rs-category-deletion-rules-open", true));
  }, []);

  useEffect(() => saveBool("rs-category-new-open", newOpen), [newOpen]);
  useEffect(() => saveBool("rs-category-categories-open", categoriesOpen), [categoriesOpen]);
  useEffect(() => saveBool("rs-category-ordering-open", orderingOpen), [orderingOpen]);
  useEffect(() => saveBool("rs-category-deletion-rules-open", deletionRulesOpen), [deletionRulesOpen]);

  async function loadCategories() {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);

    const nextEditing: Record<string, Category> = {};
    data.forEach((category: Category) => {
      nextEditing[category.id] = category;
    });
    setEditing(nextEditing);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const visible = useMemo(() => {
    return orderedCategories(categories.filter((category) => showInactive || category.isActive));
  }, [categories, showInactive]);

  function toggleOpen(id: string) {
    setOpenIds((state) => ({ ...state, [id]: !state[id] }));
  }

  async function addCategory(ev: React.FormEvent) {
    ev.preventDefault();
    setMessage("");

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Could not create category.");
      return;
    }

    setDraft(defaultDraft);
    setNewOpen(false);
    setNewAdvancedOpen(false);
    setMessage("Category added.");
    await loadCategories();
  }

  async function saveCategory(id: string) {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing[id]),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Could not save category.");
      return;
    }

    setMessage("Category saved.");
    await loadCategories();
  }

  async function hideCategory(id: string) {
    if (!confirm("Hide this category from new expenses? Existing expenses will keep this category.")) return;

    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error || "Could not hide category.");
      return;
    }

    setMessage("Category hidden from new expenses.");
    await loadCategories();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Permanently delete this hidden category? This is only allowed if no active expense uses it.")) return;

    const res = await fetch(`/api/categories/${id}?hard=1`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMessage(data.error || "Could not delete category.");
      return;
    }

    setMessage("Category deleted.");
    await loadCategories();
  }

  async function patchCategory(id: string, data: Partial<Category>) {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const response = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(response.error || "Could not update category.");
  }

  async function normalizeOrder(nextVisibleOrder: Category[]) {
    await Promise.all(
      nextVisibleOrder.map((category, index) => {
        return patchCategory(category.id, { sortOrder: (index + 1) * 10 });
      })
    );
  }

  async function moveCategory(id: string, direction: "up" | "down") {
    setMessage("");
    const ordered = [...visible];
    const index = ordered.findIndex((category) => category.id === id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return;

    const nextOrder = [...ordered];
    const [removed] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIndex, 0, removed);

    try {
      await normalizeOrder(nextOrder);
      setMessage("Category order updated.");
      await loadCategories();
    } catch (error: any) {
      setMessage(error.message || "Could not reorder categories.");
    }
  }

  async function normalizeCurrentOrder() {
    setMessage("");
    try {
      await normalizeOrder(visible);
      setMessage("Category order normalized.");
      await loadCategories();
    } catch (error: any) {
      setMessage(error.message || "Could not normalize category order.");
    }
  }

  return (
    <main className="shell">
      <header className="header">
        <div className="logo">
          <div className="logo-mark" />
          <div>
            <h1 className="h-title">Categories</h1>
            <p className="h-sub">Manage RatioSplit expense categories</p>
          </div>
        </div>
        <div className="action-row">
          <a className="btn secondary" href="/">Back to RatioSplit</a>
          <button className="btn secondary" onClick={loadCategories}>Refresh</button>
        </div>
      </header>

      {message && <div className="notice" style={{ marginTop: 14 }}>{message}</div>}

      <section className="main-layout">
        <div className="left-column">
          <div className="card section-card">
            <button className="section-head" type="button" onClick={() => setNewOpen(!newOpen)}>
              <div>
                <div className="section-title">New category</div>
                <div className="section-summary">Create a new selectable expense category</div>
              </div>
              <span className="chevron">{newOpen ? "-" : "+"}</span>
            </button>

            {newOpen && (
              <div className="section-body">
                <form className="form" onSubmit={addCategory}>
                  <div className="field">
                    <label>Name</label>
                    <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Utilities" />
                  </div>

                  <label><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Available for new expenses</label>

                  <button type="button" className="btn secondary full" onClick={() => setNewAdvancedOpen(!newAdvancedOpen)}>
                    {newAdvancedOpen ? "Hide advanced options" : "Show advanced options"}
                  </button>

                  {newAdvancedOpen && (
                    <div className="row">
                      <div className="field">
                        <label>Color</label>
                        <input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
                      </div>
                      <div className="field">
                        <label>Icon name</label>
                        <input value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
                      </div>
                    </div>
                  )}

                  <button className="btn full">Add category</button>
                </form>
              </div>
            )}
          </div>

          <div className="card section-card">
            <button className="section-head" type="button" onClick={() => setOrderingOpen(!orderingOpen)}>
              <div>
                <div className="section-title">Ordering</div>
                <div className="section-summary">Use Up and Down; the app stores the technical order automatically</div>
              </div>
              <span className="chevron">{orderingOpen ? "-" : "+"}</span>
            </button>
            {orderingOpen && (
              <div className="section-body">
                <p className="muted">Use Up and Down to reorder categories. RatioSplit stores clean background order numbers automatically.</p>
                <button className="btn secondary full" onClick={normalizeCurrentOrder}>Normalize current order</button>
              </div>
            )}
          </div>

          <div className="card section-card">
            <button className="section-head" type="button" onClick={() => setDeletionRulesOpen(!deletionRulesOpen)}>
              <div>
                <div className="section-title">Deletion rules</div>
                <div className="section-summary">Hidden categories can be deleted only if they are not used by active expenses</div>
              </div>
              <span className="chevron">{deletionRulesOpen ? "-" : "+"}</span>
            </button>
            {deletionRulesOpen && (
              <div className="section-body">
                <p className="muted">Use Hide from new expenses for categories you no longer want to use.</p>
                <p className="muted">Permanent Delete appears only for hidden categories.</p>
                <p className="muted">A hidden category can be permanently deleted only if no active expense currently uses it. This protects expense history.</p>
              </div>
            )}
          </div>
        </div>

        <div className="right-column">
          <div className="card section-card">
            <button className="section-head" type="button" onClick={() => setCategoriesOpen(!categoriesOpen)}>
              <div>
                <div className="section-title">Categories</div>
                <div className="section-summary">{visible.length} shown of {categories.length}</div>
              </div>
              <span className="chevron">{categoriesOpen ? "-" : "+"}</span>
            </button>

            {categoriesOpen && (
              <div className="section-body">
                <div className="toolbar">
                  <div className="muted">Available categories can be selected for new expenses. Hidden categories stay on old expenses.</div>
                  <label><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show hidden</label>
                </div>

                <div className="expense-list">
                  {visible.map((category, index) => {
                    const value = editing[category.id] ?? category;
                    const isOpen = Boolean(openIds[category.id]);
                    const advancedOpen = Boolean(advancedIds[category.id]);

                    return (
                      <div className="expense-item" key={category.id} style={{ borderLeftColor: value.color ?? "#64748B", cursor: "default" }}>
                        <div className="expense-item-header">
                          <button type="button" onClick={() => toggleOpen(category.id)} style={{ border: 0, background: "transparent", textAlign: "left", padding: 0, flex: 1, cursor: "pointer" }}>
                            <div className="expense-title">{category.name}</div>
                            <div className="expense-meta">{category.isActive ? "Available" : "Hidden from new expenses"}</div>
                          </button>
                          <div className="action-row">
                            <button className="btn secondary small" disabled={index === 0} onClick={() => moveCategory(category.id, "up")}>Up</button>
                            <button className="btn secondary small" disabled={index === visible.length - 1} onClick={() => moveCategory(category.id, "down")}>Down</button>
                            <button className="btn secondary small" onClick={() => toggleOpen(category.id)}>{isOpen ? "Close" : "Edit"}</button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="form">
                            <div className="field">
                              <label>Name</label>
                              <input value={value.name} onChange={(e) => setEditing({ ...editing, [category.id]: { ...value, name: e.target.value } })} />
                            </div>

                            <label><input type="checkbox" checked={value.isActive} onChange={(e) => setEditing({ ...editing, [category.id]: { ...value, isActive: e.target.checked } })} /> Available for new expenses</label>

                            <button type="button" className="btn secondary full" onClick={() => setAdvancedIds({ ...advancedIds, [category.id]: !advancedOpen })}>
                              {advancedOpen ? "Hide advanced options" : "Show advanced options"}
                            </button>

                            {advancedOpen && (
                              <div className="row">
                                <div className="field">
                                  <label>Color</label>
                                  <input type="color" value={value.color ?? "#64748B"} onChange={(e) => setEditing({ ...editing, [category.id]: { ...value, color: e.target.value } })} />
                                </div>
                                <div className="field">
                                  <label>Icon name</label>
                                  <input value={value.icon ?? ""} onChange={(e) => setEditing({ ...editing, [category.id]: { ...value, icon: e.target.value } })} />
                                </div>
                              </div>
                            )}

                            <div className="edit-actions">
                              <button className="btn full" onClick={() => saveCategory(category.id)}>Save</button>
                              <button className="btn danger full" onClick={() => hideCategory(category.id)}>Hide from new expenses</button>
                            </div>

                            {!category.isActive && (
                              <div className="settlement-box" style={{ marginTop: 12 }}>
                                <div className="hero-label">Danger zone</div>
                                <p className="muted">Permanent deletion is only allowed if no active expense uses this hidden category.</p>
                                <button className="btn danger full" onClick={() => deleteCategory(category.id)}>Delete permanently</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {!visible.length && <div className="muted">No categories to show.</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
