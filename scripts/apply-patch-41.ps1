$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (Test-Path $pagePath) {
  $content = Get-Content $pagePath -Raw -Encoding UTF8
  if ($content -notmatch 'href="/backup"' -and $content -match 'Restore instructions') {
    $content = $content.Replace('<a className="btn secondary full" href="/restore">Restore instructions</a>', '<a className="btn secondary full" href="/restore">Restore instructions</a><a className="btn secondary full" href="/backup">Backup dashboard</a>')
    Set-Content $pagePath $content -Encoding UTF8
    Write-Host "Settings modal Backup dashboard link added."
  } elseif ($content -match 'href="/backup"') {
    Write-Host "Settings modal already contains Backup dashboard link."
  } else {
    Write-Host "Settings modal Restore instructions link not found. /backup page still works directly."
  }
}
Write-Host "Patch 41 applied."
