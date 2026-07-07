# Patch 37 - Fix Patch 36 PowerShell ampersand issue

Patch 36 failed in PowerShell because the replacement string contained an unescaped ampersand (`&`).

This patch provides a safer PowerShell script using a MatchEvaluator so the Dockerfile CMD can be updated to:

```dockerfile
CMD ["sh", "-c", "node scripts/auto-backup.mjs & npm start"]
```

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-37.ps1
```
