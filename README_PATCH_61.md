# Patch 61 - Lazy month creation

Makes month-related GET endpoints read-only.

## Changes

- `GET /api/months/[monthKey]` returns a virtual OPEN month when no row exists.
- `GET /api/settlement/[monthKey]` uses `findUnique` instead of `upsert`.
- `GET /api/incomes/[monthKey]` no longer creates Month or MonthlyIncome rows.
- Missing enabled recurring income rows are represented as virtual rows.
- Editing a virtual income row creates the Month and MonthlyIncome at that moment.
- Expense writes, month PATCH operations, one-time source creation, locking, and settlement changes still create a real month when needed.

Existing empty month records are not deleted.

## Apply

The ZIP is flat. Copy its contents into the repository root, then build and deploy.
