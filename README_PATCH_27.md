# Patch 27 - Locale, timestamps, CSV export, and desktop header fix

Fixes:

- Settings `Checked` date/time uses Hungarian formatting and Europe/Budapest timezone.
- Backup filenames use Europe/Budapest timestamp instead of UTC.
- CSV export summary uses actual person names from DB (`Gergő`, `Judit`) and human-readable settlement text.
- CSV export settlement is recalculated consistently with income/manual ratio logic.
- Desktop header/month controls layout is widened to prevent Lock month from dropping under the previous-month button.

After copying this patch into the repo, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-27.ps1
```
