$ErrorActionPreference = "Stop"
$pagePath = "app/page.tsx"
if (!(Test-Path $pagePath)) { throw "app/page.tsx not found." }
$content = Get-Content $pagePath -Raw -Encoding UTF8
if ($content -notmatch 'href="/categories"' -and $content -match 'Export current month CSV') {
  $content = $content.Replace('<a className="btn secondary full" href={`/api/export/${month}`}>Export current month CSV</a>', '<a className="btn secondary full" href={`/api/export/${month}`}>Export current month CSV</a><a className="btn secondary full" href="/categories">Manage categories</a>')
  Set-Content $pagePath $content -Encoding UTF8
  Write-Host "Settings modal link to /categories added."
} elseif ($content -match 'href="/categories"') {
  Write-Host "Settings modal already links to /categories."
} else {
  Write-Host "Settings modal pattern not found. You can still open /categories directly."
}
