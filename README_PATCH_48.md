# Patch 48 - Category colors in Review and expenses

Adds category color usage in the main app:

- Review `By category` summary displays a small color dot for each category.
- Recent expense cards use the category color as the left accent border.
- Expense cards show the category as a small colored pill.
- Desktop recent expenses table category cells show a category color dot.

No database schema change is required. Existing category colors from `/categories` are used.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-48.ps1
```
