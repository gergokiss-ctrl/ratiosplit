# Patch 41 - Backup dashboard page

Adds a user-friendly backup dashboard:

```text
/backup
```

Features:

- automatic backup status
- last backup time
- next scheduled backup time
- latest backup file name and size
- recent local automatic backup files
- manual DB / JSON export links
- raw auto-status link

Also adds:

```text
/api/backup/auto-files
```

to list automatic backup files in `AUTO_DB_BACKUP_DIR`.

After copying files, optionally run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-41.ps1
```

to add a Backup dashboard link to Settings.
