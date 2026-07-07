export default function RestoreInstructionsPage(){return <main className="shell"><header className="header"><div className="logo"><div className="logo-mark"/><div><h1 className="h-title">Restore & backup setup</h1><p className="h-sub">RatioSplit maintenance instructions for Unraid</p></div></div><div className="action-row"><a className="btn secondary" href="/">Back to RatioSplit</a><a className="btn secondary" href="/api/backup/auto-status">Auto-backup status</a></div></header><section className="main-layout"><div className="left-column"><div className="card"><h2 className="panel-title">Restore from DB backup</h2><p className="muted">Use the downloaded ratiosplit-*.db file for full restore.</p><pre style={{whiteSpace:"pre-wrap",overflow:"auto"}}>{`cd /mnt/user/appdata/ratiosplit

docker compose down
cp -a data "data-before-restore-$(date +%Y%m%d-%H%M%S)"
cp /mnt/user/appdata/ratiosplit/ratiosplit-restore.db /mnt/user/appdata/ratiosplit/data/ratiosplit.db
chmod 666 /mnt/user/appdata/ratiosplit/data/ratiosplit.db

docker compose up -d
docker logs -f ratiosplit-app`}</pre></div></div><div className="right-column"><div className="card"><h2 className="panel-title">Automatic DB backup</h2><pre style={{whiteSpace:"pre-wrap",overflow:"auto"}}>{`environment:
  - AUTO_DB_BACKUP_ENABLED=true
  - AUTO_DB_BACKUP_DIR=/backups
  - AUTO_DB_BACKUP_TIME=03:00
  - AUTO_DB_BACKUP_RETENTION_DAYS=14
  - AUTO_DB_BACKUP_MAX_FILES=14

volumes:
  - ./data:/data
  - /mnt/user/appdata/ratiosplit/backups:/backups`}</pre><p className="muted">Duplicati source folder:</p><pre style={{whiteSpace:"pre-wrap",overflow:"auto"}}>{`/mnt/user/appdata/ratiosplit/backups`}</pre></div></div></section></main>}
