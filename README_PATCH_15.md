# Patch 15 - Mobile month picker and modal positioning fix

This patch appends CSS overrides to `app/styles.css`.

It fixes:

- month picker overlapping with previous/next month buttons on mobile
- modal backdrop edge dragging / background movement improvements
- Review modal bottom action area spacing and sticky behavior

Apply after copying this patch into the repo:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-15.ps1
```
