# Patch 39 - Robust Dockerfile auto-backup startup fix

This patch fixes the Dockerfile update issue by replacing the Dockerfile `CMD` line directly.

The final command becomes:

```dockerfile
CMD ["sh", "-c", "npx prisma db push && npx prisma generate && npm run prisma:seed && (node scripts/auto-backup.mjs &) && npm start"]
```

Recommended Unraid template / compose settings:

```yaml
environment:
  - AUTO_DB_BACKUP_ENABLED=true
  - AUTO_DB_BACKUP_DIR=/backups
  - AUTO_DB_BACKUP_TIME=03:00
  - AUTO_DB_BACKUP_RETENTION_DAYS=14
  - AUTO_DB_BACKUP_MAX_FILES=14
volumes:
  - ./data:/data
  - /mnt/user/appdata/ratiosplit/backups:/backups
```

Run from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-39.ps1
```
