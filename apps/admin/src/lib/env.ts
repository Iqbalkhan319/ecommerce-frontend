export const serverEnv = {
  gatewayUrl: process.env.API_GATEWAY_URL ?? 'http://localhost:8000',
  sessionCookieName: `${process.env.SESSION_COOKIE_NAME ?? 'aurelia_session'}_admin`,
  cookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
  cookieDomain: process.env.SESSION_COOKIE_DOMAIN || undefined,
};

export const publicEnv = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? 'BD Shop',
  storefrontUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  currency: process.env.NEXT_PUBLIC_CURRENCY ?? 'BDT',
};

// NEXT_PUBLIC_* values are inlined at build time and must be referenced literally,
// so each one is spelled out rather than looked up dynamically.
function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Site identity. Set NEXT_PUBLIC_SITE_LOGO to swap the wordmark for an image. */
export const brand = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'BD Shop',
  logoSrc: process.env.NEXT_PUBLIC_SITE_LOGO ?? '',
  logoWidth: toInt(process.env.NEXT_PUBLIC_SITE_LOGO_WIDTH, 120),
  logoHeight: toInt(process.env.NEXT_PUBLIC_SITE_LOGO_HEIGHT, 32),
  logoWithName: process.env.NEXT_PUBLIC_SITE_LOGO_WITH_NAME === 'true',
};

/** Owner shown in the footer and on the sign-in page. No name renders nothing. */
export const owner = {
  name: process.env.NEXT_PUBLIC_OWNER_NAME ?? '',
  role: process.env.NEXT_PUBLIC_OWNER_ROLE ?? '',
  imageSrc: process.env.NEXT_PUBLIC_OWNER_IMAGE ?? '',
};
