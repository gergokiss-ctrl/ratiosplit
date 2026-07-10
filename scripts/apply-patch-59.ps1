$ErrorActionPreference = "Stop"

$pagePath = "app/months/page.tsx"
if (!(Test-Path -LiteralPath $pagePath)) {
  throw "app/months/page.tsx not found. Apply Patch 58 first."
}

$content = Get-Content -LiteralPath $pagePath -Raw -Encoding UTF8
$backupPath = "$pagePath.patch59.bak"
if (!(Test-Path -LiteralPath $backupPath)) {
  Copy-Item -LiteralPath $pagePath -Destination $backupPath
  Write-Host "Created page backup: $backupPath"
}

# Patch 58 assumed the backup arrays were at the JSON root. The real backup export can
# wrap them in `data` or `backup.data`. Normalize those shapes before storing state.
$oldLoad = '      setPayload(await response.json());'
$newLoad = @'
      const raw = await response.json();
      const source = raw?.data ?? raw?.backup?.data ?? raw?.backup ?? raw;
      setPayload({
        people: Array.isArray(source?.people) ? source.people : [],
        months: Array.isArray(source?.months) ? source.months : [],
        monthlyIncomes: Array.isArray(source?.monthlyIncomes)
          ? source.monthlyIncomes
          : Array.isArray(source?.incomes)
            ? source.incomes
            : [],
        expenses: Array.isArray(source?.expenses) ? source.expenses : [],
      });
'@

if ($content.Contains($oldLoad)) {
  $content = $content.Replace($oldLoad, $newLoad.TrimEnd())
  Write-Host "Added backup JSON payload normalization."
} elseif ($content -match 'const source = raw\?\.data') {
  Write-Host "Backup JSON payload normalization already present."
} else {
  throw "Could not find the Patch 58 JSON load statement."
}

# Support additional month representations commonly used by the export.
$content = $content.Replace(
  '  const direct = value.monthKey ?? value.key ?? value.month;',
  '  const direct = value.monthKey ?? value.yearMonth ?? value.key ?? value.month;'
)
$content = $content.Replace(
  '  if (typeof value.year === "number" && typeof value.monthNumber === "number") {`n    return `${value.year}-${String(value.monthNumber).padStart(2, "0")}`;`n  }',
  '  const numericMonth = value.monthNumber ?? value.monthIndex ?? (typeof value.month === "number" ? value.month : null);`n  if (typeof value.year === "number" && typeof numericMonth === "number") {`n    return `${value.year}-${String(numericMonth).padStart(2, "0")}`;`n  }'
)

Set-Content -LiteralPath $pagePath -Value $content -Encoding UTF8

$check = Get-Content -LiteralPath $pagePath -Raw -Encoding UTF8
if ($check -notmatch 'raw\?\.data \?\? raw\?\.backup\?\.data') {
  throw "Consistency check failed: JSON payload normalization is missing."
}

Write-Host "Patch 59 applied and consistency checks passed."
Write-Host "After deployment, refresh /months."
