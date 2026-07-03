
$cssPath = "app/styles.css"
$cssMarker = "/* Patch 16 - income source management and review action rollback */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($cssMarker)) {
  Add-Content -Path $cssPath -Value @'


/* Patch 16 - income source management and review action rollback */
@media (max-width: 720px) {
  .drawer.review .action-row {
    position: static !important;
    bottom: auto !important;
    background: transparent !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    margin-bottom: 0 !important;
    padding: 0 !important;
    border-top: 0 !important;
  }
}
.income-source-row { grid-template-columns: minmax(0, 1fr) 120px auto auto !important; }
@media (max-width: 720px) { .income-source-row { grid-template-columns: 1fr !important; } }

'@ -Encoding UTF8
  Write-Host "Patch 16 CSS overrides appended."
} else {
  Write-Host "Patch 16 CSS overrides already present."
}

$pagePath = "app/page.tsx"
$content = Get-Content $pagePath -Raw -Encoding UTF8

$content = $content -replace '\{name:string;defaultAmount:string;isEnabled:boolean\}', '{name:string;defaultAmount:string;isEnabled:boolean;isOneTime:boolean}'
$content = $content -replace 'isEnabled:true\}', 'isEnabled:true,isOneTime:false}'
$content = $content -replace 'isEnabled:s\.isEnabled\}', 'isEnabled:s.isEnabled,isOneTime:(s as any).isOneTime??false}'
$content = $content -replace 'body:JSON\.stringify\(\{personId,\.\.\.d\}\)', 'body:JSON.stringify({personId,monthKey:month,...d})'

if ($content -notmatch 'archiveDisabledSources') {
  $needle = 'async function archiveDisabledSources(){if(isLocked)return;for(const source of incomeData?.sources??[]){const draft=sourceDrafts[source.id];if(draft&&!draft.isEnabled){await fetch(`/api/income-sources/${source.id}`,{method:"DELETE"})}}await loadMonth();setShowIncomeSetup(false);setMessage("Disabled income sources archived.")}'
  $content = $content -replace '(async function saveIncomeSources\(\).*?setMessage\("Income sources saved\."\)\})', '$1 ' + $needle
}

$content = $content -replace '/> Enabled</label></div>', '/> Enabled</label><label><input disabled={isLocked} type="checkbox" checked={(d as any).isOneTime??false} onChange={e=>setSourceDrafts(v=>({...v,[s.id]:{...d,isOneTime:e.target.checked}}))}/> One-time</label></div>'
$content = $content -replace '<button disabled=\{isLocked\} className="btn" onClick=\{\(\)=>addIncomeSource\(person\.id\)\}>Add</button>', '<label><input disabled={isLocked} type="checkbox" checked={draft.isOneTime} onChange={e=>setNewSource(v=>({...v,[person.id]:{...draft,isOneTime:e.target.checked}}))}/> One-time</label><button disabled={isLocked} className="btn" onClick={()=>addIncomeSource(person.id)}>Add</button>'
$content = $content -replace '<button className="btn" disabled=\{isLocked\} onClick=\{saveIncomeSources\}>Save sources</button>', '<button className="btn secondary" disabled={isLocked} onClick={archiveDisabledSources}>Archive disabled</button><button className="btn" disabled={isLocked} onClick={saveIncomeSources}>Save sources</button>'

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 16 page tweaks applied."
