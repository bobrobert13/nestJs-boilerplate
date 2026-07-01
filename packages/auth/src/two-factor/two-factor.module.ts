import { Module, Global } from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { TwoFactorController } from './two-factor.controller';
import { AuthModule } from '../auth.module';

/**
 * Global module providing two-factor authentication (TOTP) support.
 *
 * @description Registers {@link TwoFactorService} and {@link TwoFactorController}.
 * Depends on `AuthModule` for JWT guards. The service is exported globally
 * so any module can inject it without re-importing.
 */
@Global()
@Module({
  imports: [AuthModule],
  controllers: [TwoFactorController],
  providers: [TwoFactorService],
  exports: [TwoFactorService],
})
export class TwoFactorModule {}