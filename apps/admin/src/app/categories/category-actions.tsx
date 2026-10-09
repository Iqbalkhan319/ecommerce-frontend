'use client';

import * as React from 'react';
import { useActionState, useTransition } from 'react';
import { Button, Checkbox, ConfirmDialog, Dialog, Field, Input, Textarea, useToast } from '@ecom/ui';
import { deleteCategoryAction, saveCategoryAction } from '@/lib/actions/catalogue';
import { initialFormState } from '@/lib/form-state';
import type { Category } from '@ecom/types';

function CategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const [state, formAction] = useActionState(saveCategoryAction, initialFormState);
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
      {category && <input type="hidden" name="id" value={category.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required error={state.fieldErrors?.name}>
          <Input id="name" name="name" defaultValue={category?.name} required />
        </Field>
        <Field label="Slug" htmlFor="slug" required hint="Lower case with hyphens" error={state.fieldErrors?.slug}>
          <Input id="slug" name="slug" defaultValue={category?.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
        </Field>
      </div>

      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={3} defaultValue={category?.description ?? ''} maxLength={600} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Position" htmlFor="position" hint="Lower numbers appear first">
          <Input id="position" name="position" type="number" min="0" defaultValue={category?.position ?? 0} />
        </Field>
        <Field label="Image URL" htmlFor="imageUrl" hint="Optional">
          <Input id="imageUrl" name="imageUrl" type="url" defaultValue={category?.imageUrl ?? ''} />
        </Field>
      </div>

      <Checkbox name="isActive" defaultChecked={category?.isActive ?? true} label="Show in the storefront" />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{category ? 'Save changes' : 'Create category'}</Button>
      </div>
    </form>
  );
}

export function NewCategoryButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>New category</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="New category">
        <CategoryForm onDone={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

export function CategoryActions({
  category,
  permissions,
}: {
  category: Category;
  permissions: { edit: boolean; delete: boolean };
}) {
  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const remove = () => {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (result.status === 'error') toast.error('Not deleted', result.message);
      else toast.success(result.message ?? 'Category deleted.');
      setDeleting(false);
    });
  };

  if (!permissions.edit && !permissions.delete) return <span className="text-xs text-ink-muted">View only</span>;

  return (
    <div className="flex justify-end gap-2">
      {permissions.edit && (
        <Button variant="link" className="text-sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
      )}
      {permissions.delete && (
        <Button
          variant="link"
          className="text-sm text-critical"
          onClick={() => setDeleting(true)}
          disabled={category.productCount > 0}
          title={category.productCount > 0 ? 'Move or archive the products first' : undefined}
        >
          Delete
        </Button>
      )}

      <Dialog open={editing} onClose={() => setEditing(false)} title={`Edit ${category.name}`}>
        <CategoryForm category={category} onDone={() => setEditing(false)} />
      </Dialog>

      <ConfirmDialog
        open={deleting}
        title={`Delete ${category.name}?`}
        description="This cannot be undone. Only an empty category can be deleted."
        confirmLabel="Delete category"
        tone="danger"
        busy={pending}
        onCancel={() => setDeleting(false)}
        onConfirm={remove}
      />
    </div>
  );
}
