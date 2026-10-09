'use client';

import { useEffect } from 'react';
import { Button, ErrorState } from '@ecom/ui';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Server details never reach the browser; the digest is the correlation handle.
    console.error('Storefront error', error.digest ?? error.message);
  }, [error]);

  return (
    <div className="shell py-20">
      <ErrorState
        title="This page could not be loaded"
        description="Something went wrong on our side. Trying again often resolves it."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
