# Patch 56 - CSV monthly report polish

Improves the monthly CSV export structure without changing the database schema.

## New report structure

- Month summary
- Settlement breakdown by person
- Final settlement text
- Expenses by category
- Income details
- Expense details

## Additional detail

- Category totals include each category's share of tracked expenses.
- Expense detail rows include the calculated HUF share for both people.
- Excluded expenses remain visible in the detailed list but are excluded from tracked/category totals.
- The route is backed up to `route.ts.patch56.bak` before the first modification.

## Apply

From the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-56.ps1
```
