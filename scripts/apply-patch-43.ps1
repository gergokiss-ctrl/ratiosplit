$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# 1) Add selected-month default date helper.
if ($content -notmatch 'function dateForMonth') {
  $old = 'function currentMonthKey(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`} function toDateInput(d=new Date()){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}'
  $new = 'function currentMonthKey(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`} function toDateInput(d=new Date()){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`} function dateForMonth(monthKey:string){const now=new Date();const[y,m]=monthKey.split("-").map(Number);const lastDay=new Date(y,m,0).getDate();const day=String(Math.min(now.getDate(),lastDay)).padStart(2,"0");return`${monthKey}-${day}`}'
  if ($content.Contains($old)) {
    $content = $content.Replace($old,$new)
    Write-Host "Added dateForMonth helper."
  } else {
    Write-Host "Could not find date helper insertion pattern; skipping."
  }
}

# 2) Add one-time income modal state.
if ($content -notmatch 'showOneTimeIncomeForm') {
  $content = $content.Replace('[showExpenseForm,setShowExpenseForm]=useState(false),[showIncomeSetup,setShowIncomeSetup]=useState(false)', '[showExpenseForm,setShowExpenseForm]=useState(false),[showIncomeSetup,setShowIncomeSetup]=useState(false),[showOneTimeIncomeForm,setShowOneTimeIncomeForm]=useState(false),[oneTimeForm,setOneTimeForm]=useState<{personId:string;name:string;amount:string}>({personId:"",name:"",amount:""})')
  Write-Host "Added one-time income state."
}

# 3) Include one-time income modal in body lock.
$content = $content.Replace('modalOpen=showExpenseForm||showIncomeSetup||showAllExpenses||showReview||showSettings||Boolean(editingIncome)', 'modalOpen=showExpenseForm||showIncomeSetup||showOneTimeIncomeForm||showAllExpenses||showReview||showSettings||Boolean(editingIncome)')
$content = $content.Replace('modalOpen=showExpenseForm||showIncomeSetup||showAllExpenses||showReview||Boolean(editingIncome)', 'modalOpen=showExpenseForm||showIncomeSetup||showOneTimeIncomeForm||showAllExpenses||showReview||Boolean(editingIncome)')

# 4) Make new expense date default to currently selected month instead of actual current date.
$content = $content.Replace('setForm({...emptyForm,paidByPersonId:p1?.id||""});setShowExpenseForm(true)', 'setForm({...emptyForm,date:dateForMonth(month),paidByPersonId:p1?.id||""});setShowExpenseForm(true)')

# 5) Add one-time income functions before setLockStatus.
if ($content -notmatch 'async function saveOneTimeIncome') {
  $fn = 'function openOneTimeIncome(){if(isLocked)return;setOneTimeForm({personId:p1?.id||"",name:"",amount:""});setShowOneTimeIncomeForm(true)} async function saveOneTimeIncome(e:React.FormEvent){e.preventDefault();if(isLocked)return;setMessage("");const res=await fetch("/api/income-sources",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({personId:oneTimeForm.personId,monthKey:month,name:oneTimeForm.name,defaultAmount:oneTimeForm.amount,isOneTime:true,isEnabled:false})});const d=await res.json().catch(()=>({}));if(!res.ok){setMessage(d.error||"Could not add one-time income.");return}setShowOneTimeIncomeForm(false);setOneTimeForm({personId:p1?.id||"",name:"",amount:""});await loadMonth();setMessage("One-time income added.")} '
  $content = $content -replace 'async function setLockStatus', ($fn + 'async function setLockStatus')
  Write-Host "Added one-time income functions."
}

# 6) Add Add one-time income button in Monthly incomes toolbar.
if ($content -notmatch 'Add one-time income') {
  $old = '<div className="toolbar"><span className="muted">Tap an income row to edit it for this month.</span><button className="btn secondary" disabled={isLocked} onClick={()=>setShowIncomeSetup(true)}>Manage sources</button></div>'
  $new = '<div className="toolbar"><span className="muted">Tap an income row to edit it for this month.</span><div className="action-row"><button className="btn secondary" disabled={isLocked} onClick={openOneTimeIncome}>Add one-time income</button><button className="btn secondary" disabled={isLocked} onClick={()=>setShowIncomeSetup(true)}>Manage sources</button></div></div>'
  if ($content.Contains($old)) {
    $content = $content.Replace($old,$new)
    Write-Host "Added one-time income button."
  } else {
    Write-Host "Monthly incomes toolbar pattern not found; button not inserted."
  }
}

# 7) Make one-time row label clearer.
$content = $content.Replace('{i.isIncluded?"Included":"Excluded"}{i.incomeSource.isOneTime?" - one-time":""}', '{i.isIncluded?"Included":"Excluded"}{i.incomeSource.isOneTime?" - One-time":""}')

# 8) Add month setup status card in hero.
if ($content -notmatch 'Month setup</div>') {
  $old = '<button className="btn full" disabled={isLocked} onClick={openNewExpense}>+ Add expense</button></section>'
  $new = '<div className="settings-card"><div className="hero-label">Month setup</div><div className="summary-row"><span>Incomes</span><strong>{(incomeData?.summary.total??0)>0?"Ready":"Missing"}</strong></div><div className="summary-row"><span>Expenses</span><strong>{expenses.length>0?"Ready":"Missing"}</strong></div><div className="summary-row"><span>Review</span><strong>{(incomeData?.summary.total??0)>0&&expenses.length>0?"Ready":"Add data first"}</strong></div></div><button className="btn full" disabled={isLocked} onClick={openNewExpense}>+ Add expense</button></section>'
  if ($content.Contains($old)) {
    $content = $content.Replace($old,$new)
    Write-Host "Added month setup card."
  } else {
    Write-Host "Hero add-expense insertion pattern not found; month setup not inserted."
  }
}

# 9) Add one-time income modal before Manage sources modal.
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

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 43 page tweaks applied."
