import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import {
  EnableTwoFactorDto,
  VerifyTwoFactorDto,
  VerifyBackupCodeDto,
  GenerateBackupCodesDto,
} from './dto/two-factor.dto';

@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generate(@Request() req: any) {
    const result = await this.twoFactorService.generateSecret(req.user.id);
    return {
      success: true,
      data: {
        secret: result.secret,
        otpauthUrl: result.otpauthUrl,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('enable')
  async enable(@Request() req: any, @Body() dto: EnableTwoFactorDto) {
    const result = await this.twoFactorService.enableTwoFactor(
      req.user.id,
      dto.code,
    );

    if (!result.success) {
      return {
        success: false,
        message: 'Invalid 2FA code',
      };
    }

    return {
      success: true,
      data: {
        enabled: true,
        backupCodes: result.backupCodes,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Request() req: any, @Body() dto: VerifyTwoFactorDto) {
    const result = await this.twoFactorService.verifyCode(
      req.user.id,
      dto.code,
    );

    return {
      success: result.valid,
      data: {
        verified: result.valid,
      },
    };
  }

  @Public()
  @Post('verify-backup')
  @HttpCode(HttpStatus.OK)
  async verifyBackup(@Body() dto: VerifyBackupCodeDto & { userId: string }) {
    const isValid = await this.twoFactorService.verifyBackupCodeWithUser(
      dto.userId,
      dto.backupCode,
    );

    return {
      success: isValid,
      data: {
        verified: isValid,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('regenerate-backup-codes')
  async regenerateBackupCodes(
    @Request() req: any,
    @Body() dto: GenerateBackupCodesDto,
  ) {
    try {
      const newCodes = await this.twoFactorService.regenerateBackupCodes(
        req.user.id,
        dto.currentCode!,
      );
      return {
        success: true,
        data: {
          backupCodes: newCodes,
        },
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to regenerate codes',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('disable')
  async disable(@Request() req: any) {
    await this.twoFactorService.disableTwoFactor(req.user.id);
    return {
      success: true,
      message: '2FA has been disabled',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('status')
  async status(@Request() req: any) {
    const isEnabled = this.twoFactorService.isTwoFactorEnabled(req.user.id);
    const timeRemaining = this.twoFactorService.getTimeRemaining();

    return {
      success: true,
      data: {
        enabled: isEnabled,
        timeRemaining,
      },
    };
  }
}
