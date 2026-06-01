# Sunflower Admin Web

Sunflower MVP management console for guesthouse operations. This is the active
React admin web app, not a stage skeleton.

## Current Scope

Implemented MVP operator paths:

- Admin activation, login, logout, password reset, and password change.
- Protected workspace with account/session recovery.
- Room list, create/edit, filter, and shelf-status operations.
- Price and inventory calendar with batch update support.
- Order list filters, detail drawer, reschedule, refund, after-sale approval or
  rejection, refund retry, check-in, check-out, and no-show operations.
- Business overview and backend health summary.

Production manual QA evidence is still tracked separately. Do not treat local
unit tests as proof that a real admin account, SMS, live orders, or live refund
operations have been validated.

## Stack

- React 18 + TypeScript + Vite
- TDesign React
- React Router
- TanStack Query
- Axios
- Vitest + Testing Library

## Runtime

- Local dev uses Vite proxy for `/api`.
- `VITE_API_PROXY_TARGET` can override the local backend target; default is
  `http://localhost:8080`.
- Production uses same-origin `/api`; host Nginx on ECS-1 proxies requests to
  the backend on ECS-2.

## Commands

```bash
npm install
npm run dev
```

```bash
npm run lint
npm run test
npm run build
```

Node.js `>= 20.19.0` and npm `>= 10` are required. This workspace has also used
Node `20.20.1`.

## Handoff References

- `docs/Admin-Web-MVP-QA.md`: automated and manual admin QA scope.
- `docs/Admin-Web-Manual-QA.json`: machine-readable manual QA ledger.
- `docs/Web-Admin-Plan.md`: admin web architecture and feature scope.
- `docs/MVP-Readiness.md`: current MVP readiness status and blockers.
