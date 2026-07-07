# Patch 36 - Restore instructions and automatic DB backup worker

Adds:

- `/restore` page with Unraid restore instructions
- optional automatic DB backup worker: `scripts/auto-backup.mjs`
- optional Dockerfile CMD update via `scripts/apply-patch-36.ps1`
- Settings modal link to `/restore` if the Settings pattern is found

## Enable automatic DB backups

Add environment variables and volume mapping to the RatioSplit service in Docker Compose:

```yaml
environment:
  - AUTO_DB_BACKUP_ENABLED=true
  - AUTO_DB_BACKUP_DIR=/backups/ratiosplit
  - AUTO_DB_BACKUP_INTERVAL_HOURS=24
  - AUTO_DB_BACKUP_RETENTION_DAYS=30
  - AUTO_DB_BACKUP_MAX_FILES=100

volumes:
  - ./data:/data
  - /mnt/user/appdata/ratiosplit-backups:/backups
```

Then point Duplicati at:

```text
/mnt/user/appdata/ratiosplit-backups
```

## Apply

After copying files into the repo, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-36.ps1
```
