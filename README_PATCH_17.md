# Patch 17 - Fix one-time income FK issue

This patch fixes the `Foreign key constraint violated` error when adding one-time income sources.

Root cause:

`MonthlyIncome.monthKey` accidentally referenced `Month.id` instead of `Month.monthKey` in Patch 16.

This patch fixes:

```prisma
month Month @relation(fields: [monthKey], references: [monthKey], onDelete: Cascade)
```

It also wraps one-time income source creation and monthly income row creation in a transaction.
