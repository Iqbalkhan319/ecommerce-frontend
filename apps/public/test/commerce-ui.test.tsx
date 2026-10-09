import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuantityStepper, formatMoney } from '@ecom/ui';

describe('formatMoney in taka', () => {
  it('uses the taka sign with Latin digits', () => {
    expect(formatMoney('28900.00')).toBe('৳28,900');
  });

  it('omits decimals for whole amounts and keeps both places otherwise', () => {
    expect(formatMoney(149900)).toBe('৳149,900');
    expect(formatMoney('1250.50')).toBe('৳1,250.50');
  });

  it('still honours an explicit currency', () => {
    expect(formatMoney('99.00', 'USD', 'en-US')).toBe('$99');
  });

  it('returns a dash for values that are not numbers', () => {
    expect(formatMoney('not-a-price')).toBe('—');
  });
});

function Harness({ max = 5, start = 1 }: { max?: number; start?: number }) {
  const [value, setValue] = React.useState(start);
  return <QuantityStepper value={value} max={max} onChange={setValue} name="quantity" />;
}

describe('QuantityStepper', () => {
  it('steps up and down within stock', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByLabelText('Increase quantity'));
    expect(screen.getByLabelText('Quantity: 2')).toBeTruthy();
    await user.click(screen.getByLabelText('Decrease quantity'));
    expect(screen.getByLabelText('Quantity: 1')).toBeTruthy();
  });

  it('cannot go below one', () => {
    render(<Harness />);
    expect((screen.getByLabelText('Decrease quantity') as HTMLButtonElement).disabled).toBe(true);
  });

  it('cannot exceed the stock ceiling', async () => {
    const user = userEvent.setup();
    render(<Harness max={2} />);
    await user.click(screen.getByLabelText('Increase quantity'));
    expect((screen.getByLabelText('Increase quantity') as HTMLButtonElement).disabled).toBe(true);
  });

  it('carries the value in a hidden input for form submission', () => {
    const { container } = render(<Harness start={3} />);
    const hidden = container.querySelector('input[name="quantity"]') as HTMLInputElement;
    expect(hidden.value).toBe('3');
  });

  it('never reports a value outside the allowed range', () => {
    const onChange = vi.fn();
    render(<QuantityStepper value={1} max={1} onChange={onChange} />);
    const increase = screen.getByLabelText('Increase quantity') as HTMLButtonElement;
    expect(increase.disabled).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('FreeDeliveryNudge', () => {
  it('reports how much more is needed below the threshold', async () => {
    const { FreeDeliveryNudge } = await import('../src/components/free-delivery-nudge');
    render(<FreeDeliveryNudge subtotal="3200.00" />);
    expect(screen.getByText(/more for free delivery/i)).toBeTruthy();
    expect(screen.getByText('৳1,800')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('64');
  });

  it('confirms free delivery once the threshold is met', async () => {
    const { FreeDeliveryNudge } = await import('../src/components/free-delivery-nudge');
    render(<FreeDeliveryNudge subtotal={5000} />);
    expect(screen.getByText(/Free delivery earned/i)).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
  });

  it('renders nothing for an unparseable subtotal', async () => {
    const { FreeDeliveryNudge } = await import('../src/components/free-delivery-nudge');
    const { container } = render(<FreeDeliveryNudge subtotal="—" />);
    expect(container.innerHTML).toBe('');
  });
});
