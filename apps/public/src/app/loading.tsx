import { SkeletonText } from '@ecom/ui';

export default function Loading() {
  return (
    <div className="shell py-16">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-1/2 animate-pulse rounded bg-surface-sunken" />
        <SkeletonText lines={4} />
      </div>
    </div>
  );
}
