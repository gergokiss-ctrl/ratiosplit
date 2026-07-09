# Patch 49 fixed - Income source UX polish

This is a corrected version of Patch 49. The previous PowerShell script failed because JSX snippets and an apostrophe in `month's` were parsed incorrectly by PowerShell.

Changes:

- Adds a help box in Manage sources explaining recurring vs one-time income sources.
- Improves placeholders:
  - `New income source`
  - `Default amount`
- Changes `One-time` label to `One-time for selected month`.
- Improves the Monthly incomes helper text.
- Adds a small helper note to the Edit income modal.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-49-fixed.ps1
```
