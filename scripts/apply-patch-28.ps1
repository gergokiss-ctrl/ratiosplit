
$ErrorActionPreference = "Stop"
$cssPath = "app/styles.css"
$marker = "/* Patch 28 - Header month selector and button polish */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($marker)) {
  Add-Content -Path $cssPath -Value @'


/* Patch 28 - Header month selector and button polish */
.month-controls {
  align-items: end !important;
}

.month-controls .field {
  align-self: end !important;
}

.month-controls .field input[type="month"],
.month-controls .field input:not([type]) {
  height: 52px !important;
  min-height: 52px !important;
  line-height: 1.2 !important;
  display: block !important;
}

.month-controls .btn,
.month-controls .month-nav-btn,
.month-controls .review-btn,
.month-controls .settings-btn,
.month-controls .lock-btn {
  height: 52px !important;
  min-height: 52px !important;
  line-height: 1 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  vertical-align: middle !important;
}

.month-controls .month-nav-btn {
  width: 52px !important;
  min-width: 52px !important;
  padding: 0 !important;
  font-size: 22px !important;
  font-weight: 850 !important;
  text-align: center !important;
}

.month-controls .lock-btn:not(.secondary) {
  border-color: var(--blue-700) !important;
  background: var(--blue-700) !important;
  color: #fff !important;
}

.month-controls .lock-btn:not(.secondary):hover {
  border-color: var(--blue-600) !important;
  background: var(--blue-600) !important;
  color: #fff !important;
}

.month-controls .lock-btn.secondary {
  border-color: var(--blue-700) !important;
}

@media (min-width: 721px) {
  .month-controls {
    grid-template-columns: 52px minmax(220px, 1fr) 52px auto auto auto !important;
    gap: 10px !important;
  }

  .month-controls .review-btn,
  .month-controls .settings-btn,
  .month-controls .lock-btn {
    white-space: nowrap !important;
    padding-left: 18px !important;
    padding-right: 18px !important;
  }
}

@media (max-width: 720px) {
  .month-controls {
    grid-template-columns: 52px minmax(0, 1fr) 52px !important;
    gap: 10px !important;
  }

  .month-controls .field {
    grid-column: 2 !important;
    grid-row: 1 !important;
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .month-controls .month-nav-btn:first-child {
    grid-column: 1 !important;
    grid-row: 1 !important;
  }

  .month-controls .month-nav-btn:nth-of-type(2) {
    grid-column: 3 !important;
    grid-row: 1 !important;
  }

  .month-controls .field input[type="month"],
  .month-controls .field input:not([type]) {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    text-align: center !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
    font-size: 17px !important;
    overflow: hidden !important;
    -webkit-appearance: none !important;
    appearance: none !important;
  }

  .month-controls .review-btn,
  .month-controls .settings-btn,
  .month-controls .lock-btn {
    grid-column: 1 / -1 !important;
    width: 100% !important;
  }
}

'@ -Encoding UTF8
  Write-Host "Patch 28 CSS appended."
} else {
  Write-Host "Patch 28 CSS already present."
}
