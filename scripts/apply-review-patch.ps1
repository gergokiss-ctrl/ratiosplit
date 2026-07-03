
$path = "app/page.tsx"
$content = Get-Content $path -Raw

# Add review state after showAllExpenses state if not present
$content = $content -replace '\[showAllExpenses,setShowAllExpenses\]=useState\(false\)', '[showAllExpenses,setShowAllExpenses]=useState(false),[showReview,setShowReview]=useState(false)'

# Add Review button next to lock controls if not present
$content = $content -replace '<button className=\{`btn lock-btn \$\{isLocked\?''secondary'':''\}`\} onClick=\{\(\)=>setLockStatus\(isLocked\?''OPEN'':''LOCKED''\)\}\>\{isLocked\?''Unlock month'':''Lock month''\}\</button\>', '<button className="btn secondary review-btn" onClick={()=>setShowReview(true)}>Review</button><button className={`btn lock-btn ${isLocked?''secondary'':''}`} onClick={()=>setLockStatus(isLocked?''OPEN'':''LOCKED'')}>{isLocked?''Unlock month'':''Lock month''}</button>'

# Fallback if exact replacement did not work: insert before first lock button text pattern
if ($content -notmatch 'setShowReview') {
  $content = $content -replace '<button className=\{`btn lock-btn', '<button className="btn secondary review-btn" onClick={()=>setShowReview(true)}>Review</button><button className={`btn lock-btn'
}

# Add computed review helpers before return
$marker = 'const incomeSections=<div className="income-grid">'
$insert = @'
const incomeTotalByPerson = people.map((person)=>({ name: person.name, amount: incomeData?.summary.totalsByPerson[person.id] ?? 0, ratio: incomeData?.summary.ratiosByPerson[person.id] ?? null }));
const paidByPersonSummary = people.map((person)=>({ name: person.name, amount: expenses.filter(e=>e.splitType!=="EXCLUDED"&&e.paidByPerson.id===person.id).reduce((sum,e)=>sum+e.amountHufMinor,0) }));
const categorySummary = Object.entries(expenses.filter(e=>e.splitType!=="EXCLUDED").reduce((acc:Record<string,number>,e)=>{const key=e.category?.name??"No category";acc[key]=(acc[key]??0)+e.amountHufMinor;return acc},{})).sort((a,b)=>b[1]-a[1]);
const splitSummary = Object.entries(expenses.filter(e=>e.splitType!=="EXCLUDED").reduce((acc:Record<string,number>,e)=>{const key=splitLabels[e.splitType]??e.splitType;acc[key]=(acc[key]??0)+e.amountHufMinor;return acc},{})).sort((a,b)=>b[1]-a[1]);
'@
if ($content -notmatch 'incomeTotalByPerson') {
  $content = $content -replace [regex]::Escape($marker), ($insert + $marker)
}

# Add review modal before income setup modal
$modalMarker = '{showIncomeSetup&&<div className="drawer-backdrop"'
$reviewModal = @'
{showReview&&<div className="drawer-backdrop" onClick={()=>setShowReview(false)}><section className="drawer review" onClick={e=>e.stopPropagation()}><div className="drawer-head"><h2 className="panel-title">Month review – {month}</h2><button className="btn secondary" onClick={()=>setShowReview(false)}>Close</button></div><div className="review-grid"><div className="summary-card"><h3>Income summary</h3>{incomeTotalByPerson.map(row=><div className="summary-row" key={row.name}><span>{row.name}</span><strong>{huf(row.amount)} · {pctFromBps(row.ratio)}</strong></div>)}<div className="summary-row"><span>Total</span><strong>{huf(incomeData?.summary.total??0)}</strong></div></div><div className="summary-card"><h3>Paid by</h3>{paidByPersonSummary.map(row=><div className="summary-row" key={row.name}><span>{row.name}</span><strong>{huf(row.amount)}</strong></div>)}</div><div className="summary-card"><h3>By category</h3>{categorySummary.map(([name,amount])=><div className="summary-row" key={name}><span>{name}</span><strong>{huf(amount as number)}</strong></div>)}{categorySummary.length===0&&<div className="muted">No categorized expenses.</div>}</div><div className="summary-card"><h3>By split type</h3>{splitSummary.map(([name,amount])=><div className="summary-row" key={name}><span>{name}</span><strong>{huf(amount as number)}</strong></div>)}</div></div><div className="settlement-box"><div className="metric-label">Final settlement</div><strong>{resultText}</strong><div className="muted" style={{marginTop:6}}>Tracked expenses: {huf(totals.total)} · Excluded: {huf(totals.excluded)}</div></div><div className="action-row" style={{marginTop:14}}><button className="btn secondary" onClick={()=>setShowReview(false)}>Close</button><button className="btn" disabled={isLocked} onClick={()=>setLockStatus("LOCKED")}>Lock month</button></div></section></div>}
'@
if ($content -notmatch 'Month review') {
  $content = $content -replace [regex]::Escape($modalMarker), ($reviewModal + $modalMarker)
}

Set-Content $path $content -Encoding UTF8
Write-Host "Review workflow patch applied to app/page.tsx"
