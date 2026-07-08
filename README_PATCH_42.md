# Patch 42 - Auto-backup exact daily time

Fixes the automatic backup scheduler so `AUTO_DB_BACKUP_TIME=03:00` schedules the next run at the next exact Budapest-local `03:00:00`, instead of adding 24 hours to the previous run's actual execution timestamp.

Also changes startup backup behavior:

- No startup backup is created unless `AUTO_DB_BACKUP_STARTUP_DELAY_SECONDS` is explicitly set to a positive number.
- Remove `AUTO_DB_BACKUP_STARTUP_DELAY_SECONDS` from compose for production.
