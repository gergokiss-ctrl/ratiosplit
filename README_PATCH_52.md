# Patch 52 - Robust fix for income source JSX fragment

Patch 49 inserted this invalid JSX structure into `app/page.tsx`:

```tsx
const incomeSections=<div className="source-help">...</div><div className="income-grid">...</div>;const monthControls=...
```

Two adjacent JSX elements must be wrapped in a fragment. Patch 51 attempted this but searched for the wrong next declaration (`ratioControls`). In this compact file the next declaration is `monthControls`.

This patch converts it to:

```tsx
const incomeSections=<><div className="source-help">...</div><div className="income-grid">...</div></>;const monthControls=...
```

Do **not** apply Patch 50 if you want to keep the Patch 49 income source UX changes.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-52.ps1
```
