# Brand assets

Served from the site root, so `owner.jpg` here is `/brand/owner.jpg` in a URL.

- `owner.jpg` — owner portrait. Square crop, 320x320 or larger; renders at 36–56px
  in the footer and on the sign-in page. Set `NEXT_PUBLIC_OWNER_IMAGE=/brand/owner.jpg`.
- `logo.svg` (or `.png`) — site logo. Set `NEXT_PUBLIC_SITE_LOGO=/brand/logo.svg`
  plus `NEXT_PUBLIC_SITE_LOGO_WIDTH` / `_HEIGHT` to the asset's real pixel size.

Each Next application serves its own `public/` directory, so the same files must
exist under `apps/admin/public/brand/` as well.
