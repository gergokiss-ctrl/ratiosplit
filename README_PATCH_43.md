# Patch 43 - Monthly workflow polish

Adds:

- Quick `Add one-time income` button in Monthly incomes.
- New one-time income modal with person/name/amount.
- One-time income rows use clearer `One-time` label.
- Small `Month setup` status card on the home screen.
- New expense date defaults to the currently selected month instead of today's real month.

Example: if the selected month is June, opening `Add expense` now defaults the date to a June date, not July.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-43.ps1
```
