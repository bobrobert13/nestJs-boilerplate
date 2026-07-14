import { SetMetadata } from '@nestjs/common';

/** Metadata key checked by {@link ResponseInterceptor}. */
export const RAW_RESPONSE_KEY = 'raw_response';

/**
 * Opt-out of the global {@link ResponseInterceptor}.
 * Use on controllers or methods that need raw response control
 * (file downloads, streaming, webhooks, etc.).
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
