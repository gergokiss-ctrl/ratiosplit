# Patch 58 - Monthly overview page

Adds a standalone historical overview page:

```text
/months
```

The page derives its data from the existing JSON backup endpoint, so no database schema change or new Prisma query is required.

## Displays

- monthly total income
- income per person
- calculated income ratio
- tracked expenses
- excluded expenses
- expense count
- settled / locked status
- direct monthly CSV export

The full settlement remains in the existing Review modal, avoiding duplicated settlement business logic.

## Apply

This ZIP is flat:

```powershell
Copy-Item -Path .\_patch\* -Destination . -Recurse -Force
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-58.ps1
```

Then run a local build when available, or rely on GitHub Actions.
