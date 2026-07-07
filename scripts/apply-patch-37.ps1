$ErrorActionPreference = "Stop"

# Patch 37 fixes Patch 36 PowerShell parsing issue around the ampersand in Dockerfile CMD.
# It updates Dockerfile so the backup worker starts in the background before the app starts.

$dockerPath = "Dockerfile"
if (!(Test-Path $dockerPath)) {
  throw "Dockerfile not found in project root."
}

$docker = Get-Content $dockerPath -Raw -Encoding UTF8
$newCmd = 'CMD ["sh", "-c", "node scripts/auto-backup.mjs & npm start"]'

if ($docker -match 'auto-backup\.mjs') {
  Write-Host "Dockerfile already contains auto-backup worker. No change needed."
}
elseif ($docker -match 'CMD \["npm",\s*"start"\]') {
  $docker = [regex]::Replace($docker, 'CMD \["npm",\s*"start"\]', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $newCmd }, 1)
  Set-Content $dockerPath $docker -Encoding UTF8
  Write-Host "Dockerfile CMD updated for auto-backup worker."
}
elseif ($docker -match 'CMD npm start') {
  $docker = $docker.Replace('CMD npm start', $newCmd)
  Set-Content $dockerPath $docker -Encoding UTF8
  Write-Host "Dockerfile CMD updated for auto-backup worker."
}
else {
  Write-Host "Dockerfile CMD pattern not found. Add this line manually if needed:"
  Write-Host $newCmd
}

# Add Restore instructions link to Settings modal if possible.
$pagePath = "app/page.tsx"
if (Test-Path $pagePath) {
  $content = Get-Content $pagePath -Raw -Encoding UTF8
  if ($content -notmatch 'href="/restore"' -and $content -match 'Download DB backup') {
    $content = $content.Replace('<a className="btn full" href="/api/backup/db">Download DB backup</a>', '<a className="btn full" href="/api/backup/db">Download DB backup</a><a className="btn secondary full" href="/restore">Restore instructions</a>')
    Set-Content $pagePath $content -Encoding UTF8
    Write-Host "Settings modal Restore instructions link added."
  }
  elseif ($content -match 'href="/restore"') {
    Write-Host "Settings modal already contains Restore instructions link."
  }
  else {
    Write-Host "Settings modal backup button pattern not found. /restore page still works directly."
  }
}

Write-Host "Patch 37 applied."
