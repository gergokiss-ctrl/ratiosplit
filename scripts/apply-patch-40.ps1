$ErrorActionPreference = "Stop"
$dockerPath = "Dockerfile"
if (!(Test-Path $dockerPath)) { throw "Dockerfile not found in project root." }

$docker = Get-Content $dockerPath -Raw -Encoding UTF8

# Ensure the runner stage contains the scripts folder. The auto-backup worker is started at runtime,
# so it must exist in the final image, not only in the builder stage.
if ($docker -match 'COPY --from=builder /app/scripts ./scripts') {
  Write-Host "Dockerfile already copies scripts into runner image."
} else {
  $insertLine = 'COPY --from=builder /app/scripts ./scripts'

  if ($docker -match '(?m)^COPY --from=builder /app/prisma ./prisma\s*$') {
    $docker = [regex]::Replace($docker, '(?m)^COPY --from=builder /app/prisma ./prisma\s*$', "`$0`n$insertLine", 1)
    Write-Host "Inserted scripts copy line after prisma copy line."
  } elseif ($docker -match '(?m)^COPY --from=builder .*$') {
    $docker = [regex]::Replace($docker, '(?m)^COPY --from=builder .*$', "`$0`n$insertLine", 1)
    Write-Host "Inserted scripts copy line after first builder copy line."
  } elseif ($docker -match '(?m)^CMD\s+.*$') {
    $docker = [regex]::Replace($docker, '(?m)^CMD\s+.*$', "$insertLine`n`$0", 1)
    Write-Host "Inserted scripts copy line before CMD line."
  } else {
    Add-Content -Path $dockerPath -Value "`n$insertLine" -Encoding UTF8
    Write-Host "No suitable insertion point found; appended scripts copy line. Please verify Dockerfile order."
  }

  Set-Content $dockerPath $docker -Encoding UTF8
}

# Keep the intended runtime command if it is not already present.
$newCmd = 'CMD ["sh", "-c", "npx prisma db push && npx prisma generate && npm run prisma:seed && (node scripts/auto-backup.mjs &) && npm start"]'
$docker = Get-Content $dockerPath -Raw -Encoding UTF8
if ($docker -notmatch 'node scripts/auto-backup\.mjs') {
  if ($docker -match '(?m)^CMD\s+.*$') {
    $docker = [regex]::Replace($docker, '(?m)^CMD\s+.*$', [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $newCmd }, 1)
    Set-Content $dockerPath $docker -Encoding UTF8
    Write-Host "Dockerfile CMD updated for auto-backup worker."
  } else {
    Add-Content -Path $dockerPath -Value "`n$newCmd" -Encoding UTF8
    Write-Host "Dockerfile CMD appended for auto-backup worker."
  }
} else {
  Write-Host "Dockerfile already starts auto-backup worker."
}

Write-Host "Patch 40 applied."
