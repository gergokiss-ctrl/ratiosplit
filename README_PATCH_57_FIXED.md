# Patch 57 fixed - Component stabilization, phase 1

The first Patch 57 script failed before changing `app/page.tsx` because PowerShell does not use backslashes to escape quotes in strings. The `@/components/...` imports were therefore parsed as invalid PowerShell tokens.

This corrected package:

- uses PowerShell literal here-strings for JSX/TypeScript snippets;
- extracts category visual helpers into `components/ui/CategoryVisuals.tsx`;
- extracts compact help notes into `components/ui/HelpToggle.tsx`;
- creates `app/page.tsx.patch57.bak` before modifying the page;
- performs consistency checks after modification.

The ZIP is flat: copy `_patch\*` directly into the repository root.

## Apply

```powershell
Copy-Item -Path .\_patch\* -Destination . -Recurse -Force
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-57-fixed.ps1
npm run build
```
