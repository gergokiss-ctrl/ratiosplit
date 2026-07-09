$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# 1) Remove the Month setup status card from the hero if it was inserted by Patch 43.
if ($content -match 'Month setup') {
  $pattern = '<div className="settings-card"><div className="hero-label">Month setup</div>[\s\S]*?</div><button className="btn full" disabled=\{isLocked\} onClick=\{openNewExpense\}>\+ Add expense</button>'
  $replacement = '<button className="btn full" disabled={isLocked} onClick={openNewExpense}>+ Add expense</button>'
  $newContent = [regex]::Replace($content, $pattern, $replacement, 1)
  if ($newContent -ne $content) {
    $content = $newContent
    Write-Host "Removed Month setup card."
  } else {
    Write-Host "Month setup text found, but exact card pattern was not found. No removal made."
  }
} else {
  Write-Host "Month setup card not present."
}

# 2) Ensure selected-month default date helper is present.
if ($content -notmatch 'function dateForMonth') {
  $old = 'function currentMonthKey(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`} function toDateInput(d=new Date()){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}'
  $new = 'function currentMonthKey(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`} function toDateInput(d=new Date()){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`} function dateForMonth(monthKey:string){const now=new Date();const[y,m]=monthKey.split("-").map(Number);const lastDay=new Date(y,m,0).getDate();const day=String(Math.min(now.getDate(),lastDay)).padStart(2,"0");return`${monthKey}-${day}`}'
  if ($content.Contains($old)) {
    $content = $content.Replace($old,$new)
    Write-Host "Added dateForMonth helper."
  }
}

# 3) Ensure Add expense uses the selected month date.
$content = $content.Replace('setForm({...emptyForm,paidByPersonId:p1?.id||""});setShowExpenseForm(true)', 'setForm({...emptyForm,date:dateForMonth(month),paidByPersonId:p1?.id||""});setShowExpenseForm(true)')

# 4) Ensure one-time income state exists.
if ($content -notmatch 'showOneTimeIncomeForm') {
  $content = $content.Replace('[showExpenseForm,setShowExpenseForm]=useState(false),[showIncomeSetup,setShowIncomeSetup]=useState(false)', '[showExpenseForm,setShowExpenseForm]=useState(false),[showIncomeSetup,setShowIncomeSetup]=useState(false),[showOneTimeIncomeForm,setShowOneTimeIncomeForm]=useState(false),[oneTimeForm,setOneTimeForm]=useState<{personId:string;name:string;amount:string}>({personId:"",name:"",amount:""})')
  Write-Host "Added one-time income state."
}

# 5) Include one-time income modal in body lock.
$content = $content.Replace('modalOpen=showExpenseForm||showIncomeSetup||showAllExpenses||showReview||showSettings||Boolean(editingIncome)', 'modalOpen=showExpenseForm||showIncomeSetup||showOneTimeIncomeForm||showAllExpenses||showReview||showSettings||Boolean(editingIncome)')
$content = $content.Replace('modalOpen=showExpenseForm||showIncomeSetup||showAllExpenses||showReview||Boolean(editingIncome)', 'modalOpen=showExpenseForm||showIncomeSetup||showOneTimeIncomeForm||showAllExpenses||showReview||Boolean(editingIncome)')

# 6) Ensure one-time income functions exist.
if ($content -notmatch 'async function saveOneTimeIncome') {
  $fn = 'function openOneTimeIncome(){if(isLocked)return;setOneTimeForm({personId:p1?.id||"",name:"",amount:""});setShowOneTimeIncomeForm(true)} async function saveOneTimeIncome(e:React.FormEvent){e.preventDefault();if(isLocked)return;setMessage("");const res=await fetch("/api/income-sources",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({personId:oneTimeForm.personId,monthKey:month,name:oneTimeForm.name,defaultAmount:oneTimeForm.amount,isOneTime:true,isEnabled:false})});const d=await res.json().catch(()=>({}));if(!res.ok){setMessage(d.error||"Could not add one-time income.");return}setShowOneTimeIncomeForm(false);setOneTimeForm({personId:p1?.id||"",name:"",amount:""});await loadMonth();setMessage("One-time income added.")} '
  $content = $content -replace 'async function setLockStatus', ($fn + 'async function setLockStatus')
  Write-Host "Added one-time income functions."
}

# 7) Add Add one-time income button next to Manage sources if missing.
if ($content -notmatch 'Add one-time income') {
  $manageButton = '<button className="btn secondary" disabled={isLocked} onClick={()=>setShowIncomeSetup(true)}>Manage sources</button>'
  $buttons = '<div className="action-row"><button className="btn secondary" disabled={isLocked} onClick={openOneTimeIncome}>Add one-time income</button><button className="btn secondary" disabled={isLocked} onClick={()=>setShowIncomeSetup(true)}>Manage sources</button></div>'
  if ($content.Contains($manageButton)) {
    $content = $content.Replace($manageButton, $buttons)
    Write-Host "Added Add one-time income button."
  } else {
    Write-Host "Manage sources button pattern was not found; one-time income button was not added."
  }
} else {
  Write-Host "Add one-time income button already present."
}

# 8) Ensure one-time income modal exists.
if ($content -notmatch 'New one-time income') {
  $modal = @'
{showOneTimeIncomeForm&&<div className="drawer-backdrop edit-layer" onClick={()=>setShowOneTimeIncomeForm(false)}><section className="drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><h2 className="panel-title">New one-time income</h2><button className="btn secondary" onClick={()=>setShowOneTimeIncomeForm(false)}>Close</button></div><form className="form" onSubmit={saveOneTimeIncome}><div className="field"><label>Person</label><select disabled={isLocked} value={oneTimeForm.personId} onChange={e=>setOneTimeForm({...oneTimeForm,personId:e.target.value})}>{people.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="field"><label>Name</label><input disabled={isLocked} value={oneTimeForm.name} onChange={e=>setOneTimeForm({...oneTimeForm,name:e.target.value})} placeholder="e.g. Overtime"/></div><div className="field"><label>Amount</label><input disabled={isLocked} value={oneTimeForm.amount} onChange={e=>setOneTimeForm({...oneTimeForm,amount:e.target.value})} inputMode="decimal" placeholder="0"/></div><button className="btn full" disabled={isLocked}>Add one-time income</button></form></section></div>}
'@
  $needle = '{showIncomeSetup&&<div className="drawer-backdrop"'
  if ($content.Contains($needle)) {
    $content = $content.Replace($needle, $modal + $needle)
    Write-Host "Added one-time income modal."
  } else {
    Write-Host "Income setup modal insertion point not found."
  }
}

# 9) One-time text label polish.
$content = $content.Replace('{i.isIncluded?"Included":"Excluded"}{i.incomeSource.isOneTime?" - one-time":""}', '{i.isIncluded?"Included":"Excluded"}{i.incomeSource.isOneTime?" - One-time":""}')

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 44 page tweaks applied."
