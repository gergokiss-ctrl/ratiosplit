# Patch 23 - One-time add FK fix + checkbox polish + recurring remove

Fixes:

- one-time income add foreign key errors in DBs affected by the earlier bad FK migration
- oversized checkbox in the Edit income modal
- adds `Remove from month` to recurring income rows too

Notes:

- If a recurring source is still enabled and not archived, deleting the monthly row can be recreated by the auto-generation logic.
- If the recurring source is archived/disabled, `Remove from month` deletes that monthly row and it should stay gone.
