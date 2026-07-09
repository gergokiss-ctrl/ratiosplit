# Patch 51 - Fix income source JSX syntax

Fixes the build error introduced by Patch 49/49-fixed:

```text
./app/page.tsx
Error: Expected a semicolon
/app/app/page.tsx:17:1
```

Root cause:

Patch 49 inserted a `source-help` JSX block directly before the existing `income-grid` JSX block, creating two adjacent JSX elements in one assignment:

```tsx
const incomeSections=<div className="source-help">...</div><div className="income-grid">...</div>;
```

That is invalid JSX unless wrapped in a fragment.

This patch converts it to:

```tsx
const incomeSections=<><div className="source-help">...</div><div className="income-grid">...</div></>;
```

Do **not** apply Patch 50 if you want to keep the Patch 49 income source UX changes.

Apply from project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\apply-patch-51.ps1
```
