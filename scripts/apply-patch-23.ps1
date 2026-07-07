
$ErrorActionPreference = "Stop"

$cssPath = "app/styles.css"
$marker = "/* Patch 23 - checkbox and income edit refinements */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($marker)) {
  Add-Content -Path $cssPath -Value @'


/* Patch 23 - checkbox and income edit refinements */
input[type="checkbox"] {
  width: 20px !important;
  min-width: 20px !important;
  height: 20px !important;
  min-height: 20px !important;
  accent-color: var(--blue-700);
  flex: 0 0 auto;
}
.drawer label:has(input[type="checkbox"]),
.income-source-row label,
.income-row label {
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: none;
  letter-spacing: 0;
  font-size: 14px;
  color: var(--text);
}

'@ -Encoding UTF8
  Write-Host "Patch 23 CSS appended."
} else {
  Write-Host "Patch 23 CSS already present."
}

$pagePath = "app/page.tsx"
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Add Remove from month for recurring rows too, if the current modal only shows Archive source for recurring.
$old = '{editingIncome.incomeSource.isOneTime?<button className="btn danger full" disabled={isLocked} onClick={removeIncomeEdit}>Remove from month</button>:<button className="btn danger full" disabled={isLocked} onClick={()=>archiveIncomeSource(editingIncome.incomeSourceId)}>Archive source</button>}'
$new = '<button className="btn danger full" disabled={isLocked} onClick={removeIncomeEdit}>Remove from month</button>{!editingIncome.incomeSource.isOneTime&&<button className="btn danger full" disabled={isLocked} onClick={()=>archiveIncomeSource(editingIncome.incomeSourceId)}>Archive source</button>}'
if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  Write-Host "Patch 23 income modal buttons updated."
} else {
  Write-Host "Patch 23 income modal button pattern was not found; skipping button update."
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 23 page tweaks applied."
