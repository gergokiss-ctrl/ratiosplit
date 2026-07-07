$ErrorActionPreference = "Stop"
$dockerPath = "Dockerfile"
if (!(Test-Path $dockerPath)) { throw "Dockerfile not found in project root." }

$docker = Get-Content $dockerPath -Raw -Encoding UTF8
$newCmd = 'CMD ["sh", "-c", "npx prisma db push && npx prisma generate && npm run prisma:seed && (node scripts/auto-backup.mjs &) && npm start"]'

if ($docker -match 'auto-backup\.mjs') {
  Write-Host "Dockerfile already contains auto-backup worker. No change needed."
}
elseif ($docker -match '(?m)^CMD\s+.*$') {
  $docker = [regex]::Replace($docker, '(?m)^CMD\s+.*$', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $newCmd }, 1)
  Set-Content $dockerPath $docker -Encoding UTF8
  Write-Host "Dockerfile CMD replaced with Prisma startup + auto-backup worker + app start."
}
else {
  Add-Content -Path $dockerPath -Value "`n$newCmd" -Encoding UTF8
  Write-Host "No CMD line was found, so a new CMD line was appended."
}

Write-Host "Patch 39 applied."
