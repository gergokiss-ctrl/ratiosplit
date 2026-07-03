$path = "app/styles.css"
$marker = "/* Patch 15 - mobile month picker and modal lock refinements */"
$content = Get-Content $path -Raw -Encoding UTF8
if ($content -notmatch [regex]::Escape($marker)) {
  Add-Content -Path $path -Value @'


/* Patch 15 - mobile month picker and modal lock refinements */
@media (max-width: 720px) {
  .month-controls {
    grid-template-columns: 52px minmax(0, 1fr) 52px !important;
    gap: 10px !important;
    width: 100% !important;
  }

  .month-controls .field {
    grid-column: 2 !important;
    grid-row: 1 !important;
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .month-controls .month-nav-btn {
    grid-row: 1 !important;
    width: 52px !important;
    min-width: 52px !important;
    height: 52px !important;
  }

  .month-controls .month-nav-btn:first-child {
    grid-column: 1 !important;
  }

  .month-controls .month-nav-btn:nth-of-type(2) {
    grid-column: 3 !important;
  }

  .month-controls input[type="month"] {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: 52px !important;
    text-align: center !important;
    font-size: 18px !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
    overflow: hidden !important;
    -webkit-appearance: none !important;
    appearance: none !important;
  }

  .month-controls .review-btn,
  .month-controls .lock-btn {
    grid-column: 1 / -1 !important;
  }

  .drawer-backdrop {
    position: fixed !important;
    inset: 0 !important;
    overflow: hidden !important;
    overscroll-behavior: none !important;
    touch-action: none !important;
  }

  .drawer {
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    border-radius: 0 !important;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    overscroll-behavior: contain !important;
    touch-action: pan-y !important;
  }

  .drawer.review {
    padding-bottom: calc(28px + env(safe-area-inset-bottom, 0px)) !important;
  }

  .drawer.review .action-row {
    position: sticky !important;
    bottom: 0 !important;
    background: linear-gradient(180deg, rgba(255,255,255,0.78), #ffffff 35%) !important;
    margin-left: -16px !important;
    margin-right: -16px !important;
    margin-bottom: calc(-28px - env(safe-area-inset-bottom, 0px)) !important;
    padding: 10px 16px calc(12px + env(safe-area-inset-bottom, 0px)) !important;
    border-top: 1px solid #e5e9ef !important;
  }
}

'@ -Encoding UTF8
  Write-Host "Patch 15 CSS overrides appended to app/styles.css"
} else {
  Write-Host "Patch 15 CSS overrides already present"
}
