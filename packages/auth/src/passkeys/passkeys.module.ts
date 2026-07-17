import { Module, Global } from '@nestjs/common';
import { PasskeysService } from './passkeys.service';
import { PasskeysController } from './passkeys.controller';
import { PasskeyChallengeStore } from './passkey-challenge.store';
import { AuthModule } from '../auth.module';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [PasskeysController],
  providers: [PasskeysService, PasskeyChallengeStore],
  exports: [PasskeysService, PasskeyChallengeStore],
})
export class PasskeysModule {}
