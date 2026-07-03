
$ErrorActionPreference = "Stop"

# Append CSS
$cssPath = "app/styles.css"
$marker = "/* Patch 18 - income row actions */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($marker)) {
  Add-Content -Path $cssPath -Value @'


/* Patch 18 - income row actions */
.income-row {
  grid-template-columns: minmax(0, 1fr) 140px auto auto !important;
}
.income-row .income-action {
  min-height: 38px;
  padding: 6px 10px;
  font-size: 13px;
}
@media (max-width: 720px) {
  .income-row {
    grid-template-columns: 1fr !important;
  }
  .income-row .income-action {
    width: 100%;
  }
}

'@ -Encoding UTF8
  Write-Host "Patch 18 CSS appended."
} else {
  Write-Host "Patch 18 CSS already present."
}

# Patch page.tsx
$pagePath = "app/page.tsx"
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Ensure IncomeSource type includes isOneTime.
$content = $content -replace 'type IncomeSource=\{id:string;personId:string;name:string;defaultAmountHufMinor:number\|null;isEnabled:boolean\}', 'type IncomeSource={id:string;personId:string;name:string;defaultAmountHufMinor:number|null;isEnabled:boolean;isOneTime?:boolean}'

# Add clear/remove functions before resultText if missing.
if ($content -notmatch 'async function clearMonthlyIncome') {
  $functions = 'async function clearMonthlyIncome(id:string){if(isLocked)return;await fetch(`/api/monthly-incomes/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount:""})});await loadMonth()} async function removeMonthlyIncome(id:string){if(isLocked)return;if(!confirm("Remove this one-time income from this month?"))return;const res=await fetch(`/api/monthly-incomes/${id}`,{method:"DELETE"});const d=await res.json().catch(()=>({}));if(!res.ok){setMessage(d.error||"Could not remove income.");return}await loadMonth();setMessage("Income removed.")} '
  $content = $content -replace 'const resultText=', ($functions + 'const resultText=')
}

# Add Clear / Remove buttons to monthly income rows if missing.
if ($content -notmatch 'clearMonthlyIncome\(i.id\)') {
  $old = '<input disabled={isLocked} value={inputValueFromMinor(i.amountHufMinor)} placeholder="Amount" inputMode="decimal" onChange={e=>updateMonthlyIncome(i.id,e.target.value)}/></div>)'
  $new = '<input disabled={isLocked} value={inputValueFromMinor(i.amountHufMinor)} placeholder="Amount" inputMode="decimal" onChange={e=>updateMonthlyIncome(i.id,e.target.value)}/><button type="button" className="btn secondary income-action" disabled={isLocked} onClick={()=>clearMonthlyIncome(i.id)}>Clear</button>{(i.incomeSource as any).isOneTime&&<button type="button" className="btn danger income-action" disabled={isLocked} onClick={()=>removeMonthlyIncome(i.id)}>Remove</button>}</div>)'
  $content = $content.Replace($old, $new)
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 18 page tweaks applied."
