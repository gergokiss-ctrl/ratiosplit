
$ErrorActionPreference = "Stop"

$cssPath = "app/styles.css"
$cssMarker = "/* Patch 26 - Settings button and mobile month selector fix */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($cssMarker)) {
  Add-Content -Path $cssPath -Value @'


/* Patch 26 - Settings button and mobile month selector fix */
@media (max-width: 720px) {
  .month-controls {
    display: grid !important;
    grid-template-columns: 52px minmax(0, 1fr) 52px !important;
    gap: 10px !important;
    width: 100% !important;
  }

  .month-controls .month-nav-btn {
    width: 52px !important;
    min-width: 52px !important;
    height: 52px !important;
    min-height: 52px !important;
    padding: 0 !important;
  }

  .month-controls .field {
    grid-column: 2 !important;
    grid-row: 1 !important;
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .month-controls input[type="month"],
  .month-controls input:not([type]) {
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    height: 52px !important;
    text-align: center !important;
    padding-left: 6px !important;
    padding-right: 6px !important;
    font-size: 17px !important;
    overflow: hidden !important;
    -webkit-appearance: none !important;
    appearance: none !important;
  }

  .month-controls .review-btn,
  .month-controls .settings-btn,
  .month-controls .lock-btn {
    grid-column: 1 / -1 !important;
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.settings-card {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fbfcfd;
  padding: 12px;
}
.settings-card h3 {
  margin: 0 0 10px;
  color: var(--navy-900);
}
.settings-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid #e5e9ef;
}
.settings-row:last-child { border-bottom: 0; }
.settings-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}
.security-note {
  border: 1px solid #ffd18f;
  background: #fff7e8;
  color: #8a4b00;
  border-radius: 10px;
  padding: 12px;
  margin-top: 12px;
  font-weight: 650;
}
@media (max-width: 720px) {
  .settings-grid,
  .settings-actions { grid-template-columns: 1fr; }
}

'@ -Encoding UTF8
  Write-Host "Patch 26 CSS appended."
} else {
  Write-Host "Patch 26 CSS already present."
}

$pagePath = "app/page.tsx"
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Add Settings state if missing.
if ($content -notmatch 'showSettings') {
  $content = $content -replace '\[showReview,setShowReview\]=useState\(false\)', '[showReview,setShowReview]=useState(false),[showSettings,setShowSettings]=useState(false),[backupHealth,setBackupHealth]=useState<any>(null)'
  Write-Host "Added Settings state."
}

# Include Settings in modalOpen if missing.
if ($content -match 'modalOpen=' -and $content -notmatch 'showSettings\|\|Boolean\(editingIncome\)') {
  $content = $content.Replace('modalOpen=showExpenseForm||showIncomeSetup||showAllExpenses||showReview||Boolean(editingIncome)', 'modalOpen=showExpenseForm||showIncomeSetup||showAllExpenses||showReview||showSettings||Boolean(editingIncome)')
}

# Add openSettings function if missing.
if ($content -notmatch 'async function openSettings') {
  $fn = 'async function openSettings(){setShowSettings(true);try{const r=await fetch("/api/backup/health");const d=await r.json();setBackupHealth(d)}catch{setBackupHealth({error:"Could not load backup status."})}} '
  $content = $content -replace 'async function setLockStatus', ($fn + 'async function setLockStatus')
  Write-Host "Added openSettings function."
}

# Add Settings button if missing.
if ($content -notmatch 'settings-btn') {
  $reviewButton = '<button className="btn secondary review-btn" onClick={()=>setShowReview(true)}>Review</button>'
  $settingsButton = '<button className="btn secondary review-btn" onClick={()=>setShowReview(true)}>Review</button><button className="btn secondary settings-btn" onClick={openSettings}>Settings</button>'
  if ($content.Contains($reviewButton)) {
    $content = $content.Replace($reviewButton, $settingsButton)
    Write-Host "Added Settings button."
  } else {
    Write-Host "Could not find Review button pattern; Settings button was not inserted."
  }
}

# Add Settings modal before Review modal if missing.
if ($content -notmatch 'Backup & maintenance') {
  $settingsModal = @'
{showSettings&&<div className="drawer-backdrop" onClick={()=>setShowSettings(false)}><section className="drawer review" onClick={e=>e.stopPropagation()}><div className="drawer-head"><h2 className="panel-title">Settings</h2><button className="btn secondary" onClick={()=>setShowSettings(false)}>Close</button></div><div className="settings-grid"><div className="settings-card"><h3>Backup & maintenance</h3><div className="settings-row"><span>Database</span><strong>{backupHealth?.database?.exists?"Available":"Unknown"}</strong></div><div className="settings-row"><span>Size</span><strong>{backupHealth?.database?.sizeBytes?`${Math.round(backupHealth.database.sizeBytes/1024)} KB`:"-"}</strong></div><div className="settings-row"><span>Checked</span><strong>{backupHealth?.checkedAt?new Date(backupHealth.checkedAt).toLocaleString("en-US"):"-"}</strong></div></div><div className="settings-card"><h3>Record counts</h3><div className="settings-row"><span>People</span><strong>{backupHealth?.counts?.people??"-"}</strong></div><div className="settings-row"><span>Months</span><strong>{backupHealth?.counts?.months??"-"}</strong></div><div className="settings-row"><span>Expenses</span><strong>{backupHealth?.counts?.expenses??"-"}</strong></div><div className="settings-row"><span>Monthly incomes</span><strong>{backupHealth?.counts?.monthlyIncomes??"-"}</strong></div><div className="settings-row"><span>Income sources</span><strong>{backupHealth?.counts?.incomeSources??"-"}</strong></div></div></div><div className="settings-actions"><a className="btn full" href="/api/backup/db">Download DB backup</a><a className="btn secondary full" href="/api/backup/json">Download JSON export</a><a className="btn secondary full" href={`/api/export/${month}`}>Export current month CSV</a></div><div className="security-note">Only use RatioSplit on your private LAN or Tailscale network. The backup endpoints are not protected by a login yet, so do not expose this app directly to the public internet.</div></section></div>}
'@
  $needle = '{showReview&&<div className="drawer-backdrop"'
  if ($content.Contains($needle)) {
    $content = $content.Replace($needle, $settingsModal + $needle)
    Write-Host "Added Settings modal."
  } else {
    Write-Host "Could not find Review modal insertion point; Settings modal was not inserted."
  }
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 26 page tweaks applied."
