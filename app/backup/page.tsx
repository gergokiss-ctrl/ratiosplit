"use client";

import { useEffect, useMemo, useState } from "react";

type AutoStatus = {
  ok: boolean;
  config?: {
    enabled?: boolean;
    databasePath?: string;
    backupDir?: string;
    backupDirMounted?: boolean;
    timeHHMM?: string | null;
    intervalHours?: string;
    retentionDays?: string;
    maxFiles?: string;
    statusFile?: string;
  };
  status?: {
    lastRunAtBudapest?: string;
    nextRunAtBudapest?: string;
    lastBackupFileName?: string;
    lastBackupSizeBytes?: number;
    lastRunReason?: string;
    lastError?: string | null;
  } | null;
  checkedAtBudapest?: string;
};

type AutoFiles = {
  ok: boolean;
  backupDir: string;
  exists: boolean;
  files: { name: string; path: string; sizeBytes: number; modifiedAtBudapest: string }[];
};

function size(bytes?: number) {
  if (!bytes && bytes !== 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function BackupDashboardPage() {
  const [status, setStatus] = useState<AutoStatus | null>(null);
  const [files, setFiles] = useState<AutoFiles | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setMessage("");
    try {
      const [statusRes, filesRes] = await Promise.all([
        fetch("/api/backup/auto-status"),
        fetch("/api/backup/auto-files"),
      ]);
      setStatus(await statusRes.json());
      setFiles(await filesRes.json());
    } catch {
      setMessage("Could not load backup status.");
    }
  }

  useEffect(() => { load(); }, []);

  const latestFiles = useMemo(() => files?.files ?? [], [files]);

  return (
    <main className="shell">
      <header className="header">
        <div className="logo">
          <div className="logo-mark" />
          <div>
            <h1 className="h-title">Backup dashboard</h1>
            <p className="h-sub">Automatic DB backup status and recent local backup files</p>
          </div>
        </div>
        <div className="action-row">
          <a className="btn secondary" href="/">Back to RatioSplit</a>
          <a className="btn secondary" href="/restore">Restore instructions</a>
          <button className="btn secondary" onClick={load}>Refresh</button>
        </div>
      </header>

      {message && <div className="notice" style={{ marginTop: 14 }}>{message}</div>}

      <section className="main-layout">
        <div className="left-column">
          <div className="card">
            <h2 className="panel-title">Automatic backup status</h2>
            <div className="summary-row"><span>Enabled</span><strong>{status?.config?.enabled ? "Yes" : "No"}</strong></div>
            <div className="summary-row"><span>Backup folder</span><strong>{status?.config?.backupDir ?? "-"}</strong></div>
            <div className="summary-row"><span>Folder mounted</span><strong>{status?.config?.backupDirMounted ? "Yes" : "No"}</strong></div>
            <div className="summary-row"><span>Daily time</span><strong>{status?.config?.timeHHMM ?? "Interval mode"}</strong></div>
            <div className="summary-row"><span>Retention</span><strong>{status?.config?.retentionDays ?? "-"} days / max {status?.config?.maxFiles ?? "-"} files</strong></div>
            <div className="summary-row"><span>Checked</span><strong>{status?.checkedAtBudapest ?? "-"}</strong></div>
          </div>

          <div className="card">
            <h2 className="panel-title">Last / next run</h2>
            <div className="summary-row"><span>Last run</span><strong>{status?.status?.lastRunAtBudapest ?? "Not yet"}</strong></div>
            <div className="summary-row"><span>Last reason</span><strong>{status?.status?.lastRunReason ?? "-"}</strong></div>
            <div className="summary-row"><span>Last file</span><strong>{status?.status?.lastBackupFileName ?? "-"}</strong></div>
            <div className="summary-row"><span>Last size</span><strong>{size(status?.status?.lastBackupSizeBytes)}</strong></div>
            <div className="summary-row"><span>Next run</span><strong>{status?.status?.nextRunAtBudapest ?? "-"}</strong></div>
            {status?.status?.lastError && <div className="notice" style={{ marginTop: 12 }}>{status.status.lastError}</div>}
          </div>
        </div>

        <div className="right-column">
          <div className="card">
            <h2 className="panel-title">Recent backup files</h2>
            <div className="muted" style={{ marginBottom: 12 }}>{latestFiles.length} file(s) in {files?.backupDir ?? "-"}</div>
            <div className="expense-list">
              {latestFiles.map((file) => (
                <div className="expense-item" key={file.name} style={{ cursor: "default" }}>
                  <div className="expense-item-header">
                    <div>
                      <div className="expense-title">{file.name}</div>
                      <div className="expense-meta">{file.modifiedAtBudapest}</div>
                    </div>
                    <strong>{size(file.sizeBytes)}</strong>
                  </div>
                </div>
              ))}
              {!latestFiles.length && <div className="muted">No automatic backup files found yet.</div>}
            </div>
          </div>

          <div className="card">
            <h2 className="panel-title">Manual downloads</h2>
            <div className="settings-actions">
              <a className="btn full" href="/api/backup/db">Download DB backup</a>
              <a className="btn secondary full" href="/api/backup/json">Download JSON export</a>
              <a className="btn secondary full" href="/api/backup/auto-status">Raw auto status</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
