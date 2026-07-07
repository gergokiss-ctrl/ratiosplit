# Patch 26 - Settings button fix + mobile month selector fix

Fixes:

- Settings button not appearing after Patch 25
- mobile month picker overlapping previous/next month buttons again

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-26.ps1
```

## Restore reminder

To restore the SQLite backup on Unraid:

1. Stop the container.
2. Backup the current `/mnt/user/appdata/ratiosplit/data` folder.
3. Copy the downloaded `.db` file to `/mnt/user/appdata/ratiosplit/data/ratiosplit.db`.
4. Start the container again.
