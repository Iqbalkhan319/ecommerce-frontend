# Aurelia commerce platform — frontend

Two Next.js applications in one workspace: the customer storefront and the operations
console. They share a design system, a typed API client and the API contract types, but
they are separate applications with separate sessions, separate cookies and separate
container images.

Neither application talks to the platform from the browser. Each Next.js server acts as a
backend-for-frontend: it holds the tokens in `HttpOnly` cookies and calls the API gateway
server side. **No token ever reaches the browser, and nothing sensitive is stored in
`localStorage`.**

## Contents

- [Layout](#layout)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Design system](#design-system)
- [Authentication](#authentication)
- [Testing](#testing)
- [Docker](#docker)
- [Accessibility](#accessibility)
- [Deployment](#deployment)

## Layout

```
frontend/
├── apps/
│   ├── public/      Storefront — port 3000
│   └── admin/       Operations console — port 3100
├── packages/
│   ├── ui/          Design system: buttons, forms, dialogs, tables, toasts
│   ├── types/       API contract types shared by both applications
│   ├── api-client/  Typed fetch client with envelope handling and ApiError
│   └── config/      Tailwind preset and shared TypeScript configuration
└── docker-compose.yml
```

### Storefront

Home, catalogue with search/filter/sort, product detail with structured data, basket,
checkout, sign-in and registration, account overview, order history, order detail, invoice
download, saved addresses and password change. SEO covers per-page metadata, Open Graph,
`sitemap.xml`, `robots.txt` and `Product` JSON-LD.

### Operations console

Dashboard, orders with confirm/reject/advance, products with audited stock adjustment,
categories, customers, administrators, roles and permissions, audit trail and personal
settings. Navigation and controls are permission-aware.

## Prerequisites

Node.js 22 or later, and a running backend gateway (see the backend repository).

## Local development

```bash
cp .env.example .env
npm install
npm run dev          # storefront on http://localhost:3000
npm run dev:admin    # console on http://localhost:3100
```

The two applications are independent of the backend Compose project. They only need
`API_GATEWAY_URL` to point at a reachable gateway — local, staging or production.

## Environment variables

| Variable | Reaches the browser? | Purpose |
|---|---|---|
| `API_GATEWAY_URL` | No | Where the Next.js server reaches Kong |
| `SESSION_COOKIE_NAME` | No | Base cookie name; the console appends `_admin` |
| `SESSION_COOKIE_SECURE` | No | Set `true` behind HTTPS |
| `NEXT_PUBLIC_SITE_NAME` | Yes | Display name |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical URL for metadata and the sitemap |
| `NEXT_PUBLIC_CURRENCY` | Yes | Display currency |

Anything prefixed `NEXT_PUBLIC_` is inlined into the client bundle and is therefore public.
No credential, key or password may ever be given that prefix.

## Design system

An independent visual identity: warm paper, deep ink, one pine-green accent and brass for
small highlights, with a serif display face against a system sans. It shares nothing with
BRAC's palette, typography or layout, and it is not a Bootstrap dashboard.

Tokens are CSS custom properties, so light and dark themes swap without rewriting classes.
The storefront offers a theme toggle that is applied before first paint, so the page never
flashes the wrong theme.

Components: `Button`, `IconButton`, `Field`, `Input`, `Textarea`, `Select`, `Checkbox`,
`Card`, `Badge`, `OrderStatusBadge`, `StockBadge`, `Alert`, `Skeleton`, `EmptyState`,
`ErrorState`, `TableShell`, `Pagination`, `Dialog`, `ConfirmDialog` and a toast provider.

Every list has a loading skeleton, an empty state and an error state. Every destructive
action goes through `ConfirmDialog` — never a bare click handler.

## Authentication

Sign-in is a Server Action. The response tokens are written to `HttpOnly`, `SameSite=Lax`
cookies scoped to that application; the access token is refreshed transparently when it is
within 45 seconds of expiry. Server Actions carry Next.js's origin check, which covers CSRF
for state-changing requests.

The invoice download is a route handler that streams the PDF through the server, because
the browser has no token to call the gateway with. Authorisation is still enforced by the
backend against the customer id inside the token.

## Testing

```bash
npm test         # both applications
npm run typecheck
npm run lint
npm run build
```

Component tests cover accessible labelling and error announcement, disabled/busy button
states, confirmation dialogs (including Escape to dismiss), status and stock badges and
money formatting. Client tests cover envelope unwrapping, page metadata preservation,
typed errors with field-level messages, network failure handling and header propagation.
Console tests cover permission gating and list-parameter parsing, including the page-size
cap.

## Docker

```bash
docker compose up -d --build
```

Both images use Next.js standalone output, run as the non-root `node` user and expose a
`/api/health` endpoint that reports degraded when the gateway is unreachable — a storefront
that cannot reach the catalogue is not healthy just because the process is running.

The console publishes on `127.0.0.1` only. This Compose project never joins a backend
network and never depends on a backend container.

## Accessibility

Skip links, a visible focus ring on every interactive element, labels tied to controls with
`aria-describedby` for hints and errors, `role="alert"` on validation messages, `aria-live`
toasts, dialogs with focus trapping and focus restoration, `aria-current` on active
navigation, semantic tables with captions, and `prefers-reduced-motion` respected.

Tables scroll inside their own container so the page never scrolls sideways on a phone.

## Deployment

`npm run build` produces standalone output for both applications. Set
`SESSION_COOKIE_SECURE=true` behind HTTPS, point `API_GATEWAY_URL` at the production
gateway, and set `NEXT_PUBLIC_SITE_URL` to the canonical origin so metadata and the sitemap
are correct.
# ecommerce-frontend
