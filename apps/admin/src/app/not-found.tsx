import Link from 'next/link';
import { EmptyState } from '@ecom/ui';

export default function NotFound() {
  return (
    <div className="px-6 py-20">
      <EmptyState
        title="Page not found"
        description="That record may have been removed, or the link may be out of date."
        action={
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
          >
            Back to the dashboard
          </Link>
        }
      />
    </div>
  );
}
