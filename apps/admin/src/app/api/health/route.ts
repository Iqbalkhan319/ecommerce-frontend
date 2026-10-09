import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Readiness for the storefront container.
 *
 * It reports healthy only when the process is serving and the API gateway is reachable,
 * because a storefront that cannot reach the catalogue is not actually usable.
 */
export async function GET() {
  const started = Date.now();
  let gatewayReachable = false;
  let detail: string | undefined;

  try {
    const response = await fetch(`${serverEnv.gatewayUrl}/api/v1/auth/.well-known/jwks.json`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    gatewayReachable = response.ok;
    if (!response.ok) detail = `gateway responded with ${response.status}`;
  } catch (error) {
    detail = (error as Error).message;
  }

  const body = {
    status: gatewayReachable ? 'ok' : 'degraded',
    service: 'admin-app',
    uptimeSeconds: Math.floor(process.uptime()),
    dependencies: {
      apiGateway: { status: gatewayReachable ? 'up' : 'down', latencyMs: Date.now() - started, ...(detail ? { detail } : {}) },
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, { status: gatewayReachable ? 200 : 503 });
}
