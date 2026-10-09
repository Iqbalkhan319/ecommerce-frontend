import Link from 'next/link';
import { Card, CardBody } from '@ecom/ui';

type Tone = 'neutral' | 'positive' | 'caution' | 'critical';

const VALUE_TONE: Record<Tone, string> = {
  neutral: 'text-ink',
  positive: 'text-ink',
  caution: 'text-caution',
  critical: 'text-critical',
};

const RAIL_TONE: Record<Tone, string> = {
  neutral: 'bg-line-strong',
  positive: 'bg-positive',
  caution: 'bg-caution',
  critical: 'bg-critical',
};

export function StatTile({
  label,
  value,
  hint,
  tone = 'neutral',
  delta,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' } | null;
  href?: string;
}) {
  const body = (
    <CardBody className="relative overflow-hidden pl-5">
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${RAIL_TONE[tone]}`} />
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-1.5 font-display text-2xl leading-tight ${VALUE_TONE[tone]}`}>{value}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        {delta && (
          <span
            className={`text-xs font-semibold ${
              delta.direction === 'up' ? 'text-positive' : delta.direction === 'down' ? 'text-critical' : 'text-ink-muted'
            }`}
          >
            {delta.direction === 'up' ? '▲' : delta.direction === 'down' ? '▼' : '■'} {delta.value}
          </span>
        )}
        {hint && <span className="text-xs text-ink-muted">{hint}</span>}
      </div>
    </CardBody>
  );

  if (!href) return <Card>{body}</Card>;

  return (
    <Card className="transition-shadow hover:shadow-raised focus-within:shadow-raised">
      <Link href={href} className="block rounded-xl outline-none">
        {body}
      </Link>
    </Card>
  );
}
