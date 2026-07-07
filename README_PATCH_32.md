# Patch 32 - Category order normalization

Improves category ordering:

- New categories are added at the end using `max(sortOrder) + 10`.
- Up / Down normalizes the visible categories to clean `10, 20, 30...` background order.
- Adds a `Normalize current order` helper button.
- Removes the technical sort order value from the visible card summary.

After copying files into the repo, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-32.ps1
```
