# Patch 46 - Review and settlement transparency

Adds a clearer settlement explanation to the Review modal:

- New `Settlement breakdown` card
- Shows each person's:
  - Paid
  - Owed
  - Balance
- Shows final transfer text in the same card
- Adds a calculation note explaining:
  - tracked expenses are included
  - excluded expenses are ignored
  - ratio comes from included incomes unless manual override is enabled

No database schema change is required.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-46.ps1
```
