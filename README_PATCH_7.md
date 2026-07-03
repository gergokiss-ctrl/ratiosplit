# Patch 7 – Review workflow

This patch updates `app/styles.css` and includes a PowerShell script that modifies the current `app/page.tsx` in-place to add a Month Review modal.

Run from the project root after copying this patch into the repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-review-patch.ps1
```

Then commit and push.
