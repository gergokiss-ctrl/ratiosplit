$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Patch 54: final robust fix for the Patch 49 incomeSections JSX issue.
# It also handles the partially-applied Patch 53 state, where the fragment start was already inserted.

$plainStart = 'const incomeSections=<div className="source-help"'
$fragmentStart = 'const incomeSections=<><div className="source-help"'

$start = $content.IndexOf($fragmentStart)
if ($start -lt 0) {
  $plain = $content.IndexOf($plainStart)
  if ($plain -lt 0) {
    throw "Could not find incomeSections source-help start marker. Please inspect app/page.tsx around const incomeSections."
  }
  $content = $content.Remove($plain, $plainStart.Length).Insert($plain, $fragmentStart)
  $start = $plain
  Write-Host "Inserted JSX fragment start after incomeSections=."
} else {
  Write-Host "JSX fragment start already present."
}

# Search after incomeSections for the start of monthControls, allowing any whitespace around the declaration.
$tail = $content.Substring($start)
$match = [regex]::Match($tail, ';\s*const\s+monthControls\s*=')
if (-not $match.Success) {
  throw "Could not find the end marker '; const monthControls =' after incomeSections. Please inspect app/page.tsx around const incomeSections."
}

$semiIndex = $start + $match.Index

# If the closing fragment is already directly before the semicolon, do not add it again.
$lookBehindStart = [Math]::Max(0, $semiIndex - 10)
$lookBehind = $content.Substring($lookBehindStart, $semiIndex - $lookBehindStart)
if ($lookBehind -match '</>\s*$') {
  Write-Host "JSX fragment close already present before incomeSections semicolon."
} else {
  $content = $content.Insert($semiIndex, '</>')
  Write-Host "Inserted JSX fragment close before incomeSections semicolon."
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 54 applied: incomeSections JSX fragment is now complete."
