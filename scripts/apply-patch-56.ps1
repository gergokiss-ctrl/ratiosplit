$ErrorActionPreference = "Stop"

$routePath = "app/api/export/[monthKey]/route.ts"
if (!(Test-Path -LiteralPath $routePath)) {
  throw "CSV export route not found: $routePath"
}

$content = Get-Content -LiteralPath $routePath -Raw -Encoding UTF8
$backupPath = "$routePath.patch56.bak"
if (!(Test-Path -LiteralPath $backupPath)) {
  Copy-Item -LiteralPath $routePath -Destination $backupPath
  Write-Host "Created route backup: $backupPath"
}

if ($content -match 'Expenses by category') {
  Write-Host "Patch 56 already appears to be applied."
  exit 0
}

# Add a category summary calculation before CSV rows are assembled.
$rowsNeedle = '  const rows: string[] = [];'
$categoryCalculation = @'
  const categoriesById = new Map<string, { name: string; amountHufMinor: number }>();
  for (const expense of expenses) {
    if (expense.splitType === "EXCLUDED") continue;
    const key = expense.category?.id ?? "NO_CATEGORY";
    const name = expense.category?.name ?? "No category";
    const existing = categoriesById.get(key);
    if (existing) existing.amountHufMinor += expense.amountHufMinor;
    else categoriesById.set(key, { name, amountHufMinor: expense.amountHufMinor });
  }
  const categorySummary = [...categoriesById.values()].sort((a, b) => b.amountHufMinor - a.amountHufMinor);

  const rows: string[] = [];
'@

if ($content.Contains($rowsNeedle)) {
  $content = $content.Replace($rowsNeedle, $categoryCalculation.TrimEnd())
  Write-Host "Added category summary calculation."
} else {
  throw "Could not find CSV rows initialization in export route."
}

# Rename the first summary section to make the report structure clearer.
$content = $content.Replace('rows.push(csvRow(["Summary"]));', 'rows.push(csvRow(["Month summary"]));')
$content = $content.Replace('rows.push(csvRow(["Person", "Paid HUF", "Owed HUF", "Balance HUF", "Ratio"]));', 'rows.push(csvRow(["Person", "Paid HUF", "Owed HUF", "Balance HUF", "Income ratio"]));')
$content = $content.Replace('rows.push(csvRow(["Tracked expenses", (trackedTotal / 100).toFixed(2)]));', 'rows.push(csvRow(["Tracked expenses HUF", (trackedTotal / 100).toFixed(2)]));')
$content = $content.Replace('rows.push(csvRow(["Excluded expenses", (excludedTotal / 100).toFixed(2)]));', 'rows.push(csvRow(["Excluded expenses HUF", (excludedTotal / 100).toFixed(2)]));')
$content = $content.Replace('rows.push(csvRow(["Settlement", settlementText(people, settlementAmount, direction)]));', 'rows.push(csvRow(["Final settlement", settlementText(people, settlementAmount, direction)]));')

# Insert a dedicated Expenses by category block between month summary and incomes.
$incomeNeedle = @'
  rows.push("");
  rows.push(csvRow(["Incomes"]));
'@
$categoryBlock = @'
  rows.push("");
  rows.push(csvRow(["Expenses by category"]));
  rows.push(csvRow(["Category", "Amount HUF", "Share of tracked expenses"]));
  for (const category of categorySummary) {
    const share = trackedTotal > 0 ? `${((category.amountHufMinor / trackedTotal) * 100).toFixed(1)}%` : "0.0%";
    rows.push(csvRow([category.name, (category.amountHufMinor / 100).toFixed(2), share]));
  }
  if (!categorySummary.length) rows.push(csvRow(["No tracked expenses", "0.00", "0.0%"]));

  rows.push("");
  rows.push(csvRow(["Income details"]));
'@

if ($content.Contains($incomeNeedle.Trim())) {
  $content = $content.Replace($incomeNeedle.Trim(), $categoryBlock.Trim())
  Write-Host "Added Expenses by category report section."
} else {
  throw "Could not find Incomes section marker in export route."
}

# Clarify the detailed expense section and add HUF shares for auditability.
$content = $content.Replace('rows.push(csvRow(["Expenses"]));', 'rows.push(csvRow(["Expense details"]));')
$content = $content.Replace(
  'rows.push(csvRow(["Date", "Description", "Original amount", "Currency", "HUF value", "Paid by", "Split", "Category"]));',
  'rows.push(csvRow(["Date", "Description", "Original amount", "Currency", "HUF value", "Paid by", "Split", "Category", people[0].name + " share HUF", people[1].name + " share HUF"]));'
)

$oldExpenseLoop = '  for (const expense of expenses) rows.push(csvRow([formatDate(expense.date), expense.description, (expense.amountOriginalMinor / 100).toFixed(2), expense.currency, (expense.amountHufMinor / 100).toFixed(2), expense.paidByPerson.name, expense.splitType, expense.category?.name ?? ""]));'
$newExpenseLoop = @'
  for (const expense of expenses) {
    const shares = expenseShares(expense, people, ratios);
    rows.push(csvRow([
      formatDate(expense.date),
      expense.description,
      (expense.amountOriginalMinor / 100).toFixed(2),
      expense.currency,
      (expense.amountHufMinor / 100).toFixed(2),
      expense.paidByPerson.name,
      expense.splitType,
      expense.category?.name ?? "",
      ((shares[people[0].id] ?? 0) / 100).toFixed(2),
      ((shares[people[1].id] ?? 0) / 100).toFixed(2),
    ]));
  }
'@

if ($content.Contains($oldExpenseLoop)) {
  $content = $content.Replace($oldExpenseLoop, $newExpenseLoop.TrimEnd())
  Write-Host "Added per-person expense shares to detailed export."
} else {
  Write-Host "Detailed expense loop pattern not found; category summary changes were still applied."
}

Set-Content -LiteralPath $routePath -Value $content -Encoding UTF8

# Basic consistency checks before finishing.
$check = Get-Content -LiteralPath $routePath -Raw -Encoding UTF8
$required = @(
  'Expenses by category',
  'Month summary',
  'Final settlement',
  'Income details',
  'Expense details'
)
foreach ($text in $required) {
  if ($check -notmatch [regex]::Escape($text)) {
    throw "Patch consistency check failed. Missing: $text"
  }
}

Write-Host "Patch 56 applied and consistency checks passed."
