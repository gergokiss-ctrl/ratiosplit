# Patch 47 - Compact help notes

This patch keeps the Review explanations, but hides them behind compact `?` help buttons so they do not take up permanent space.

Changes:

- Adds small circular `?` help buttons.
- Hides the Settlement breakdown explanation until the user clicks `?`.
- Hides the Final settlement calculation note until the user clicks `?`.
- Adds styling for reusable compact help notes.

No database schema change is required.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\\scripts\\apply-patch-47.ps1
```
