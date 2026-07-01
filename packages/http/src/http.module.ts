import { Global, Module } from '@nestjs/common';
import { HttpService } from './services/http.service';

/**
 * Global NestJS module providing HTTP client capabilities.
 *
 * Registers `HttpService` as a global provider so it can be injected
 * anywhere without importing this module into each feature module.
 *
 * `HttpService` wraps Axios with typed error handling and a fluent
 * download API (`file`, `image`, `video`).
 */
@Global()
@Module({
  providers: [HttpService],
  exports: [HttpService],
})
export class HttpModule {}