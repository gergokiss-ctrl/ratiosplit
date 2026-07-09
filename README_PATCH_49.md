# Patch 49 - Income source UX polish

This patch keeps the existing one-time income support in Manage sources, but makes the income source workflow clearer.

Changes:

- Adds a small help box in the Manage sources modal explaining:
  - recurring sources
  - one-time sources
  - optional default amount
- Improves placeholders:
  - `New income source`
  - `Default amount`
- Changes `One-time` label to `One-time for selected month`.
- Improves the Monthly incomes helper text.
- Adds a compact note to the Edit income modal about archive/remove behavior.

No database schema change is required.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-49.ps1
```
