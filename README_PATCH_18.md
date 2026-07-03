# Patch 18 - Remove / clear monthly income rows

Adds:

- `Clear` button for monthly income rows: clears the amount only
- `Remove` button for one-time monthly income rows: deletes the monthly row and archives the backing one-time source
- API `DELETE /api/monthly-incomes/:id`

After copying the patch files into the repo, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-18.ps1
```
