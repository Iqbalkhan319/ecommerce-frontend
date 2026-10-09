import 'server-only';
import { createApiClient, endpoints } from '@ecom/api-client';
import { serverEnv } from './env';

export const gateway = createApiClient(serverEnv.gatewayUrl);
export { endpoints };
