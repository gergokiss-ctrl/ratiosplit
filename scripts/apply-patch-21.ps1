$ErrorActionPreference = "Stop"
$path = "Dockerfile"
if (!(Test-Path $path)) { throw "Dockerfile not found in project root." }
$content = Get-Content $path -Raw -Encoding UTF8

$old = "RUN npm install"
$new = @'
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm ci --prefer-offline --no-audit --fund=false
'@

if ($content -match "npm config set fetch-retries") {
  Write-Host "Dockerfile already contains npm retry settings. No change needed."
} elseif ($content -match [regex]::Escape($old)) {
  $content = $content.Replace($old, $new.TrimEnd())
  Set-Content $path $content -Encoding UTF8
  Write-Host "Dockerfile npm install replaced with npm ci + retry settings."
} else {
  throw "Could not find 'RUN npm install' in Dockerfile. Please inspect Dockerfile manually."
}
