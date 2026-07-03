# Patch 22 - Fix Docker npm install after npm ci failure

Patch 21 changed Dockerfile dependency install to `npm ci`, but this project currently does not have a `package-lock.json` file. `npm ci` requires a lockfile, so GitHub Actions fails with `EUSAGE`.

This patch keeps the npm retry/network settings, but switches back to:

```dockerfile
npm install --prefer-offline --no-audit --fund=false
```

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-22.ps1
```
