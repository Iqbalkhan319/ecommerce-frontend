import { formatMoney } from '@ecom/ui';
import { delivery } from '@/lib/env';

/**
 * Progress towards free delivery.
 *
 * The threshold is configuration rather than a literal, because checkout charges what
 * the admin service is configured with: a hard-coded figure here would eventually
 * promise something the order total contradicts.
 */
export function FreeDeliveryNudge({ subtotal, currency }: { subtotal: string | number; currency?: string }) {
  const value = typeof subtotal === 'string' ? Number.parseFloat(subtotal) : subtotal;
  if (!Number.isFinite(value) || delivery.freeThreshold <= 0) return null;

  const remaining = delivery.freeThreshold - value;
  const earned = remaining <= 0;
  const progress = Math.min(100, Math.max(0, (value / delivery.freeThreshold) * 100));

  return (
    <div className="rounded-lg border border-line bg-surface-sunken/60 p-3">
      <p className="text-sm text-ink">
        {earned ? (
          <>
            <span className="font-medium text-positive">Free delivery earned.</span> No delivery charge on this order.
          </>
        ) : (
          <>
            Add <span className="font-semibold">{formatMoney(remaining, currency)}</span> more for free delivery.
          </>
        )}
      </p>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress towards free delivery"
      >
        <div
          className={earned ? 'h-full bg-positive transition-all' : 'h-full bg-accent transition-all'}
          style={{ width: `${progress}%` }}
        />
      </div>

      {!earned && (
        <p className="mt-1.5 text-2xs text-ink-muted">
          Delivery is {formatMoney(delivery.flatRate, currency)} on orders under{' '}
          {formatMoney(delivery.freeThreshold, currency)}.
        </p>
      )}
    </div>
  );
}
