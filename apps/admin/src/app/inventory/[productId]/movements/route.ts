import { NextResponse } from 'next/server';
import { endpoints } from '@ecom/api-client';
import { api, getAccessToken, getCurrentUser } from '@/lib/session';
import { can } from '@/lib/permissions';
import type { StockMovement } from '@ecom/types';

// The ledger for one product, fetched by the history dialog. The permission is checked
// here as well as at the gateway: this route runs on the server with the session cookie,
// so it must not become a way to read inventory without inventory:read.
export async function GET(_request: Request, context: { params: Promise<{ productId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: 'Not signed in' }, { status: 401 });
  if (!can(user, 'inventory:read')) {
    return NextResponse.json({ message: 'Not permitted' }, { status: 403 });
  }

  const { productId } = await context.params;
  const token = await getAccessToken();

  try {
    const movements = await api.get<StockMovement[]>(endpoints.admin.productMovements(productId), {
      token,
      cache: 'no-store',
    });
    return NextResponse.json(movements, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ message: 'The movement history is unavailable' }, { status: 502 });
  }
}
