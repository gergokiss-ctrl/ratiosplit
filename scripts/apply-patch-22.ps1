$ErrorActionPreference = "Stop"
$path = "Dockerfile"
if (!(Test-Path $path)) { throw "Dockerfile not found in project root." }
$content = Get-Content $path -Raw -Encoding UTF8

$npmCiBlock = @'
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm ci --prefer-offline --no-audit --fund=false
'@

$npmInstallBlock = @'
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install --prefer-offline --no-audit --fund=false
'@

if ($content -match "npm ci --prefer-offline") {
  $content = $content.Replace($npmCiBlock.TrimEnd(), $npmInstallBlock.TrimEnd())
  Set-Content $path $content -Encoding UTF8
  Write-Host "Dockerfile changed from npm ci to npm install with retry settings."
} elseif ($content -match "npm install --prefer-offline") {
  Write-Host "Dockerfile already uses npm install with retry settings. No change needed."
} elseif ($content -match "RUN npm install") {
  $content = $content.Replace("RUN npm install", $npmInstallBlock.TrimEnd())
  Set-Content $path $content -Encoding UTF8
  Write-Host "Dockerfile npm install updated with retry settings."
} else {
  throw "Could not find npm install/npm ci in Dockerfile. Please inspect Dockerfile manually."
}
