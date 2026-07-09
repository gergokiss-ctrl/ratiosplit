# Patch 44 - Remove Month setup and keep selected-month expense date

Changes:

- Removes the `Month setup` card from the home page.
- Keeps the selected-month-aware Add expense date behavior.
- Ensures `Add one-time income` button and modal are present next to `Manage sources`.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-44.ps1
```
