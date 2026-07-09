$ErrorActionPreference = "Stop"

# Patch 49 fixed - avoids PowerShell parsing issues caused by apostrophes and JSX '<' characters.

$cssPath = "app/styles.css"
$cssMarker = "/* Patch 49 fixed - Income source UX polish */"
$cssContent = @'


/* Patch 49 fixed - Income source UX polish */
.source-help {
  border: 1px solid #dbe7f3;
  background: #f8fbff;
  color: var(--muted);
  border-radius: 10px;
  padding: 12px;
  margin: 10px 0 14px;
  line-height: 1.45;
}
.source-help strong { color: var(--navy-900); }
.source-help ul { margin: 8px 0 0 18px; padding: 0; }
.source-help li { margin: 4px 0; }
.income-source-row.add {
  background: #f8fbff;
  border-radius: 10px;
  padding: 10px;
  border: 1px dashed #bdd5ed;
}
.income-source-row.add .btn { min-height: 42px; }

'@

$css = Get-Content $cssPath -Raw -Encoding UTF8
if ($css -notmatch [regex]::Escape($cssMarker)) {
  Add-Content -Path $cssPath -Value $cssContent -Encoding UTF8
  Write-Host "Patch 49 fixed CSS appended."
} else {
  Write-Host "Patch 49 fixed CSS already present."
}

$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8

# 1) Add a compact help box to Manage sources, if not already present.
if ($content -notmatch 'Recurring sources appear every month') {
  $helpBox = @'
<div className="source-help"><strong>Income source types</strong><ul><li><strong>Recurring</strong> sources appear every month while enabled.</li><li><strong>One-time</strong> sources are created only for the selected month, useful for bonus-like income.</li><li>Default amount is optional. Empty default means the amount can be filled in from the monthly income row.</li></ul></div>
'@

  $incomeGridNeedle = '<div className="income-grid">'
  if ($content.Contains($incomeGridNeedle)) {
    $content = $content.Replace($incomeGridNeedle, $helpBox + $incomeGridNeedle)
    Write-Host "Added Manage sources help box."
  } else {
    Write-Host "Could not find income-grid insertion point; skipped help box."
  }
} else {
  Write-Host "Manage sources help box already present."
}

# 2) Improve placeholders.
$content = $content.Replace('placeholder="New source"', 'placeholder="New income source"')
$content = $content.Replace('placeholder="Default"', 'placeholder="Default amount"')

# 3) Improve one-time checkbox label wording where present.
$content = $content.Replace('>One-time</label>', '>One-time for selected month</label>')
$content = $content.Replace('> One-time</label>', '> One-time for selected month</label>')
$content = $content.Replace('One-time for selected month for selected month', 'One-time for selected month')

# 4) Improve Monthly incomes helper text.
$content = $content.Replace(
  'Tap an income row to edit it for this month.',
  "Tap an income row to edit this month's amount or inclusion."
)

# 5) Add a compact Edit income helper note after the existing notice.
if ($content -notmatch 'Recurring sources can be archived') {
  $noticeRegex = '<div className="notice"><strong>\{editingIncome\.person\.name\}</strong> / \{editingIncome\.incomeSource\.name\}\{editingIncome\.incomeSource\.isOneTime\?" / one-time":""\}</div>'
  $helperNote = @'
<div className="notice"><strong>{editingIncome.person.name}</strong> / {editingIncome.incomeSource.name}{editingIncome.incomeSource.isOneTime?" / one-time":""}</div><div className="muted">Recurring sources can be archived to hide them from future months. One-time sources can be removed from the selected month.</div>
'@
  $newContent = [regex]::Replace($content, $noticeRegex, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $helperNote }, 1)
  if ($newContent -ne $content) {
    $content = $newContent
    Write-Host "Added Edit income helper note."
  } else {
    Write-Host "Edit income notice pattern not found; skipped helper note."
  }
} else {
  Write-Host "Edit income helper note already present."
}

Set-Content $pagePath $content -Encoding UTF8
Write-Host "Patch 49 fixed page tweaks applied."
