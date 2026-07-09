# Patch 55 - Remove broken income source help JSX block

Patch 49 attempted to add an income-source help box before the existing income-grid JSX. Because `app/page.tsx` is heavily minified/compact, the insertion created adjacent JSX elements and the follow-up fragment fixes could not reliably locate the end of `incomeSections`.

This patch takes the safer approach:

- removes only the broken `source-help` JSX block from `incomeSections`
- restores `incomeSections` to start directly with the known-good `income-grid` block
- keeps the working income source functionality intact
- does **not** remove recurring income support
- does **not** remove one-time income support
- does **not** apply the broader Patch 50 rollback

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-55.ps1
```

Then commit and push.
