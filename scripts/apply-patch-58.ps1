$ErrorActionPreference = "Stop"

$pagePath = "app/page.tsx"
if (!(Test-Path -LiteralPath "app/months/page.tsx")) { throw "app/months/page.tsx was not copied into the repository." }

# Add an optional Settings link without changing business logic.
if (Test-Path -LiteralPath $pagePath) {
  $content = Get-Content -LiteralPath $pagePath -Raw -Encoding UTF8
  if ($content -match 'href="/months"') {
    Write-Host "Monthly overview link already present."
  } else {
    $candidates = @(
      '<a className="btn secondary full" href="/backup">Backup dashboard</a>',
      '<a className="btn secondary full" href="/categories">Manage categories</a>',
      '<a className="btn secondary full" href="/restore">Restore instructions</a>'
    )
    $inserted = $false
    foreach ($candidate in $candidates) {
      if ($content.Contains($candidate)) {
        $content = $content.Replace($candidate, $candidate + '<a className="btn secondary full" href="/months">Monthly overview</a>')
        $inserted = $true
        break
      }
    }
    if ($inserted) {
      Set-Content -LiteralPath $pagePath -Value $content -Encoding UTF8
      Write-Host "Added Monthly overview link to Settings."
    } else {
      Write-Host "Settings insertion point not found. The /months page still works directly."
    }
  }
}

Write-Host "Patch 58 applied. Open /months after deployment."
