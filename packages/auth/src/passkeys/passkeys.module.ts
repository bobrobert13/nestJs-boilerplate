import { Module, Global } from '@nestjs/common';
import { PasskeysService } from './passkeys.service';
import { PasskeysController } from './passkeys.controller';
import { AuthModule } from '../auth.module';

/**
 * Global module providing WebAuthn (passkey) authentication support.
 *
 * @description Registers {@link PasskeysService} and {@link PasskeysController}.
 * Depends on `AuthModule` for JWT guards. The service is exported globally
 * so any module can inject it without re-importing.
 */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [PasskeysController],
  providers: [PasskeysService],
  exports: [PasskeysService],
})
export class PasskeysModule {}