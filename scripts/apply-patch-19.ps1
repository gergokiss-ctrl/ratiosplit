$ErrorActionPreference = "Stop"

# Append small CSS for direct archive buttons if not present.
$cssPath = "app/styles.css"
$cssMarker = "/* Patch 19 - direct source archive button */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($cssMarker)) {
  Add-Content -Path $cssPath -Value @'

/* Patch 19 - direct source archive button */
.income-source-row .source-archive-button {
  min-height: 38px;
  padding: 6px 10px;
  font-size: 13px;
}
@media (max-width: 720px) {
  .income-source-row .source-archive-button {
    width: 100%;
  }
}
'@ -Encoding UTF8
  Write-Host "Patch 19 CSS appended."
} else {
  Write-Host "Patch 19 CSS already present."
}

$pagePath = "app/page.tsx"
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Add a direct archive function for income sources if missing.
if ($content -notmatch 'async function archiveIncomeSource') {
  $fn = 'async function archiveIncomeSource(id:string){if(isLocked)return;if(!confirm("Archive this income source? Existing past monthly income rows will remain, but the source will be hidden from future use."))return;const res=await fetch(`/api/income-sources/${id}`,{method:"DELETE"});const d=await res.json().catch(()=>({}));if(!res.ok){setMessage(d.error||"Could not archive income source.");return}await loadMonth();setMessage("Income source archived.")} '
  $content = $content -replace 'const resultText=', ($fn + 'const resultText=')
}

# Add Archive button to source rows inside Manage sources modal if it is not already there.
if ($content -notmatch 'archiveIncomeSource\(s.id\)') {
  $content = $content.Replace('/> One-time</label></div>', '/> One-time</label><button type="button" className="btn danger source-archive-button" disabled={isLocked} onClick={()=>archiveIncomeSource(s.id)}>Archive</button></div>')
  $content = $content.Replace('/> Enabled</label></div>', '/> Enabled</label><button type="button" className="btn danger source-archive-button" disabled={isLocked} onClick={()=>archiveIncomeSource(s.id)}>Archive</button></div>')
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 19 page tweaks applied."
