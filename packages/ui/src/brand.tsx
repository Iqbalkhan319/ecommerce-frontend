import * as React from 'react';
import { cn } from './utils';

/**
 * Brand and ownership marks.
 *
 * Both are presentational and take every value as a prop: this package stays free of
 * `next` and of environment access, so the applications decide what is configured and
 * this file only decides how it looks. A plain <img> is deliberate - these are small,
 * fixed-size assets where the optimiser earns nothing and width/height already prevent
 * layout shift.
 */

export interface BrandIdentity {
  /** Site name. Doubles as the logo's accessible name. */
  name: string;
  /** Logo path or absolute URL. Empty falls back to the wordmark. */
  logoSrc?: string;
  logoWidth?: number;
  logoHeight?: number;
  /** Show the wordmark beside the logo. Suits an icon-only mark. */
  logoWithName?: boolean;
}

export function BrandMark({
  identity,
  className,
  textClassName = 'font-display text-lg text-ink',
  logoClassName,
  adornment,
}: {
  identity: BrandIdentity;
  className?: string;
  /** Typography for the wordmark, so each surface keeps its own scale. */
  textClassName?: string;
  logoClassName?: string;
  /** Trailing element - the storefront's accent dot, the console's "Admin" label. */
  adornment?: React.ReactNode;
}) {
  const { name, logoSrc, logoWidth = 120, logoHeight = 32, logoWithName = false } = identity;
  const showName = !logoSrc || logoWithName;

  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      {logoSrc && (
        <img
          src={logoSrc}
          // Redundant when the wordmark is also rendered, so it is decorative there.
          alt={showName ? '' : name}
          aria-hidden={showName || undefined}
          width={logoWidth}
          height={logoHeight}
          className={cn('w-auto self-center object-contain', logoClassName ?? 'h-8')}
        />
      )}
      {showName && <span className={textClassName}>{name}</span>}
      {adornment}
    </span>
  );
}

export interface OwnerIdentity {
  name: string;
  role?: string;
  imageSrc?: string;
}

const AVATAR_SIZES = {
  sm: { box: 'h-9 w-9', px: 36, text: 'text-2xs' },
  md: { box: 'h-11 w-11', px: 44, text: 'text-xs' },
  lg: { box: 'h-14 w-14', px: 56, text: 'text-sm' },
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZES;

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Round portrait with an initials fallback, so an unconfigured image never breaks. */
export function OwnerAvatar({
  owner,
  size = 'sm',
  decorative = false,
  loading = 'lazy',
  className,
}: {
  owner: OwnerIdentity;
  size?: AvatarSize;
  /** True when the name is rendered alongside, making the image redundant. */
  decorative?: boolean;
  loading?: 'lazy' | 'eager';
  className?: string;
}) {
  const spec = AVATAR_SIZES[size];
  const shell = cn(
    spec.box,
    'shrink-0 overflow-hidden rounded-full border border-line bg-surface-sunken',
    className,
  );

  if (!owner.imageSrc) {
    return (
      <span
        className={cn(shell, 'grid place-items-center font-semibold text-ink-muted', spec.text)}
        aria-hidden={decorative || undefined}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : owner.name}
      >
        {initialsOf(owner.name)}
      </span>
    );
  }

  return (
    <img
      src={owner.imageSrc}
      alt={decorative ? '' : owner.name}
      aria-hidden={decorative || undefined}
      width={spec.px}
      height={spec.px}
      loading={loading}
      decoding="async"
      className={cn(shell, 'object-cover')}
    />
  );
}

/**
 * Portrait plus name and role. Renders nothing without a name, so the surfaces that
 * host it stay clean until it is configured.
 */
export function OwnerBadge({
  owner,
  size = 'sm',
  orientation = 'horizontal',
  loading,
  className,
}: {
  owner: OwnerIdentity;
  size?: AvatarSize;
  orientation?: 'horizontal' | 'vertical';
  loading?: 'lazy' | 'eager';
  className?: string;
}) {
  if (!owner.name) return null;
  const vertical = orientation === 'vertical';

  return (
    <div
      className={cn(
        'flex gap-3',
        vertical ? 'flex-col items-center text-center' : 'items-center',
        className,
      )}
    >
      <OwnerAvatar owner={owner} size={size} decorative loading={loading} />
      <div className={cn('min-w-0', vertical && 'space-y-0.5')}>
        <p className="truncate text-sm font-medium text-ink">{owner.name}</p>
        {owner.role && (
          <p className="truncate text-2xs uppercase tracking-[0.14em] text-ink-muted">{owner.role}</p>
        )}
      </div>
    </div>
  );
}
