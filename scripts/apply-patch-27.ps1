
$ErrorActionPreference = "Stop"
$cssPath = "app/styles.css"
$marker = "/* Patch 27 - header desktop and settings date polish */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($marker)) {
  Add-Content -Path $cssPath -Value @'


/* Patch 27 - header desktop and settings date polish */
@media (min-width: 721px) {
  .header {
    grid-template-columns: minmax(0, 1fr) minmax(720px, 980px) !important;
  }
  .month-controls {
    grid-template-columns: 44px minmax(170px, 1fr) 44px auto auto auto !important;
    align-items: end !important;
  }
  .month-controls .lock-btn,
  .month-controls .review-btn,
  .month-controls .settings-btn {
    white-space: nowrap !important;
  }
}

'@ -Encoding UTF8
  Write-Host "Patch 27 CSS appended."
} else {
  Write-Host "Patch 27 CSS already present."
}

$pagePath = "app/page.tsx"
$content = Get-Content $pagePath -Raw -Encoding UTF8
$content = $content.Replace('new Date(backupHealth.checkedAt).toLocaleString("en-US")', 'new Date(backupHealth.checkedAt).toLocaleString("hu-HU",{timeZone:"Europe/Budapest",dateStyle:"short",timeStyle:"medium"})')
Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 27 page tweaks applied."
