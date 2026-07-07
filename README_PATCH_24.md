# Patch 24 - Backup and JSON export endpoints

This patch adds backup/export endpoints without changing the UI.

## Endpoints

### SQLite database backup

```text
/api/backup/db
```

Downloads the SQLite database file, e.g.:

```text
ratiosplit-20260703-194500.db
```

### JSON data export

```text
/api/backup/json
```

Downloads a structured JSON export of the main app data.

### Backup health/status

```text
/api/backup/health
```

Returns basic database file information and record counts.

## Notes

- These endpoints are designed for private LAN/Tailscale usage.
- There is no authentication layer in RatioSplit yet, so do not expose this app publicly to the internet.
- The SQLite `.db` backup is the most complete backup format.
- The JSON export is useful for inspection, debugging, and future migration work.
