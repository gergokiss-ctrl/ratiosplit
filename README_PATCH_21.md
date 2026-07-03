# Patch 21 - More reliable npm install in Docker build

This patch changes the Dockerfile dependency installation from plain `npm install` to:

- npm retry settings
- `npm ci`
- `--prefer-offline`
- `--no-audit`
- `--fund=false`

Apply after copying the patch into the repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-21.ps1
```
