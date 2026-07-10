# Patch 59 - Monthly overview data-shape fix

Patch 58 displayed `0 month(s) found` because it assumed that `people`, `months`, `monthlyIncomes`, and `expenses` were directly at the root of `/api/backup/json`.

The actual export may wrap those arrays in one of these structures:

```text
{ data: { ... } }
{ backup: { data: { ... } } }
{ backup: { ... } }
```

Patch 59 normalizes those payload shapes before building the monthly overview. It also accepts `yearMonth` as a month key and additional numeric month fields.

No database or Prisma schema change is required.

## Apply

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-59.ps1
```

The script creates:

```text
app/months/page.tsx.patch59.bak
```

Remove that backup after a successful GitHub Actions build.
