# Patch 29 - Category management page

Adds a standalone category management page:

```text
/categories
```

Features:

- list categories
- create new category
- edit name, color, icon name, sort order, active status
- hide category without deleting existing expense history
- optional Settings modal link via script

After copying the patch files into the repo, optionally run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-29.ps1
```

If the Settings modal link is not inserted, the page still works directly at `/categories`.
