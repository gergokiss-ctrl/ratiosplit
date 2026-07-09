$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }

$content = Get-Content $pagePath -Raw -Encoding UTF8

# Patch 52 fixes the Patch 49 JSX issue more robustly than Patch 51.
# Actual compact file structure is:
#   const incomeSections=<div className="source-help">...</div><div className="income-grid">...</div>;const monthControls=...
# The previous Patch 51 looked for ratioControls, but in this file the next declaration is monthControls.

if ($content -match 'const incomeSections=<><div className="source-help"') {
  Write-Host "incomeSections is already wrapped in a JSX fragment. No change needed."
  Set-Content $pagePath $content -Encoding UTF8
  exit 0
}

$startMarker = 'const incomeSections=<div className="source-help"'
$nextMarker = ';const monthControls='

$start = $content.IndexOf($startMarker)
if ($start -lt 0) {
  throw "Could not find Patch 49 incomeSections source-help start marker. Please inspect app/page.tsx around const incomeSections."
}

$next = $content.IndexOf($nextMarker, $start)
if ($next -lt 0) {
  throw "Could not find ';const monthControls=' after incomeSections. Please inspect app/page.tsx around const incomeSections."
}

# Insert a JSX fragment directly after the assignment equals sign.
$content = $content.Remove($start, $startMarker.Length).Insert($start, 'const incomeSections=<><div className="source-help"')

# Recalculate next marker position after the first insertion.
$next = $content.IndexOf($nextMarker, $start)
if ($next -lt 0) {
  throw "Could not re-find ';const monthControls=' after inserting fragment start."
}

# Close the fragment immediately before ;const monthControls=.
$content = $content.Insert($next, '</>')

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 52 applied: incomeSections source-help + income-grid are now wrapped in a JSX fragment."
