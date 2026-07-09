# Patch 53 - Robust incomeSections JSX fix

Fixes the Patch 49 build error more robustly than Patch 51/52.

Root cause:

Patch 49 inserted a `source-help` JSX block directly before the existing `income-grid` JSX block:

```tsx
const incomeSections=<div className="source-help">...</div><div className="income-grid">...</div>;
```

Adjacent JSX elements must be wrapped in a fragment:

```tsx
const incomeSections=<><div className="source-help">...</div><div className="income-grid">...</div></>;
```

Patch 53 finds `const monthControls=` regardless of whether it is on the same line or the next line, then inserts the closing fragment before the semicolon that ends `incomeSections`.

Do **not** run Patch 50 if you want to keep the income source UX improvements.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-53.ps1
```
