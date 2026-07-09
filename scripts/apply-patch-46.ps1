$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Patch 46: Add Review settlement transparency.
# This is intentionally UI-only: it uses the existing /api/settlement payload already loaded into `settlement`.

if ($content -match 'Settlement breakdown') {
  Write-Host "Settlement breakdown already present. No change needed."
  Set-Content $pagePath $content -Encoding UTF8
  exit 0
}

$needle = '<div className="review-grid"><div className="summary-card"><h3>Income summary</h3>'
$insert = @'
<div className="review-grid">{settlement&&p1&&p2&&<div className="summary-card"><h3>Settlement breakdown</h3><div className="summary-row"><span></span><strong>Paid / Owed / Balance</strong></div><div className="summary-row"><span>{p1.name}</span><strong>{huf(settlement.paid1)} / {huf(settlement.owed1)} / {huf(settlement.balance1)}</strong></div><div className="summary-row"><span>{p2.name}</span><strong>{huf(settlement.paid2)} / {huf(settlement.owed2)} / {huf(settlement.balance2)}</strong></div><div className="summary-row"><span>Final transfer</span><strong>{resultText}</strong></div><div className="muted" style={{marginTop:8}}>Paid is what each person actually paid. Owed is the amount each person should carry based on split rules and the current ratio. Balance is paid minus owed.</div></div>}<div className="summary-card"><h3>Income summary</h3>
'@

if ($content.Contains($needle)) {
  $content = $content.Replace($needle, $insert)
  Write-Host "Inserted Settlement breakdown card into Review."
} else {
  Write-Host "Review grid insertion point was not found. Trying fallback insertion near Review heading."
  $fallbackNeedle = '<div className="review-grid">'
  if ($content.Contains($fallbackNeedle)) {
    $fallbackInsert = '<div className="review-grid">{settlement&&p1&&p2&&<div className="summary-card"><h3>Settlement breakdown</h3><div className="summary-row"><span></span><strong>Paid / Owed / Balance</strong></div><div className="summary-row"><span>{p1.name}</span><strong>{huf(settlement.paid1)} / {huf(settlement.owed1)} / {huf(settlement.balance1)}</strong></div><div className="summary-row"><span>{p2.name}</span><strong>{huf(settlement.paid2)} / {huf(settlement.owed2)} / {huf(settlement.balance2)}</strong></div><div className="summary-row"><span>Final transfer</span><strong>{resultText}</strong></div><div className="muted" style={{marginTop:8}}>Paid is what each person actually paid. Owed is what each person should carry based on split rules and current ratio. Balance is paid minus owed.</div></div>}'
    $content = $content.Replace($fallbackNeedle, $fallbackInsert)
    Write-Host "Inserted Settlement breakdown card using fallback."
  } else {
    throw "Could not find Review grid in app/page.tsx."
  }
}

# Add a calculation note under the final settlement box where possible.
if ($content -notmatch 'Calculation note') {
  $settlementNeedle = '<div className="muted" style={{marginTop:6}}>Tracked expenses: {huf(totals.total)} - Excluded: {huf(totals.excluded)}</div>'
  $settlementReplacement = '<div className="muted" style={{marginTop:6}}>Tracked expenses: {huf(totals.total)} - Excluded: {huf(totals.excluded)}</div><div className="muted" style={{marginTop:6}}><strong>Calculation note:</strong> Settlement is based on tracked expenses only. Excluded expenses are ignored. The monthly ratio comes from included incomes unless manual ratio override is enabled.</div>'
  if ($content.Contains($settlementNeedle)) {
    $content = $content.Replace($settlementNeedle, $settlementReplacement)
    Write-Host "Added Review calculation note."
  } else {
    Write-Host "Settlement note insertion point not found; skipped calculation note."
  }
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 46 page tweaks applied."
