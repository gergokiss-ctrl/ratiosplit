# Patch 40 - Copy auto-backup script into runner image

Fixes this runtime error:

```text
Error: Cannot find module '/app/scripts/auto-backup.mjs'
```

Root cause:

The Dockerfile starts `node scripts/auto-backup.mjs` in the final runtime image, but the `scripts` folder was not copied from the builder stage into the runner stage.

This patch updates the Dockerfile to include:

```dockerfile
COPY --from=builder /app/scripts ./scripts
```

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-40.ps1
```
