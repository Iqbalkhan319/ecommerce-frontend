'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { Button, ConfirmDialog, Dialog, Field, Input, Select, Textarea, useToast } from '@ecom/ui';
import { adjustStockAction, archiveProductAction, saveProductAction } from '@/lib/actions/catalogue';
import { initialFormState } from '@/lib/form-state';
import type { Category, Product } from '@ecom/types';

function ProductForm({
  product,
  categories,
  onDone,
}: {
  product?: Product;
  categories: Category[];
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(saveProductAction, initialFormState);
  const toast = useToast();

  React.useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? 'Saved.');
      onDone();
    } else if (state.status === 'error' && state.message) {
      toast.error('Not saved', state.message);
    }
  }, [state, toast, onDone]);

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required error={errors.name}>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </Field>
        <Field label="Slug" htmlFor="slug" required hint="Lower case with hyphens" error={errors.slug}>
          <Input id="slug" name="slug" defaultValue={product?.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
        </Field>
      </div>

      {!product && (
        <Field label="SKU" htmlFor="sku" required hint="Upper case, digits and hyphens. Cannot be changed later." error={errors.sku}>
          <Input id="sku" name="sku" required pattern="[A-Z0-9][A-Z0-9-]{2,39}" />
        </Field>
      )}

      <Field label="Short description" htmlFor="shortDescription" hint="One line, shown on the product card">
        <Input id="shortDescription" name="shortDescription" defaultValue={product?.shortDescription ?? ''} maxLength={300} />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={4} defaultValue={product?.description ?? ''} maxLength={4000} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="categoryId" required error={errors.categoryId}>
          <Select id="categoryId" name="categoryId" defaultValue={product?.category.id} required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="status" required>
          <Select id="status" name="status" defaultValue={product?.status ?? 'DRAFT'}>
            <option value="DRAFT">Draft — not visible in the storefront</option>
            <option value="ACTIVE">Live</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price" htmlFor="price" required error={errors.price}>
          <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={product?.price} required />
        </Field>
        <Field label="Compare at" htmlFor="compareAtPrice" hint="Optional">
          <Input id="compareAtPrice" name="compareAtPrice" type="number" step="0.01" min="0" defaultValue={product?.compareAtPrice ?? ''} />
        </Field>
        <Field label="Low stock at" htmlFor="lowStockThreshold">
          <Input id="lowStockThreshold" name="lowStockThreshold" type="number" min="0" defaultValue={product?.lowStockThreshold ?? 5} />
        </Field>
      </div>

      {!product && (
        <Field label="Opening stock" htmlFor="stockQuantity" hint="Later changes go through the audited stock adjustment">
          <Input id="stockQuantity" name="stockQuantity" type="number" min="0" defaultValue={0} />
        </Field>
      )}

      <Field label="Image URL" htmlFor="imageUrl" hint="Replaces the current image set">
        <Input id="imageUrl" name="imageUrl" type="url" defaultValue={product?.images[0]?.url ?? ''} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{product ? 'Save changes' : 'Create product'}</Button>
      </div>
    </form>
  );
}

export function NewProductButton({ categories }: { categories: Category[] }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New product</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New product" size="lg">
        <ProductForm categories={categories} onDone={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

export function ProductRowActions({
  product,
  categories,
  permissions,
}: {
  product: Product;
  categories: Category[];
  permissions: { edit: boolean; delete: boolean };
}) {
  const [editing, setEditing] = React.useState(false);
  const [stocking, setStocking] = React.useState(false);
  const [archiving, setArchiving] = React.useState(false);
  const [delta, setDelta] = React.useState('0');
  const [reason, setReason] = React.useState('');
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const applyStock = () => {
    startTransition(async () => {
      const result = await adjustStockAction(product.id, Number(delta), reason);
      if (result.status === 'error') toast.error('Stock not adjusted', result.message);
      else toast.success(result.message ?? 'Stock adjusted.');
      setStocking(false);
      setDelta('0');
      setReason('');
    });
  };

  const archive = () => {
    startTransition(async () => {
      const result = await archiveProductAction(product.id);
      if (result.status === 'error') toast.error('Not archived', result.message);
      else toast.success(result.message ?? 'Product archived.');
      setArchiving(false);
    });
  };

  if (!permissions.edit && !permissions.delete) {
    return <span className="text-xs text-ink-muted">View only</span>;
  }

  return (
    <div className="flex justify-end gap-2">
      {permissions.edit && (
        <>
          <Button variant="link" className="text-sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="link" className="text-sm" onClick={() => setStocking(true)}>
            Stock
          </Button>
        </>
      )}
      {permissions.delete && product.status !== 'ARCHIVED' && (
        <Button variant="link" className="text-sm text-critical" onClick={() => setArchiving(true)}>
          Archive
        </Button>
      )}

      <Dialog open={editing} onClose={() => setEditing(false)} title={`Edit ${product.name}`} size="lg">
        <ProductForm product={product} categories={categories} onDone={() => setEditing(false)} />
      </Dialog>

      <Dialog
        open={stocking}
        onClose={() => setStocking(false)}
        title={`Adjust stock — ${product.name}`}
        description={`Currently ${product.stockQuantity} in stock. Use a negative number to reduce.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setStocking(false)}>
              Cancel
            </Button>
            <Button onClick={applyStock} loading={pending} disabled={Number(delta) === 0}>
              Apply adjustment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Change" htmlFor="delta" required hint="For example 25, or -3">
            <Input id="delta" type="number" value={delta} onChange={(event) => setDelta(event.target.value)} />
          </Field>
          <Field label="Reason" htmlFor="stockReason" hint="Recorded in the audit trail">
            <Input id="stockReason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={240} />
          </Field>
          <p className="text-sm text-ink-muted">
            New level: <strong className="text-ink">{product.stockQuantity + (Number(delta) || 0)}</strong>
          </p>
        </div>
      </Dialog>

      <ConfirmDialog
        open={archiving}
        title={`Archive ${product.name}?`}
        description="It disappears from the storefront immediately. Existing orders keep their record of it, so nothing in the order history changes."
        confirmLabel="Archive product"
        tone="danger"
        busy={pending}
        onCancel={() => setArchiving(false)}
        onConfirm={archive}
      />
    </div>
  );
}
