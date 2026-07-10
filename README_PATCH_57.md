# Patch 57 - Component stabilization, phase 1

This is a deliberately conservative refactor. It does **not** change the database, API behavior, calculations, or visible workflow.

## Extracted reusable components

- `components/ui/CategoryVisuals.tsx`
  - `CategoryDot`
  - `CategoryLabel`
- `components/ui/HelpToggle.tsx`
  - reusable compact `?` help-note UI

## Main page changes

The patch replaces repeated inline JSX for:

- category color labels and pills
- Review help toggles

The main page still owns all existing state and business logic. This limits regression risk while starting to reduce the most fragile repeated JSX.

## Safety

Before changing `app/page.tsx`, the script creates:

```text
app/page.tsx.patch57.bak
```

A restore script is included:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\restore-patch-57.ps1
```

## Apply

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-57.ps1
npm run build
```

Do not commit `app/page.tsx.patch57.bak`; remove it after a successful local build.
