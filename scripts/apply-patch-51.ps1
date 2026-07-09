$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Patch 51 fixes the Patch 49 JSX syntax issue.
# Cause: Patch 49 changed a single JSX initializer
#   const incomeSections=<div className="income-grid">...</div>;
# into two adjacent JSX siblings:
#   const incomeSections=<div className="source-help">...</div><div className="income-grid">...</div>;
# Adjacent JSX elements must be wrapped in a fragment.

if ($content -match 'const incomeSections=<><div className="source-help"') {
  Write-Host "incomeSections is already wrapped in a JSX fragment. No change needed."
}
elseif ($content -match 'const incomeSections=<div className="source-help"') {
  $content = $content.Replace('const incomeSections=<div className="source-help"', 'const incomeSections=<><div className="source-help"')

  # Close the fragment right before the next const declaration.
  # In the current compact page.tsx format incomeSections is followed by `;const ratioControls=`.
  $pattern = '</div>;const ratioControls='
  if ($content.Contains($pattern)) {
    $content = $content.Replace($pattern, '</div></>;const ratioControls=')
    Write-Host "Wrapped incomeSections source-help + income-grid in a JSX fragment."
  } else {
    # Fallback: only replace the first occurrence before ratioControls with regex.
    $newContent = [regex]::Replace($content, '</div>;\s*const ratioControls=', '</div></>;const ratioControls=', 1)
    if ($newContent -ne $content) {
      $content = $newContent
      Write-Host "Wrapped incomeSections using regex fallback."
    } else {
      throw "Could not find the end of incomeSections before ratioControls. Please inspect app/page.tsx around const incomeSections."
    }
  }
}
else {
  Write-Host "Patch 49 incomeSections source-help pattern not found. No change made."
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 51 applied."
