$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
$backupPath = "$pagePath.patch57.bak"
if (!(Test-Path -LiteralPath $backupPath)) { throw "Patch 57 backup not found: $backupPath" }
Copy-Item -LiteralPath $backupPath -Destination $pagePath -Force
Write-Host "Restored app/page.tsx from Patch 57 backup."
