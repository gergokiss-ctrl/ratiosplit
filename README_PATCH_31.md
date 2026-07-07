# Patch 31 - Safe seed script

Fixes the startup loop caused by:

```text
Unique constraint failed on the fields: (`name`)
```

Root cause:

The seed script tried to update an existing category to a name that already existed after categories became editable in the UI.

This patch replaces `prisma/seed.ts` with an idempotent, non-destructive seed script that:

- ensures Gergő and Judit exist
- ensures default categories exist by category name
- does not rename custom category rows into duplicate names
- preserves hidden/active category state
- ensures default Salary income sources exist without duplicating them
- ensures app settings exist

No database data is deleted.
