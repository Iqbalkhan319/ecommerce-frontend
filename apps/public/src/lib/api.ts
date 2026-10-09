import 'server-only';
import { createApiClient, endpoints } from '@ecom/api-client';
import { serverEnv } from './env';

export const gateway = createApiClient(serverEnv.gatewayUrl);
export { endpoints };

// Catalogue reads are cached briefly at the Next.js layer as well as in Redis behind the
// gateway. The tag lets a mutation revalidate them without waiting for the TTL.
export const CATALOGUE_TAG = 'catalogue';
export const catalogueCache = { revalidateSeconds: 60, tags: [CATALOGUE_TAG] };
