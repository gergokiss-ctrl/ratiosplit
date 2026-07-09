$ErrorActionPreference = "Stop"

# Append CSS
$cssPath = "app/styles.css"
$cssMarker = "/* Patch 48 - Category colors in review and expenses */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($cssMarker)) {
  Add-Content -Path $cssPath -Value @'


/* Patch 48 - Category colors in review and expenses */
.category-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
  flex: 0 0 auto;
  box-shadow: 0 0 0 2px rgba(255,255,255,.9), 0 0 0 3px rgba(15,23,42,.08);
}
.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #dbe7f3;
  background: #f8fbff;
  border-radius: 999px;
  padding: 3px 8px;
  color: var(--muted);
  font-size: 13px;
  max-width: 100%;
}
.category-pill .category-dot {
  width: 9px;
  height: 9px;
}

'@ -Encoding UTF8
  Write-Host "Patch 48 CSS appended."
} else {
  Write-Host "Patch 48 CSS already present."
}

$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# 1) Compute category summary with colors preserved instead of plain [name, amount] tuples.
$oldCategorySummary = 'const categorySummary=Object.entries(expenses.filter(e=>e.splitType!=="EXCLUDED").reduce((acc:Record<string,number>,e)=>{const k=e.category?.name??"No category";acc[k]=(acc[k]??0)+e.amountHufMinor;return acc},{})).sort((a,b)=>b[1]-a[1]);'
$newCategorySummary = 'const categorySummary=useMemo(()=>{const map:Record<string,{name:string;amount:number;color:string|null}>={};expenses.filter(e=>e.splitType!=="EXCLUDED").forEach(e=>{const name=e.category?.name??"No category";const key=e.category?.id??name;if(!map[key])map[key]={name,amount:0,color:e.category?.color??null};map[key].amount+=e.amountHufMinor});return Object.values(map).sort((a,b)=>b.amount-a.amount)},[expenses]);'
if ($content.Contains($oldCategorySummary)) {
  $content = $content.Replace($oldCategorySummary, $newCategorySummary)
  Write-Host "Category summary now preserves category colors."
} else {
  Write-Host "Category summary exact pattern not found; it may already be patched or formatted differently."
}

# 2) Review modal category rows: add color dot.
$oldReviewCategoryRows = '{categorySummary.map(([n,a])=><div className="summary-row" key={n}><span>{n}</span><strong>{huf(a as number)}</strong></div>)}'
$newReviewCategoryRows = '{categorySummary.map(c=><div className="summary-row" key={c.name}><span className="category-label"><span className="category-dot" style={{background:c.color??"#64748B"}}/> {c.name}</span><strong>{huf(c.amount)}</strong></div>)}'
if ($content.Contains($oldReviewCategoryRows)) {
  $content = $content.Replace($oldReviewCategoryRows, $newReviewCategoryRows)
  Write-Host "Review category rows now show color dots."
} else {
  Write-Host "Review category rows exact pattern not found; trying fallback."
  $fallback = 'categorySummary.map(([n,a])=><div className="summary-row" key={n}><span>{n}</span><strong>{huf(a as number)}</strong></div>)'
  if ($content.Contains($fallback)) {
    $content = $content.Replace($fallback, 'categorySummary.map(c=><div className="summary-row" key={c.name}><span className="category-label"><span className="category-dot" style={{background:c.color??"#64748B"}}/> {c.name}</span><strong>{huf(c.amount)}</strong></div>)')
    Write-Host "Review category rows patched using fallback."
  }
}

# 3) Expense mobile/card list: use category color as left border.
$oldExpenseCardDiv = '<div className="expense-item" key={e.id} onClick={()=>openEditExpense(e)}>'
$newExpenseCardDiv = '<div className="expense-item" key={e.id} style={{borderLeftColor:e.category?.color??"var(--blue-700)"}} onClick={()=>openEditExpense(e)}>'
if ($content.Contains($oldExpenseCardDiv)) {
  $content = $content.Replace($oldExpenseCardDiv, $newExpenseCardDiv)
  Write-Host "Expense cards now use category color as left border."
} else {
  Write-Host "Expense card div exact pattern not found or already patched."
}

# 4) Expense mobile/card list: replace plain category text with colored category pill.
$oldExpenseCardCategory = '<span className="expense-meta">{e.category?.name??"No category"}</span>'
$newExpenseCardCategory = '<span className="category-pill"><span className="category-dot" style={{background:e.category?.color??"#64748B"}}/> {e.category?.name??"No category"}</span>'
if ($content.Contains($oldExpenseCardCategory)) {
  $content = $content.Replace($oldExpenseCardCategory, $newExpenseCardCategory)
  Write-Host "Expense card category text replaced with category pill."
} else {
  Write-Host "Expense card category text exact pattern not found or already patched."
}

# 5) Desktop recent expenses table: color category cell.
$oldTableCategory = '<td>{e.category?.name??"-"}</td>'
$newTableCategory = '<td>{e.category?<span className="category-label"><span className="category-dot" style={{background:e.category.color??"#64748B"}}/> {e.category.name}</span>:"-"}</td>'
if ($content.Contains($oldTableCategory)) {
  $content = $content.Replace($oldTableCategory, $newTableCategory)
  Write-Host "Desktop expense table category cell now shows color dot."
} else {
  Write-Host "Desktop table category exact pattern not found or already patched."
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 48 page tweaks applied."
