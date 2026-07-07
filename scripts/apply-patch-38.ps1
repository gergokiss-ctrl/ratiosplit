$ErrorActionPreference = "Stop"
$dockerPath = "Dockerfile"
if (!(Test-Path $dockerPath)) { throw "Dockerfile not found in project root." }
$docker = Get-Content $dockerPath -Raw -Encoding UTF8
$newStart = 'node scripts/auto-backup.mjs & npm start'
if ($docker -match 'auto-backup\.mjs') { Write-Host "Dockerfile already contains auto-backup worker." }
elseif ($docker -match 'npm start') { $docker = $docker.Replace('npm start', $newStart); Set-Content $dockerPath $docker -Encoding UTF8; Write-Host "Dockerfile npm start updated to launch auto-backup worker." }
else { Write-Host "Could not find 'npm start' in Dockerfile. Please add auto-backup startup manually." }
