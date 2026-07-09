$ErrorActionPreference = "Stop"

# Append CSS
$cssPath = "app/styles.css"
$cssMarker = "/* Patch 49 - Income source UX polish */"
$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($cssMarker)) {
  Add-Content -Path $cssPath -Value @'


/* Patch 49 - Income source UX polish */
.source-help {
  border: 1px solid #dbe7f3;
  background: #f8fbff;
  color: var(--muted);
  border-radius: 10px;
  padding: 12px;
  margin: 10px 0 14px;
  line-height: 1.45;
}
.source-help strong {
  color: var(--navy-900);
}
.source-help ul {
  margin: 8px 0 0 18px;
  padding: 0;
}
.source-help li {
  margin: 4px 0;
}
.income-source-row.add {
  background: #f8fbff;
  border-radius: 10px;
  padding: 10px;
  border: 1px dashed #bdd5ed;
}
.income-source-row.add .btn {
  min-height: 42px;
}

'@ -Encoding UTF8
  Write-Host "Patch 49 CSS appended."
} else {
  Write-Host "Patch 49 CSS already present."
}

$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# Add a compact explanation inside Manage sources modal.
if ($content -notmatch 'Recurring sources appear every month') {
  $needle = '</div><div className="income-grid">{people.map(person=>{const draft=newSource[person.id]??{name:"",defaultAmount:"",isEnabled:true,isOneTime:false};const sources=incomeData?.sources.filter(s=>s.personId===person.id)??[];return <section className="income-person" key={person.id}><h3>{person.name}</h3>'
  $replacement = '</div><div className="source-help"><strong>Income source types</strong><ul><li><strong>Recurring</strong> sources appear every month while enabled.</li><li><strong>One-time</strong> sources are created only for the selected month, useful for bonus-like income.</li><li>Default amount is optional. Empty default means the amount can be filled in from the monthly income row.</li></ul></div><div className="income-grid">{people.map(person=>{const draft=newSource[person.id]??{name:"",defaultAmount:"",isEnabled:true,isOneTime:false};const sources=incomeData?.sources.filter(s=>s.personId===person.id)??[];return <section className="income-person" key={person.id}><h3>{person.name}</h3>'
  if ($content.Contains($needle)) {
    $content = $content.Replace($needle, $replacement)
    Write-Host "Added Manage sources help box."
  } else {
    Write-Host "Manage sources help insertion point not found. Trying broader fallback."
    $fallback = '<div className="income-grid">{people.map(person=>{const draft=newSource[person.id]??{name:"",defaultAmount:"",isEnabled:true,isOneTime:false};const sources=incomeData?.sources.filter(s=>s.personId===person.id)??[];return <section className="income-person" key={person.id}><h3>{person.name}</h3>'
    $fallbackReplacement = '<div className="source-help"><strong>Income source types</strong><ul><li><strong>Recurring</strong> sources appear every month while enabled.</li><li><strong>One-time</strong> sources are created only for the selected month, useful for bonus-like income.</li><li>Default amount is optional. Empty default means the amount can be filled in from the monthly income row.</li></ul></div>' + $fallback
    if ($content.Contains($fallback)) {
      $content = $content.Replace($fallback, $fallbackReplacement)
      Write-Host "Added Manage sources help box with fallback."
    } else {
      Write-Host "Could not add Manage sources help box."
    }
  }
} else {
  Write-Host "Manage sources help box already present."
}

# Improve placeholders in Manage sources.
$content = $content.Replace('placeholder="New source"', 'placeholder="New income source"')
$content = $content.Replace('placeholder="Default"', 'placeholder="Default amount"')

# Improve one-time label wording where present.
$content = $content.Replace('/> One-time</label>', '/> One-time for selected month</label>')
$content = $content.Replace('/> One-time for selected month for selected month</label>', '/> One-time for selected month</label>')

# Slightly improve the monthly income toolbar text.
$content = $content.Replace('Tap an income row to edit it for this month.', 'Tap an income row to edit this month\'s amount or inclusion.')

# Add a small note to the edit income modal if not already present.
if ($content -notmatch 'Recurring sources can be archived') {
  $needle2 = '<div className="notice"><strong>{editingIncome.person.name}</strong> / {editingIncome.incomeSource.name}{editingIncome.incomeSource.isOneTime?" / one-time":""}</div>'
  $replacement2 = '<div className="notice"><strong>{editingIncome.person.name}</strong> / {editingIncome.incomeSource.name}{editingIncome.incomeSource.isOneTime?" / one-time":""}</div><div className="muted">Recurring sources can be archived to hide them from future months. One-time sources can be removed from the selected month.</div>'
  if ($content.Contains($needle2)) {
    $content = $content.Replace($needle2, $replacement2)
    Write-Host "Added Edit income helper note."
  } else {
    Write-Host "Edit income helper insertion point not found."
  }
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 49 page tweaks applied."
