$ErrorActionPreference = "Stop"

$pagePath = "app/page.tsx"
if (!(Test-Path -LiteralPath $pagePath)) { throw "app/page.tsx not found." }
if (!(Test-Path -LiteralPath "components/ui/CategoryVisuals.tsx")) { throw "components/ui/CategoryVisuals.tsx not found." }
if (!(Test-Path -LiteralPath "components/ui/HelpToggle.tsx")) { throw "components/ui/HelpToggle.tsx not found." }

$content = Get-Content -LiteralPath $pagePath -Raw -Encoding UTF8
$backupPath = "$pagePath.patch57.bak"
if (!(Test-Path -LiteralPath $backupPath)) {
  Copy-Item -LiteralPath $pagePath -Destination $backupPath
  Write-Host "Created page backup: $backupPath"
}

# Add imports using a literal here-string. PowerShell does not use backslash to escape quotes.
if ($content -notmatch 'components/ui/CategoryVisuals') {
  $reactImport = [regex]::Match($content, 'import\s+\{[^;]+\}\s+from\s+"react";')
  if (!$reactImport.Success) { throw "Could not find the React import in app/page.tsx." }

  $imports = @'

import { CategoryLabel } from "@/components/ui/CategoryVisuals";
import { HelpToggle } from "@/components/ui/HelpToggle";
'@

  $content = $content.Insert($reactImport.Index + $reactImport.Length, $imports)
  Write-Host "Added reusable UI component imports."
} else {
  Write-Host "Reusable UI imports already present."
}

# Replace category visuals introduced by Patch 48.
$content = $content.Replace(
  '<span className="category-label"><span className="category-dot" style={{background:c.color??"#64748B"}}/> {c.name}</span>',
  '<CategoryLabel color={c.color}>{c.name}</CategoryLabel>'
)
$content = $content.Replace(
  '<span className="category-pill"><span className="category-dot" style={{background:e.category?.color??"#64748B"}}/> {e.category?.name??"No category"}</span>',
  '<CategoryLabel color={e.category?.color} pill>{e.category?.name??"No category"}</CategoryLabel>'
)
$content = $content.Replace(
  '<span className="category-label"><span className="category-dot" style={{background:e.category.color??"#64748B"}}/> {e.category.name}</span>',
  '<CategoryLabel color={e.category.color}>{e.category.name}</CategoryLabel>'
)

# Replace Review help-note blocks introduced by Patch 47.
$help1 = @'
<div className="help-line"><span className="muted">Need help with these numbers?</span><button type="button" className="help-chip" onClick={()=>setShowReviewNotes(!showReviewNotes)} aria-label="Show settlement explanation">?</button></div>{showReviewNotes&&<div className="help-note">Paid is what each person actually paid. Owed is the amount each person should carry based on split rules and the current ratio. Balance is paid minus owed.</div>}
'@
$help1Replacement = @'
<HelpToggle label="Need help with these numbers?" open={showReviewNotes} onToggle={()=>setShowReviewNotes(!showReviewNotes)}>Paid is what each person actually paid. Owed is the amount each person should carry based on split rules and the current ratio. Balance is paid minus owed.</HelpToggle>
'@
$content = $content.Replace($help1.Trim(), $help1Replacement.Trim())

$help2 = @'
<div className="help-line"><span className="muted"><strong>Calculation note</strong></span><button type="button" className="help-chip" onClick={()=>setShowReviewNotes(!showReviewNotes)} aria-label="Show calculation note">?</button></div>{showReviewNotes&&<div className="help-note">Settlement is based on tracked expenses only. Excluded expenses are ignored. The monthly ratio comes from included incomes unless manual ratio override is enabled.</div>}
'@
$help2Replacement = @'
<HelpToggle label="Calculation note" strongLabel open={showReviewNotes} onToggle={()=>setShowReviewNotes(!showReviewNotes)}>Settlement is based on tracked expenses only. Excluded expenses are ignored. The monthly ratio comes from included incomes unless manual ratio override is enabled.</HelpToggle>
'@
$content = $content.Replace($help2.Trim(), $help2Replacement.Trim())

Set-Content -LiteralPath $pagePath -Value $content -Encoding UTF8

# Consistency checks. These fail safely if the current page differs from the expected stable state.
$check = Get-Content -LiteralPath $pagePath -Raw -Encoding UTF8
if ($check -notmatch 'import \{ CategoryLabel \}') { throw "Consistency check failed: CategoryLabel import missing." }
if ($check -notmatch 'import \{ HelpToggle \}') { throw "Consistency check failed: HelpToggle import missing." }
if ($check -notmatch '<CategoryLabel') { throw "Consistency check failed: no CategoryLabel usage found." }
if ($check -notmatch '<HelpToggle') { throw "Consistency check failed: no HelpToggle usage found." }

Write-Host "Patch 57 fixed applied successfully."
Write-Host "Next: run npm run build before committing."
