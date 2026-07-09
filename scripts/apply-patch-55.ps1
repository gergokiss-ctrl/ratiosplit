$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Patch 55: robustly remove only the broken Patch 49 source-help JSX block.
# The repeated build/script failures come from this shape:
#   const incomeSections=<><div className="source-help">...</div><div className="income-grid">...</div>...
# or:
#   const incomeSections=<div className="source-help">...</div><div className="income-grid">...</div>...
# Instead of trying to wrap the two JSX siblings, we remove only the source-help block
# and restore incomeSections to start directly with the known-good income-grid block.
# This keeps the rest of the income source functionality unchanged.

$starts = @(
  'const incomeSections=<><div className="source-help"',
  'const incomeSections=<div className="source-help"'
)

$start = -1
$usedStart = $null
foreach ($candidate in $starts) {
  $idx = $content.IndexOf($candidate)
  if ($idx -ge 0) {
    $start = $idx
    $usedStart = $candidate
    break
  }
}

if ($start -lt 0) {
  Write-Host "Broken source-help block was not found. No change needed."
  Set-Content $pagePath $content -Encoding UTF8
  exit 0
}

$gridMarker = '<div className="income-grid"'
$grid = $content.IndexOf($gridMarker, $start)
if ($grid -lt 0) {
  throw "Found source-help start, but could not find the following income-grid block. Please inspect app/page.tsx around const incomeSections."
}

$replacementStart = 'const incomeSections=<div className="income-grid"'
$endOfGridMarker = $grid + $gridMarker.Length

# Replace everything from const incomeSections up to the income-grid marker with a clean incomeSections assignment.
$content = $content.Remove($start, $endOfGridMarker - $start).Insert($start, $replacementStart)
Write-Host "Removed broken source-help block and restored incomeSections to start with income-grid."

# Clean up any leftover JSX fragment close that earlier failed patches may have inserted before a semicolon.
$content = $content.Replace('</>;const monthControls=', ';const monthControls=')
$content = $content.Replace('</> ;const monthControls=', ';const monthControls=')
$content = $content.Replace('</>`r`n;const monthControls=', ';const monthControls=')
$content = $content.Replace('</>`n;const monthControls=', ';const monthControls=')

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 55 applied. Build should no longer fail on incomeSections/source-help JSX."
