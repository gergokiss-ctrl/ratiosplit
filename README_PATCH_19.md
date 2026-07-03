# Patch 19 - Income remove FK/query fix + direct source archive

Fixes:

- `monthlyIncome.findUnique()` error caused by requiring the `month` relation when older/bad rows reference a missing month relation.
- Adds a direct `Archive` button to each income source row in Manage sources.

Usage:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-19.ps1
```
