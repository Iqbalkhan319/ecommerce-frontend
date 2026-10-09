import * as React from 'react';
import { cn } from './utils';

/**
 * Charts are inline SVG with no charting dependency.
 *
 * Two consequences are deliberate: the bundle carries no library, and every colour is a
 * theme token, so light and dark render correctly without a second palette. Each chart is
 * exposed to assistive technology as a figure with a real data table beside it rather than
 * as an unlabelled image.
 */

export interface TrendPoint {
  label: string;
  value: number;
}

function niceCeiling(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const scaled = value / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * magnitude;
}

export function TrendChart({
  points,
  title,
  formatValue = (value) => value.toLocaleString(),
  valueLabel = 'Value',
  height = 200,
  className,
}: {
  points: TrendPoint[];
  title: string;
  formatValue?: (value: number) => string;
  valueLabel?: string;
  height?: number;
  className?: string;
}) {
  const gradientId = React.useId();

  if (points.length === 0) {
    return (
      <p className={cn('py-10 text-center text-sm text-ink-muted', className)}>
        There is nothing to plot in this period.
      </p>
    );
  }

  const width = 720;
  const padding = { top: 12, right: 8, bottom: 26, left: 52 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const peak = Math.max(...points.map((point) => point.value));
  const max = niceCeiling(peak);
  // A single point has no span to divide, so it sits at the left edge and is drawn as a
  // marker rather than a line.
  const step = points.length > 1 ? plotWidth / (points.length - 1) : 0;

  const x = (index: number) => padding.left + index * step;
  const y = (value: number) => padding.top + plotHeight - (value / max) * plotHeight;

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(point.value)}`).join(' ');
  const area = `${line} L${x(points.length - 1)},${padding.top + plotHeight} L${x(0)},${padding.top + plotHeight} Z`;

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((fraction) => max * fraction);
  const tickEvery = Math.max(1, Math.ceil(points.length / 7));

  return (
    <figure className={cn('w-full', className)}>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[20rem]"
          role="img"
          aria-label={`${title}. ${points.length} periods, peaking at ${formatValue(peak)}.`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--colour-accent))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="rgb(var(--colour-accent))" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {gridValues.map((value) => (
            <g key={value}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(value)}
                y2={y(value)}
                stroke="rgb(var(--colour-line))"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y(value) + 4}
                textAnchor="end"
                className="fill-[rgb(var(--colour-ink-muted))] text-[10px]"
              >
                {formatValue(value)}
              </text>
            </g>
          ))}

          <path d={area} fill={`url(#${gradientId})`} />
          {points.length > 1 && (
            <path
              d={line}
              fill="none"
              stroke="rgb(var(--colour-accent))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point, index) => (
            <circle
              key={point.label}
              cx={x(index)}
              cy={y(point.value)}
              r={points.length > 40 ? 0 : points.length === 1 ? 4 : 2.5}
              fill="rgb(var(--colour-accent))"
            />
          ))}

          {points.map((point, index) =>
            index % tickEvery === 0 || index === points.length - 1 ? (
              <text
                key={`tick-${point.label}`}
                x={x(index)}
                y={height - 8}
                textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                className="fill-[rgb(var(--colour-ink-muted))] text-[10px]"
              >
                {point.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      {/* The same numbers as a table, so the chart is never the only way to read them. */}
      <figcaption className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">{valueLabel}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.label}>
                <th scope="row">{point.label}</th>
                <td>{formatValue(point.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}

export interface BarDatum {
  label: string;
  value: number;
  display: string;
  hint?: string;
}

export function BarList({
  data,
  title,
  emptyMessage = 'Nothing to show for this period.',
  className,
}: {
  data: BarDatum[];
  title: string;
  emptyMessage?: string;
  className?: string;
}) {
  if (data.length === 0) {
    return <p className={cn('py-6 text-sm text-ink-muted', className)}>{emptyMessage}</p>;
  }

  const max = Math.max(...data.map((datum) => datum.value), 1);

  return (
    <ol className={cn('space-y-3', className)} aria-label={title}>
      {data.map((datum) => (
        <li key={datum.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-ink">{datum.label}</span>
            <span className="shrink-0 text-sm font-medium tabular-nums text-ink">{datum.display}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max((datum.value / max) * 100, 1.5)}%` }}
              />
            </div>
            {datum.hint && <span className="shrink-0 text-xs tabular-nums text-ink-muted">{datum.hint}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}

const SEGMENT_TONE: Record<string, string> = {
  PENDING: 'bg-caution',
  CONFIRMED: 'bg-info',
  PROCESSING: 'bg-info/70',
  SHIPPED: 'bg-accent',
  DELIVERED: 'bg-positive',
  REJECTED: 'bg-critical',
  CANCELLED: 'bg-line-strong',
};

// A single stacked bar reads the order pipeline at a glance without needing a legend for
// every colour: each segment present is labelled underneath.
export function StackedBar({
  segments,
  title,
  className,
}: {
  segments: Array<{ key: string; label: string; value: number }>;
  title: string;
  className?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  if (total === 0) {
    return <p className={cn('py-6 text-sm text-ink-muted', className)}>No orders were placed in this period.</p>;
  }

  const present = segments.filter((segment) => segment.value > 0);

  return (
    <div className={className}>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-surface-sunken"
        role="img"
        aria-label={`${title}: ${present.map((segment) => `${segment.label} ${segment.value}`).join(', ')}`}
      >
        {present.map((segment) => (
          <div
            key={segment.key}
            className={SEGMENT_TONE[segment.key] ?? 'bg-line-strong'}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {present.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className={cn('h-2 w-2 shrink-0 rounded-full', SEGMENT_TONE[segment.key] ?? 'bg-line-strong')}
            />
            <span className="min-w-0 truncate text-ink-soft">{segment.label}</span>
            <span className="ml-auto font-medium tabular-nums text-ink">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
