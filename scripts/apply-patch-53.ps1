$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Patch 53: robustly fix the Patch 49 incomeSections JSX issue.
# Works with either:
#   ;const monthControls=
# or:
#   ;\nconst monthControls=
# or any whitespace between the semicolon and the next const.

$plainStart = 'const incomeSections=<div className="source-help"'
$fragmentStart = 'const incomeSections=<><div className="source-help"'
$nextMarker = 'const monthControls='

$hasPlainStart = $content.IndexOf($plainStart) -ge 0
$hasFragmentStart = $content.IndexOf($fragmentStart) -ge 0

if (-not $hasPlainStart -and -not $hasFragmentStart) {
  throw "Could not find incomeSections source-help start marker. Please inspect app/page.tsx around const incomeSections."
}

if ($hasPlainStart) {
  $start = $content.IndexOf($plainStart)
  $content = $content.Remove($start, $plainStart.Length).Insert($start, $fragmentStart)
  Write-Host "Inserted JSX fragment start after incomeSections=."
} else {
  $start = $content.IndexOf($fragmentStart)
  Write-Host "JSX fragment start already present."
}

$next = $content.IndexOf($nextMarker, $start)
if ($next -lt 0) {
  throw "Could not find const monthControls= after incomeSections. Please inspect app/page.tsx around const incomeSections."
}

# Find the semicolon that terminates the incomeSections assignment immediately before monthControls.
$semi = $content.LastIndexOf(';', $next)
if ($semi -lt $start) {
  throw "Could not find the semicolon ending incomeSections before const monthControls=."
}

# If the fragment close is already right before the semicolon, do nothing.
$beforeSemiStart = [Math]::Max(0, $semi - 4)
$beforeSemi = $content.Substring($beforeSemiStart, $semi - $beforeSemiStart)
if ($beforeSemi -match '</>$') {
  Write-Host "JSX fragment close already present before incomeSections semicolon."
} else {
  $content = $content.Insert($semi, '</>')
  Write-Host "Inserted JSX fragment close before incomeSections semicolon."
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 53 applied: incomeSections JSX is now wrapped safely."
