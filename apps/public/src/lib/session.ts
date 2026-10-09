import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import type { AuthSession, AuthenticatedUser, TokenPair } from '@ecom/types';
import { createApiClient, endpoints, ApiError } from '@ecom/api-client';
import { serverEnv } from './env';

/**
 * Backend for frontend session handling.
 *
 * Tokens live only in HttpOnly cookies set by the Next.js server. The browser never
 * receives an access or refresh token, so no script on the page can read one, and
 * nothing sensitive is placed in localStorage.
 */

const ACCESS_COOKIE = serverEnv.sessionCookieName;
const REFRESH_COOKIE = `${serverEnv.sessionCookieName}_r`;
const REFRESH_SKEW_SECONDS = 45;

export const api = createApiClient(serverEnv.gatewayUrl);

interface AccessClaims {
  sub: string;
  typ: string;
  exp: number;
}

function decodeClaims(token: string): AccessClaims | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AccessClaims;
  } catch {
    return null;
  }
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: serverEnv.cookieSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
    ...(serverEnv.cookieDomain ? { domain: serverEnv.cookieDomain } : {}),
  };
}

export async function persistSession(tokens: TokenPair): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.expiresIn));
  jar.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshExpiresIn));
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function readAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function readRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

function isExpiring(token: string): boolean {
  const claims = decodeClaims(token);
  if (!claims) return true;
  return claims.exp * 1000 - Date.now() < REFRESH_SKEW_SECONDS * 1000;
}

/**
 * Resolves the access token at most once per request.
 *
 * Refresh tokens are single-use and the auth service treats a replay as theft: it
 * revokes the whole session family. A render that resolved the token twice - typically
 * once via getCurrentUser() and again for the page's own fetch - would spend the token
 * on the first call and be flagged as a replay on the second, so the page ended up
 * issuing an unauthenticated request and throwing a 401. cache() is scoped to the
 * request, so every caller in one render shares a single refresh.
 */
const resolveAccessToken = cache(async (): Promise<string | null> => {
  const access = await readAccessToken();
  if (access && !isExpiring(access)) return access;

  const refresh = await readRefreshToken();
  if (!refresh) return null;

  try {
    const session = await api.post<AuthSession>(endpoints.auth.refresh, { refreshToken: refresh });
    // Cookie writes only succeed in a Server Action or Route Handler. Middleware
    // refreshes ahead of the render, so this is the fallback path for that case.
    await persistSession(session.tokens).catch(() => undefined);
    return session.tokens.accessToken;
  } catch {
    return null;
  }
});

export async function getAccessToken(): Promise<string | null> {
  return resolveAccessToken();
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await api.get<AuthenticatedUser>(endpoints.auth.me, { token, cache: 'no-store' });
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthenticated) return null;
    throw error;
  }
}

export async function requireUser(): Promise<{ user: AuthenticatedUser; token: string }> {
  const token = await getAccessToken();
  if (!token) throw new UnauthenticatedError();
  const user = await api.get<AuthenticatedUser>(endpoints.auth.me, { token, cache: 'no-store' });
  return { user, token };
}

export class UnauthenticatedError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'UnauthenticatedError';
  }
}
