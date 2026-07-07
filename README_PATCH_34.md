# Patch 34 - Category permanent delete and new-category state memory

Adds:

- Permanent category deletion, but only for hidden categories.
- Permanent deletion is blocked if the category is used by any active expense.
- New category section expanded/collapsed state is saved in localStorage.
- Clearer deletion rules note on `/categories`.

No database schema change is required.
