# Patch 25 - Settings / Maintenance modal

Adds a Settings modal and exposes the backup endpoints from the UI.

Features:

- Settings button in the month header
- Backup health/status display
- Download SQLite DB backup
- Download JSON export
- Export current month CSV
- Security note about LAN/Tailscale-only usage

After copying this patch into the repo, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-25.ps1
```
