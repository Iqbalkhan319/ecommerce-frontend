import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Field, Input, OrderStatusBadge, StockBadge, formatMoney, ConfirmDialog, EmptyState } from '@ecom/ui';

describe('money formatting', () => {
  it('renders a decimal string as currency without floating point drift', () => {
    // Whole amounts print without decimals, fractional amounts keep both places.
    expect(formatMoney('249.00', 'USD')).toContain('249');
    expect(formatMoney('0.10', 'USD')).toContain('0.10');
    expect(formatMoney('1234.50', 'USD')).toMatch(/1,234\.50/);
  });

  it('renders a dash rather than NaN for a missing value', () => {
    expect(formatMoney('not-a-number')).toBe('—');
  });
});

describe('Button', () => {
  it('blocks interaction and announces busy while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button).catch(() => undefined);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Field', () => {
  it('associates the label with the control and announces the error', () => {
    render(
      <Field label="Email address" htmlFor="email" required error="That address is not valid">
        <Input id="email" invalid />
      </Field>,
    );
    const input = screen.getByLabelText(/email address/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('That address is not valid');
  });

  it('shows a hint when there is no error', () => {
    render(
      <Field label="Phone" htmlFor="phone" hint="Optional">
        <Input id="phone" />
      </Field>,
    );
    expect(screen.getByText('Optional')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('status badges', () => {
  it('describes an order state in plain language', () => {
    render(<OrderStatusBadge status="PENDING" />);
    expect(screen.getByText(/awaiting confirmation/i)).toBeInTheDocument();
  });

  it('distinguishes out of stock, low stock and in stock', () => {
    const { rerender } = render(<StockBadge stock={0} />);
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument();

    rerender(<StockBadge stock={3} threshold={5} />);
    expect(screen.getByText(/only 3 left/i)).toBeInTheDocument();

    rerender(<StockBadge stock={40} threshold={5} />);
    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
  });
});

describe('ConfirmDialog', () => {
  it('requires an explicit confirmation and can be dismissed with Escape', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Reject this order?"
        description="Stock returns to the catalogue."
        onConfirm={onConfirm}
        onCancel={onCancel}
        tone="danger"
        confirmLabel="Reject order"
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Reject this order?')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: /reject order/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not render anything while closed', () => {
    render(<ConfirmDialog open={false} title="Hidden" description="" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('EmptyState', () => {
  it('explains the situation and offers a way forward', () => {
    render(<EmptyState title="No orders yet" description="Your first order will appear here." action={<Button>Browse</Button>} />);
    expect(screen.getByRole('heading', { name: /no orders yet/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse/i })).toBeInTheDocument();
  });
});
