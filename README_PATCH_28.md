# Patch 28 - Header month selector and button polish

This patch is a small UI polish pass for the main header.

Fixes:

- month picker height is aligned with the previous/next month buttons
- `<` and `>` month navigation characters are centered better
- desktop header keeps Review / Settings / Lock month aligned
- `Lock month` border color now matches the filled button color instead of appearing white
- mobile month picker overlap protection is kept

Apply from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-28.ps1
```
