'use client';

import * as React from 'react';
import { useActionState } from 'react';
import { Badge, Button, Dialog, Field, Input, Select, Textarea, formatDate, formatMoney, useToast } from '@ecom/ui';
import { recordStockMovementAction, updateStockSettingsAction } from '@/lib/actions/inventory';
import { initialFormState } from '@/lib/form-state';
import type { MovementReasonOption, StockLevel, StockMovement } from '@ecom/types';

const REASON_HINT: Record<string, string> = {
  RESTOCK: 'Units arriving from a supplier.',
  RETURN: 'A customer returned goods in resaleable condition.',
  DAMAGE: 'Units written off as damaged.',
  LOSS: 'Shrinkage, or units that cannot be accounted for.',
  CORRECTION: 'A physical count that disagrees with the recorded level.',
};

const REMOVING_REASONS = ['DAMAGE', 'LOSS'];

function MovementForm({
  level,
  reasons,
  onDone,
}: {
  level: StockLevel;
  reasons: MovementReasonOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(recordStockMovementAction, initialFormState);
  const [reason, setReason] = React.useState(reasons[0]?.code ?? 'RESTOCK');
  const [mode, setMode] = React.useState<'delta' | 'count'>('delta');
  const [quantity, setQuantity] = React.useState('');
  const toast = useToast();

  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? 'Recorded.');
      onDone();
    } else if (state.status === 'error' && state.message) {
      toast.error('Not recorded', state.message);
    }
  }, [state, toast, onDone]);

  // A correction is the only reason where an absolute count makes sense; the others are
  // always a movement of a known number of units.
  const countAllowed = reason === 'CORRECTION';
  const removes = REMOVING_REASONS.includes(reason);
  const parsed = Number(quantity);
  const projected =
    quantity === '' || !Number.isFinite(parsed)
      ? null
      : mode === 'count'
        ? Math.max(parsed, 0)
        : level.stockQuantity + (removes ? -Math.abs(parsed) : Math.abs(parsed));

  React.useEffect(() => {
    if (!countAllowed) setMode('delta');
  }, [countAllowed]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={level.productId} />
      <input type="hidden" name="mode" value={mode} />

      <div className="rounded-lg border border-line bg-surface-sunken px-4 py-3">
        <p className="text-sm font-medium text-ink">{level.name}</p>
        <p className="mt-0.5 text-xs text-ink-muted">
          {level.sku} · {level.stockQuantity} on hand · warns at {level.lowStockThreshold}
        </p>
      </div>

      <Field label="Reason" htmlFor="reason" required hint={REASON_HINT[reason]}>
        <Select id="reason" name="reason" value={reason} onChange={(event) => setReason(event.target.value as typeof reason)}>
          {reasons.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      {countAllowed && (
        <fieldset>
          <legend className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">How are you entering it?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                { value: 'delta', label: 'Change by' },
                { value: 'count', label: 'Counted total' },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  mode === option.value
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-line text-ink-soft hover:bg-surface-sunken'
                }`}
              >
                <input
                  type="radio"
                  name="entryMode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="sr-only"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <Field
        label={mode === 'count' ? 'Counted total on the shelf' : removes ? 'Units to remove' : 'Units to add'}
        htmlFor="quantity"
        required
        error={state.fieldErrors?.quantity}
        hint={
          projected === null
            ? undefined
            : `Stock will become ${projected}${projected <= level.lowStockThreshold ? ' — at or below the low stock threshold' : ''}`
        }
      >
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={mode === 'count' ? 0 : 1}
          step={1}
          inputMode="numeric"
          required
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
      </Field>

      <Field label="Note" htmlFor="note" hint="Recorded against the movement and the audit trail">
        <Textarea id="note" name="note" rows={2} maxLength={240} />
      </Field>

      {projected !== null && projected < 0 && (
        <p role="alert" className="text-sm text-critical">
          That would take the stock below zero. Reduce the quantity.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={pending} disabled={projected !== null && projected < 0}>
          Record movement
        </Button>
      </div>
    </form>
  );
}

function SettingsForm({ level, onDone }: { level: StockLevel; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateStockSettingsAction, initialFormState);
  const toast = useToast();

  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? 'Saved.');
      onDone();
    } else if (state.status === 'error' && state.message) {
      toast.error('Not saved', state.message);
    }
  }, [state, toast, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={level.productId} />

      <Field
        label="Low stock threshold"
        htmlFor="lowStockThreshold"
        hint="The level at or below which this product is reported as running low. Zero means warn only when it is gone."
      >
        <Input
          id="lowStockThreshold"
          name="lowStockThreshold"
          type="number"
          min={0}
          step={1}
          defaultValue={level.lowStockThreshold}
        />
      </Field>

      <Field
        label="Unit cost"
        htmlFor="costPrice"
        hint="Used for inventory valuation and margin reporting. Without it, this product is excluded from cost figures."
      >
        <Input
          id="costPrice"
          name="costPrice"
          type="number"
          min={0}
          step="0.01"
          defaultValue={level.costPrice ?? ''}
          placeholder={`Sells for ${level.price}`}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          Save settings
        </Button>
      </div>
    </form>
  );
}

function MovementHistory({ movements }: { movements: StockMovement[] }) {
  if (movements.length === 0) {
    return <p className="text-sm text-ink-muted">No movements have been recorded for this product yet.</p>;
  }

  return (
    <ol className="divide-y divide-line">
      {movements.map((movement) => (
        <li key={movement.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3">
          <span
            className={`w-14 shrink-0 font-mono text-sm font-semibold ${
              movement.delta > 0 ? 'text-positive' : 'text-critical'
            }`}
          >
            {movement.delta > 0 ? '+' : ''}
            {movement.delta}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm text-ink">
              <MovementReasonBadge reason={movement.reason} />{' '}
              <span className="text-ink-muted">
                {movement.quantityBefore} → {movement.quantityAfter}
              </span>
            </span>
            {(movement.note || movement.orderNumber) && (
              <span className="mt-0.5 block text-xs text-ink-muted">
                {movement.orderNumber && <span className="font-mono">{movement.orderNumber}</span>}
                {movement.orderNumber && movement.note ? ' · ' : ''}
                {movement.note}
              </span>
            )}
          </span>
          <span className="text-xs text-ink-muted">
            {formatDate(movement.createdAt)}
            {movement.actorEmail ? ` · ${movement.actorEmail}` : ''}
          </span>
        </li>
      ))}
    </ol>
  );
}

const REASON_TONE: Record<string, 'positive' | 'critical' | 'caution' | 'info' | 'neutral' | 'accent'> = {
  INITIAL: 'neutral',
  SALE: 'info',
  RELEASE: 'accent',
  RESTOCK: 'positive',
  RETURN: 'positive',
  DAMAGE: 'critical',
  LOSS: 'critical',
  CORRECTION: 'caution',
};

const REASON_LABEL: Record<string, string> = {
  INITIAL: 'Opening',
  SALE: 'Sold',
  RELEASE: 'Released',
  RESTOCK: 'Restocked',
  RETURN: 'Returned',
  DAMAGE: 'Damaged',
  LOSS: 'Lost',
  CORRECTION: 'Corrected',
};

export function MovementReasonBadge({ reason }: { reason: string }) {
  return <Badge tone={REASON_TONE[reason] ?? 'neutral'}>{REASON_LABEL[reason] ?? reason.toLowerCase()}</Badge>;
}

export function StockRowActions({
  level,
  reasons,
  canAdjust,
}: {
  level: StockLevel;
  reasons: MovementReasonOption[];
  canAdjust: boolean;
}) {
  const [open, setOpen] = React.useState<'movement' | 'settings' | 'history' | null>(null);
  const [movements, setMovements] = React.useState<StockMovement[] | null>(null);
  const [loadError, setLoadError] = React.useState(false);

  async function openHistory() {
    setOpen('history');
    setMovements(null);
    setLoadError(false);
    try {
      const response = await fetch(`/inventory/${level.productId}/movements`, { cache: 'no-store' });
      if (!response.ok) throw new Error('failed');
      setMovements((await response.json()) as StockMovement[]);
    } catch {
      setLoadError(true);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <Button size="sm" variant="ghost" onClick={openHistory}>
        History
      </Button>
      {canAdjust && (
        <>
          <Button size="sm" variant="ghost" onClick={() => setOpen('settings')}>
            Settings
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setOpen('movement')}>
            Move stock
          </Button>
        </>
      )}

      <Dialog
        open={open === 'movement'}
        onClose={() => setOpen(null)}
        title="Record a stock movement"
        description="Every movement is appended to the ledger with its reason, the level before and after, and who recorded it."
      >
        <MovementForm level={level} reasons={reasons} onDone={() => setOpen(null)} />
      </Dialog>

      <Dialog
        open={open === 'settings'}
        onClose={() => setOpen(null)}
        title="Stock settings"
        description={level.name}
      >
        <SettingsForm level={level} onDone={() => setOpen(null)} />
      </Dialog>

      <Dialog
        open={open === 'history'}
        onClose={() => setOpen(null)}
        title="Movement history"
        description={`${level.name} · ${level.sku}`}
      >
        {loadError ? (
          <p role="alert" className="text-sm text-critical">
            The movement history could not be loaded. Please try again.
          </p>
        ) : movements === null ? (
          <p className="text-sm text-ink-muted">Loading the ledger…</p>
        ) : (
          <MovementHistory movements={movements} />
        )}
      </Dialog>
    </div>
  );
}

export function StockStateBadge({ state, quantity }: { state: string; quantity: number }) {
  if (state === 'OUT_OF_STOCK') return <Badge tone="critical">Out of stock</Badge>;
  if (state === 'LOW') return <Badge tone="caution">Low · {quantity} left</Badge>;
  return <Badge tone="positive">In stock</Badge>;
}

export function ValuationCell({ retail, cost, currency }: { retail: string; cost: string | null; currency: string }) {
  return (
    <span className="block text-right">
      <span className="block font-medium text-ink">{formatMoney(retail, currency)}</span>
      <span className="block text-xs text-ink-muted">
        {cost ? `${formatMoney(cost, currency)} at cost` : 'no cost recorded'}
      </span>
    </span>
  );
}
