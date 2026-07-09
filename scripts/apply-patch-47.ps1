$ErrorActionPreference = "Stop"

# Append CSS
$cssPath = "app/styles.css"
$cssMarker = "/* Patch 47 - Compact help notes */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($cssMarker)) {
  Add-Content -Path $cssPath -Value @'


/* Patch 47 - Compact help notes */
.help-chip {
  border: 1px solid var(--blue-700);
  background: #fff;
  color: var(--blue-700);
  border-radius: 999px;
  width: 28px;
  height: 28px;
  min-width: 28px;
  min-height: 28px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 850;
  cursor: pointer;
  line-height: 1;
}
.help-chip:hover {
  background: #eef6ff;
}
.help-note {
  border: 1px solid #dbe7f3;
  background: #f8fbff;
  color: var(--muted);
  border-radius: 8px;
  padding: 10px 12px;
  margin-top: 10px;
  line-height: 1.45;
}
.help-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}
.help-line .muted {
  margin: 0;
}

'@ -Encoding UTF8
  Write-Host "Patch 47 CSS appended."
} else {
  Write-Host "Patch 47 CSS already present."
}

$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Add a Review help-note toggle state.
if ($content -notmatch 'showReviewNotes') {
  $content = $content.Replace('[showReview,setShowReview]=useState(false)', '[showReview,setShowReview]=useState(false),[showReviewNotes,setShowReviewNotes]=useState(false)')
  Write-Host "Added showReviewNotes state."
} else {
  Write-Host "showReviewNotes state already present."
}

# Replace the Settlement breakdown explanatory muted paragraph with a compact ? toggle.
$oldBreakdownNote = '<div className="muted" style={{marginTop:8}}>Paid is what each person actually paid. Owed is the amount each person should carry based on split rules and the current ratio. Balance is paid minus owed.</div>'
$newBreakdownNote = '<div className="help-line"><span className="muted">Need help with these numbers?</span><button type="button" className="help-chip" onClick={()=>setShowReviewNotes(!showReviewNotes)} aria-label="Show settlement explanation">?</button></div>{showReviewNotes&&<div className="help-note">Paid is what each person actually paid. Owed is the amount each person should carry based on split rules and the current ratio. Balance is paid minus owed.</div>}'
if ($content.Contains($oldBreakdownNote)) {
  $content = $content.Replace($oldBreakdownNote, $newBreakdownNote)
  Write-Host "Replaced Settlement breakdown note with compact help toggle."
} else {
  Write-Host "Exact Settlement breakdown note pattern not found; trying fallback."
  $fallback = 'Paid is what each person actually paid. Owed is what each person should carry based on split rules and current ratio. Balance is paid minus owed.'
  if ($content.Contains($fallback)) {
    $content = $content.Replace('<div className="muted" style={{marginTop:8}}>' + $fallback + '</div>', $newBreakdownNote)
    Write-Host "Fallback Settlement breakdown note replaced."
  }
}

# Replace the Calculation note in final settlement with a compact ? toggle.
$oldCalcNote = '<div className="muted" style={{marginTop:6}}><strong>Calculation note:</strong> Settlement is based on tracked expenses only. Excluded expenses are ignored. The monthly ratio comes from included incomes unless manual ratio override is enabled.</div>'
$newCalcNote = '<div className="help-line"><span className="muted"><strong>Calculation note</strong></span><button type="button" className="help-chip" onClick={()=>setShowReviewNotes(!showReviewNotes)} aria-label="Show calculation note">?</button></div>{showReviewNotes&&<div className="help-note">Settlement is based on tracked expenses only. Excluded expenses are ignored. The monthly ratio comes from included incomes unless manual ratio override is enabled.</div>}'
if ($content.Contains($oldCalcNote)) {
  $content = $content.Replace($oldCalcNote, $newCalcNote)
  Write-Host "Replaced final settlement calculation note with compact help toggle."
} else {
  Write-Host "Final settlement calculation note pattern not found; it may already be compact or not present."
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 47 page tweaks applied."
