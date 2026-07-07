$ErrorActionPreference = "Stop"
$pagePath = "app/categories/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/categories/page.tsx not found. Apply Patch 29/30 first." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# 1) Add orderedCategories helper if missing.
if ($content -notmatch 'function orderedCategories') {
  $content = $content -replace 'const defaultDraft = \{ name: "", color: "#64748B", icon: "circle-dot", isActive: true \};', 'const defaultDraft = { name: "", color: "#64748B", icon: "circle-dot", isActive: true };`n`nfunction orderedCategories(categories: Category[]) {`n  return [...categories].sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));`n}'
}

# 2) Ensure visible categories are sorted consistently.
$content = $content -replace 'return categories\.filter\(\(category\) => showInactive \|\| category\.isActive\);', 'return orderedCategories(categories.filter((category) => showInactive || category.isActive));'

# 3) Replace moveCategory implementation with normalized ordering.
$movePattern = 'async function moveCategory\(id: string, direction: "up" \| "down"\) \{[\s\S]*?\n  \}'
$moveReplacement = @'
async function normalizeOrder(nextVisibleOrder: Category[]) {
    await Promise.all(nextVisibleOrder.map((category, index) => {
      return patchCategory(category.id, { sortOrder: (index + 1) * 10 });
    }));
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
'@
if ($content -match $movePattern -and $content -notmatch 'normalizeCurrentOrder') {
  $content = [regex]::Replace($content, $movePattern, $moveReplacement, 1)
}

# 4) Remove sort order from the visible summary text.
$content = $content -replace '\{category\.isActive \? "Active" : "Hidden"\} - sort order \{category\.sortOrder\}', '{category.isActive ? "Active" : "Hidden"}'
$content = $content -replace '\{category\.isActive \? "Active" : "Hidden"\} · sort order \{category\.sortOrder\}', '{category.isActive ? "Active" : "Hidden"}'

# 5) Add a normalize card before Notes if missing.
if ($content -notmatch 'Normalize current order') {
  $notesNeedle = '<div className="card"><h2 className="panel-title">Notes</h2>'
  $normalizeCard = '<div className="card"><h2 className="panel-title">Ordering</h2><p className="muted">Use Up and Down to reorder categories. RatioSplit stores clean background order numbers automatically.</p><button className="btn secondary full" onClick={normalizeCurrentOrder}>Normalize current order</button></div>'
  $content = $content.Replace($notesNeedle, $normalizeCard + $notesNeedle)
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 32 category page tweaks applied."
