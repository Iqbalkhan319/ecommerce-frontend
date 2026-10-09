import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarList, StackedBar, TrendChart } from '@ecom/ui';
import { NAVIGATION, can } from '../src/lib/permissions';

const staff = { permissions: ['product:read', 'order:read', 'inventory:read', 'report:read'], isSuperAdmin: false };
const manager = {
  permissions: ['inventory:read', 'inventory:adjust', 'report:read', 'report:export'],
  isSuperAdmin: false,
};
const owner = { permissions: [], isSuperAdmin: true };

describe('inventory and reporting permissions', () => {
  it('shows the new sections to a role that carries the read permissions', () => {
    const visible = NAVIGATION.filter((item) => !item.permission || can(staff, item.permission)).map(
      (item) => item.href,
    );
    expect(visible).toContain('/inventory');
    expect(visible).toContain('/reports');
  });

  it('hides both sections from a role carrying neither permission', () => {
    const catalogueOnly = { permissions: ['product:read'], isSuperAdmin: false };
    const visible = NAVIGATION.filter((item) => !item.permission || can(catalogueOnly, item.permission)).map(
      (item) => item.href,
    );
    expect(visible).not.toContain('/inventory');
    expect(visible).not.toContain('/reports');
  });

  // Reading stock and moving it are separate capabilities, as are reading a report and
  // taking a copy of it out of the platform.
  it('separates reading from acting', () => {
    expect(can(staff, 'inventory:read')).toBe(true);
    expect(can(staff, 'inventory:adjust')).toBe(false);
    expect(can(staff, 'report:read')).toBe(true);
    expect(can(staff, 'report:export')).toBe(false);

    expect(can(manager, 'inventory:adjust')).toBe(true);
    expect(can(manager, 'report:export')).toBe(true);
  });

  it('grants the owner the new permissions without listing them', () => {
    expect(can(owner, 'inventory:adjust')).toBe(true);
    expect(can(owner, 'report:export')).toBe(true);
  });
});

describe('TrendChart', () => {
  const points = [
    { label: '01/08', value: 1200 },
    { label: '02/08', value: 2400 },
    { label: '03/08', value: 800 },
  ];

  it('labels the chart for assistive technology and states the peak', () => {
    render(<TrendChart points={points} title="Net revenue" formatValue={(value) => `${value}`} />);
    const chart = screen.getByRole('img');
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining('Net revenue'));
    expect(chart).toHaveAttribute('aria-label', expect.stringContaining('2400'));
  });

  // A chart that is only a picture is unreadable to a screen reader, so the same numbers
  // are always present as a table.
  it('exposes the underlying numbers as a table', () => {
    render(<TrendChart points={points} title="Net revenue" valueLabel="Revenue" />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Revenue' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: '02/08' })).toBeInTheDocument();
  });

  it('says so plainly when there is nothing to plot', () => {
    render(<TrendChart points={[]} title="Net revenue" />);
    expect(screen.getByText(/nothing to plot/i)).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  // A single data point has no span to divide; the chart must not produce NaN geometry.
  it('renders a single point without dividing by zero', () => {
    render(<TrendChart points={[{ label: '01/08', value: 500 }]} title="Net revenue" />);
    const chart = screen.getByRole('img');
    expect(chart.innerHTML).not.toContain('NaN');
  });

  it('renders an all-zero series without dividing by zero', () => {
    render(
      <TrendChart
        points={[
          { label: '01/08', value: 0 },
          { label: '02/08', value: 0 },
        ]}
        title="Net revenue"
      />,
    );
    expect(screen.getByRole('img').innerHTML).not.toContain('NaN');
  });
});

describe('BarList', () => {
  it('renders a bar per row with its formatted value', () => {
    render(
      <BarList
        title="Revenue by category"
        data={[
          { label: 'Audio', value: 4200, display: '$4,200.00', hint: '52%' },
          { label: 'Lighting', value: 900, display: '$900.00', hint: '11%' },
        ]}
      />,
    );
    expect(screen.getByText('Audio')).toBeInTheDocument();
    expect(screen.getByText('$4,200.00')).toBeInTheDocument();
    expect(screen.getByText('52%')).toBeInTheDocument();
  });

  it('shows the empty message rather than an empty chart', () => {
    render(<BarList title="Revenue by category" data={[]} emptyMessage="Nothing sold in this period." />);
    expect(screen.getByText('Nothing sold in this period.')).toBeInTheDocument();
  });
});

describe('StackedBar', () => {
  const segments = [
    { key: 'PENDING', label: 'Awaiting confirmation', value: 4 },
    { key: 'DELIVERED', label: 'Delivered', value: 12 },
    { key: 'REJECTED', label: 'Rejected', value: 0 },
  ];

  it('describes the pipeline for assistive technology', () => {
    render(<StackedBar title="Order pipeline" segments={segments} />);
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', expect.stringContaining('Delivered 12'));
  });

  // A zero segment would render an invisible sliver and a meaningless legend row.
  it('omits statuses with no orders from the legend', () => {
    render(<StackedBar title="Order pipeline" segments={segments} />);
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.queryByText('Rejected')).not.toBeInTheDocument();
  });

  it('says so when nothing was placed at all', () => {
    render(
      <StackedBar title="Order pipeline" segments={[{ key: 'PENDING', label: 'Awaiting confirmation', value: 0 }]} />,
    );
    expect(screen.getByText(/no orders were placed/i)).toBeInTheDocument();
  });
});
