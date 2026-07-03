# Patch 14 - Review/mobile polish

After copying this patch into the repo, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-14.ps1
```

This script applies only small text changes to `app/page.tsx`:

- ratio display rounded to 1 decimal place
- duplicate lock/unlock success notice removed
- month input changed to native `type="month"`
- Review title shortened to reduce wrapping on mobile
- stronger body scroll lock while a modal is open
