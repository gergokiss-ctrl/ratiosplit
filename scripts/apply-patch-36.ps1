$ErrorActionPreference = "Stop"

# 1) Update Dockerfile to start automatic backup worker in background before npm start.
$dockerPath = "Dockerfile"
if (Test-Path $dockerPath) {
  $docker = Get-Content $dockerPath -Raw -Encoding UTF8
  if ($docker -match "auto-backup.mjs") {
    Write-Host "Dockerfile already starts auto-backup worker."
  } elseif ($docker -match 'CMD \["npm",\s*"start"\]') {
    $docker = [regex]::Replace($docker, 'CMD \["npm",\s*"start"\]', 'CMD ["sh", "-c", "node scripts/auto-backup.mjs & npm start"]', 1)
    Set-Content $dockerPath $docker -Encoding UTF8
    Write-Host "Dockerfile CMD updated for auto-backup worker."
  } elseif ($docker -match 'CMD npm start') {
    $docker = $docker.Replace('CMD npm start', 'CMD ["sh", "-c", "node scripts/auto-backup.mjs & npm start"]')
    Set-Content $dockerPath $docker -Encoding UTF8
    Write-Host "Dockerfile CMD updated for auto-backup worker."
  } else {
    Write-Host "Dockerfile CMD pattern not found. Please manually set: CMD [\"sh\", \"-c\", \"node scripts/auto-backup.mjs & npm start\"]"
  }
} else {
  Write-Host "Dockerfile not found. Skipping Dockerfile update."
}

# 2) Add Restore instructions link to Settings modal if possible.
$pagePath = "app/page.tsx"
if (Test-Path $pagePath) {
  $content = Get-Content $pagePath -Raw -Encoding UTF8
  if ($content -notmatch 'href="/restore"' -and $content -match 'Download DB backup') {
    $content = $content.Replace('<a className="btn full" href="/api/backup/db">Download DB backup</a>', '<a className="btn full" href="/api/backup/db">Download DB backup</a><a className="btn secondary full" href="/restore">Restore instructions</a>')
    Set-Content $pagePath $content -Encoding UTF8
    Write-Host "Settings modal Restore instructions link added."
  } elseif ($content -match 'href="/restore"') {
    Write-Host "Settings modal already contains Restore instructions link."
  }
}
