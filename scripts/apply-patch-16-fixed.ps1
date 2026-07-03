
$ErrorActionPreference = "Stop"

# 1) Append CSS safely
$cssPath = "app/styles.css"
$cssMarker = "/* Patch 16 fixed - CSS additions */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($cssMarker)) {
  Add-Content -Path $cssPath -Value (Get-Content ".\app\styles.patch16.css" -Raw -Encoding UTF8) -Encoding UTF8
  Write-Host "Patch 16 fixed CSS appended."
} else {
  Write-Host "Patch 16 fixed CSS already present."
}

# 2) Clean up potential broken JSX introduced by the previous failed script.
$pagePath = "app/page.tsx"
$content = Get-Content $pagePath -Raw -Encoding UTF8
$content = $content.Replace('disabled={{isLocked}}', 'disabled={isLocked}')
$content = $content.Replace('checked={{(d as any).isOneTime??false}}', 'checked={(d as any).isOneTime??false}')
$content = $content.Replace('checked={{draft.isOneTime}}', 'checked={draft.isOneTime}')
$content = $content.Replace('onClick={{()=>addIncomeSource(person.id)}}', 'onClick={()=>addIncomeSource(person.id)}')
$content = $content.Replace('onClick={{archiveDisabledSources}}', 'onClick={archiveDisabledSources}')
$content = $content.Replace('onClick={{saveIncomeSources}}', 'onClick={saveIncomeSources}')

# 3) Ensure TypeScript draft types include isOneTime.
$content = $content -replace '\{name:string;defaultAmount:string;isEnabled:boolean\}', '{name:string;defaultAmount:string;isEnabled:boolean;isOneTime:boolean}'
$content = $content -replace 'isEnabled:true\}', 'isEnabled:true,isOneTime:false}'
$content = $content -replace 'isEnabled:s\.isEnabled\}', 'isEnabled:s.isEnabled,isOneTime:(s as any).isOneTime??false}'

# 4) Ensure new income source POST includes monthKey and support one-time backend.
$content = $content -replace 'body:JSON\.stringify\(\{personId,\.\.\.d\}\)', 'body:JSON.stringify({personId,monthKey:month,...d})'

# 5) Add archive function if missing. Insert before const resultText.
if ($content -notmatch 'async function archiveDisabledSources') {
  $archiveFunction = 'async function archiveDisabledSources(){if(isLocked)return;for(const source of incomeData?.sources??[]){const draft=sourceDrafts[source.id];if(draft&&!draft.isEnabled){await fetch(`/api/income-sources/${source.id}`,{method:"DELETE"})}}await loadMonth();setShowIncomeSetup(false);setMessage("Disabled income sources archived.")} '
  $content = $content -replace 'const resultText=', ($archiveFunction + 'const resultText=')
}

# 6) Add One-time checkbox to existing source rows if not already present.
if ($content -notmatch 'One-time') {
  $content = $content.Replace('/> Enabled</label></div>', '/> Enabled</label><label><input disabled={isLocked} type="checkbox" checked={(d as any).isOneTime??false} onChange={e=>setSourceDrafts(v=>({...v,[s.id]:{...d,isOneTime:e.target.checked}}))}/> One-time</label></div>')
  $content = $content.Replace('<button disabled={isLocked} className="btn" onClick={()=>addIncomeSource(person.id)}>Add</button>', '<label><input disabled={isLocked} type="checkbox" checked={draft.isOneTime} onChange={e=>setNewSource(v=>({...v,[person.id]:{...draft,isOneTime:e.target.checked}}))}/> One-time</label><button disabled={isLocked} className="btn" onClick={()=>addIncomeSource(person.id)}>Add</button>')
}

# 7) Add Archive disabled button next to Save sources if missing.
if ($content -notmatch 'Archive disabled') {
  $content = $content.Replace('<button className="btn" disabled={isLocked} onClick={saveIncomeSources}>Save sources</button>', '<button className="btn secondary" disabled={isLocked} onClick={archiveDisabledSources}>Archive disabled</button><button className="btn" disabled={isLocked} onClick={saveIncomeSources}>Save sources</button>')
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 16 fixed page tweaks applied."
