# Patch 33 - Category page syntax fix

Fixes the build error caused by literal PowerShell `` `n `` text being inserted into `app/categories/page.tsx`.

This patch replaces `app/categories/page.tsx` with a clean, fully formatted version that includes:

- category minimize/expand behavior
- advanced options for color/icon
- Up/Down ordering with normalized sort order
- Normalize current order button

No database schema change is required.
