# Patch 60 - Year-grouped collapsible monthly overview

Replaces `app/months/page.tsx` with a year-grouped overview.

## Features

- Years descending, months descending within each year.
- Individual month cards can be expanded/collapsed.
- Per-year Expand months / Collapse months controls.
- Global Expand all / Collapse all controls.
- Month-card state persists in browser localStorage.
- Collapsed cards retain a compact income/tracked-expense summary.
- Empty months created only by navigation are hidden.
- A month remains visible when it has at least one non-deleted expense, or is settled, or is locked.
- Excluded expenses count as real month content.

No database records are deleted and month creation logic is unchanged.

## Apply

This ZIP is flat:

```powershell
Copy-Item -Path .\_patch\* -Destination . -Recurse -Force
```

No patch script is required because the complete monthly overview page is replaced.
