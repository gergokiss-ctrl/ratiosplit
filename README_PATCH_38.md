# Patch 38 - Auto-backup scheduled time and status endpoint

Adds:

- `AUTO_DB_BACKUP_TIME=HH:MM` support, interpreted as Europe/Budapest local time.
- `/api/backup/auto-status` status endpoint.
- `status.json` in the backup folder with last/next backup information.
- Updated `/restore` instructions with `/mnt/user/appdata/ratiosplit/backups:/backups`.

Recommended compose settings:

```yaml
environment:
  - AUTO_DB_BACKUP_ENABLED=true
  - AUTO_DB_BACKUP_DIR=/backups/ratiosplit
  - AUTO_DB_BACKUP_TIME=03:00
  - AUTO_DB_BACKUP_RETENTION_DAYS=14
  - AUTO_DB_BACKUP_MAX_FILES=14
volumes:
  - ./data:/data
  - /mnt/user/appdata/ratiosplit/backups:/backups
```

Apply Dockerfile update:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-38.ps1
```
