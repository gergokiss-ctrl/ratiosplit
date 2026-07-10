$ErrorActionPreference = "Stop"

$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
if (!(Test-Path "components/ui/CategoryVisuals.tsx")) { throw "CategoryVisuals.tsx was not copied into the repository." }
if (!(Test-Path "components/ui/HelpToggle.tsx")) { throw "HelpToggle.tsx was not copied into the repository." }

$content = Get-Content $pagePath -Raw -Encoding UTF8
$backupPath = "$pagePath.patch57.bak"
if (!(Test-Path $backupPath)) {
  Copy-Item $pagePath $backupPath
  Write-Host "Created page backup: $backupPath"
}

# Add imports after the existing React import. Using independent one-line imports makes the change easy to audit.
if ($content -notmatch 'components/ui/CategoryVisuals') {
  $reactImport = [regex]::Match($content, 'import\s+\{[^;]+\}\s+from\s+"react";')
  if (!$reactImport.Success) { throw "Could not find the React import in app/page.tsx." }
  $imports = "`nimport { CategoryLabel } from \"@/components/ui/CategoryVisuals\";`nimport { HelpToggle } from \"@/components/ui/HelpToggle\";"
  $content = $content.Insert($reactImport.Index + $reactImport.Length, $imports)
  Write-Host "Added reusable UI component imports."
}

# Replace category visuals introduced in Patch 48.
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

# Replace the two Review help-note blocks introduced in Patch 47.
$help1 = '<div className="help-line"><span className="muted">Need help with these numbers?</span><button type="button" className="help-chip" onClick={()=>setShowReviewNotes(!showReviewNotes)} aria-label="Show settlement explanation">?</button></div>{showReviewNotes&&<div className="help-note">Paid is what each person actually paid. Owed is the amount each person should carry based on split rules and the current ratio. Balance is paid minus owed.</div>}'
$help1Replacement = '<HelpToggle label="Need help with these numbers?" open={showReviewNotes} onToggle={()=>setShowReviewNotes(!showReviewNotes)}>Paid is what each person actually paid. Owed is the amount each person should carry based on split rules and the current ratio. Balance is paid minus owed.</HelpToggle>'
$content = $content.Replace($help1, $help1Replacement)

$help2 = '<div className="help-line"><span className="muted"><strong>Calculation note</strong></span><button type="button" className="help-chip" onClick={()=>setShowReviewNotes(!showReviewNotes)} aria-label="Show calculation note">?</button></div>{showReviewNotes&&<div className="help-note">Settlement is based on tracked expenses only. Excluded expenses are ignored. The monthly ratio comes from included incomes unless manual ratio override is enabled.</div>}'
$help2Replacement = '<HelpToggle label="Calculation note" strongLabel open={showReviewNotes} onToggle={()=>setShowReviewNotes(!showReviewNotes)}>Settlement is based on tracked expenses only. Excluded expenses are ignored. The monthly ratio comes from included incomes unless manual ratio override is enabled.</HelpToggle>'
$content = $content.Replace($help2, $help2Replacement)

Set-Content $pagePath $content -Encoding UTF8

# Static consistency guard: imported components must actually be used, avoiding a half-applied refactor.
$check = Get-Content $pagePath -Raw -Encoding UTF8
if ($check -notmatch 'import \{ CategoryLabel \}') { throw "Consistency check failed: CategoryLabel import missing." }
if ($check -notmatch 'import \{ HelpToggle \}') { throw "Consistency check failed: HelpToggle import missing." }
if ($check -notmatch '<CategoryLabel') { throw "Consistency check failed: no CategoryLabel usage found." }
if ($check -notmatch '<HelpToggle') { throw "Consistency check failed: no HelpToggle usage found." }

Write-Host "Patch 57 applied. Reusable category and help UI moved into components."
Write-Host "Run npm run build before committing."
