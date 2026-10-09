import { NextResponse } from 'next/server';
import { ApiError, endpoints } from '@ecom/api-client';
import { gateway } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { can } from '@/lib/permissions';

/**
 * Streams a report CSV through the Next.js server.
 *
 * The browser holds only an HttpOnly session cookie, so an export cannot be a direct
 * gateway link. The report name is resolved against this fixed map rather than being
 * interpolated into a path, so no caller can steer the request at another endpoint, and
 * the admin service re-checks report:export on every request regardless.
 */
const REPORTS: Record<string, string> = {
  sales: endpoints.admin.reportSales,
  products: endpoints.admin.reportProducts,
  categories: endpoints.admin.reportCategories,
  customers: endpoints.admin.reportCustomers,
  orders: endpoints.admin.reportOrders,
  inventory: endpoints.admin.reportInventory,
};

// Only the parameters a report actually understands are forwarded.
const FORWARDED = ['from', 'to', 'granularity', 'limit', 'categoryId'] as const;

export async function GET(request: Request, context: { params: Promise<{ report: string }> }) {
  const { report } = await context.params;
  const path = REPORTS[report];
  if (!path) {
    return NextResponse.json({ error: 'Unknown report' }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  if (!can(user, 'report:export')) {
    return NextResponse.json({ error: 'Exporting a report requires the report:export permission' }, { status: 403 });
  }

  const incoming = new URL(request.url).searchParams;
  const query: Record<string, string> = { format: 'csv' };
  for (const key of FORWARDED) {
    const value = incoming.get(key);
    if (value) query[key] = value;
  }

  const token = await getAccessToken();

  try {
    const file = await gateway.getBinary(path, { token, query });
    return new NextResponse(file.body, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${file.filename.endsWith('.csv') ? file.filename : `${report}.csv`}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message =
      error instanceof ApiError ? error.message : 'The export could not be produced at the moment.';
    return NextResponse.json({ error: message }, { status });
  }
}
