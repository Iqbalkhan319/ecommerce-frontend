import { NextResponse } from 'next/server';
import { ApiError, endpoints } from '@ecom/api-client';
import { gateway } from '@/lib/api';
import { getAccessToken } from '@/lib/session';

/**
 * Streams the invoice PDF through the Next.js server.
 *
 * The browser never holds an access token, so the download cannot be a direct gateway
 * link. The admin service still checks the invoice:read permission on every request.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getAccessToken();

  if (!token) {
    return NextResponse.redirect(new URL('/login', 'http://localhost:3100'));
  }

  try {
    const file = await gateway.getBinary(endpoints.admin.orderInvoice(id), { token });
    return new NextResponse(file.body, {
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message =
      error instanceof ApiError ? error.message : 'The invoice could not be downloaded at the moment.';
    return NextResponse.json({ error: message }, { status });
  }
}
