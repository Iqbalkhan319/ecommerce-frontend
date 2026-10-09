import Link from 'next/link';
import { EmptyState } from '@ecom/ui';

export default function NotFound() {
  return (
    <div className="shell py-20">
      <EmptyState
        title="We could not find that page"
        description="The link may be out of date, or the product may have been withdrawn."
        action={
          <Link
            href="/products"
            className="inline-flex h-10 items-center rounded bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
          >
            Browse the catalogue
          </Link>
        }
      />
    </div>
  );
}
