import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Throttle } from '@common/common';
import {
  EnableTwoFactorDto,
  VerifyTwoFactorDto,
  VerifyBackupCodeDto,
  GenerateBackupCodesDto,
} from './dto/two-factor.dto';

@ApiTags('auth', '2fa')
@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiResponse({ status: 200, description: 'Secret and QR generated' })
  /** generate (see class JSDoc for context). */
  /** generate (see class JSDoc for context). */
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA with TOTP code' })
  @ApiResponse({ status: 200, description: '2FA enabled' })
  /** enable (see class JSDoc for context). */
  /** enable (see class JSDoc for context). */
  async enable(@Request() req: any, @Body() dto: EnableTwoFactorDto) {
    const result = await this.twoFactorService.enableTwoFactor(
      req.user.id,
      dto.code,
    );

    /** if (see class JSDoc for context). */
    /** if (see class JSDoc for context). */
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a TOTP code' })
  @ApiResponse({ status: 200, description: 'Verification result' })
  /** verify (see class JSDoc for context). */
  /** verify (see class JSDoc for context). */
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

  /**
   * C2 / REQ-auth-3: this endpoint MUST require a valid JWT and derive the
   * userId from `req.user.id`. Body-supplied `userId` is ignored — the DTO
   * does not declare one. Anonymous requests are rejected with HTTP 401.
   */
  @UseGuards(JwtAuthGuard)
  @Throttle({ limit: 3, ttl: 60 })
  @Post('verify-backup')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a 2FA backup code' })
  @ApiResponse({ status: 200, description: 'Backup code verification result' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized — JWT required or backup code invalid',
  })
  /** verifyBackup (see class JSDoc for context). */
  /** verifyBackup (see class JSDoc for context). */
  async verifyBackup(@Request() req: any, @Body() dto: VerifyBackupCodeDto) {
    const userId = req?.user?.id;
    /** if (see class JSDoc for context). */
    /** if (see class JSDoc for context). */
    if (!userId) {
      throw new UnauthorizedException('Identity required');
    }
    const isValid = await this.twoFactorService.verifyBackupCodeWithUser(
      userId,
      dto.backupCode,
    );

    /** if (see class JSDoc for context). */
    /** if (see class JSDoc for context). */
    if (!isValid) {
      throw new UnauthorizedException('Invalid backup code');
    }

    return {
      success: true,
      data: {
        verified: true,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('regenerate-backup-codes')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate backup codes' })
  @ApiResponse({ status: 200, description: 'Backup codes regenerated' })
  /** regenerateBackupCodes (see class JSDoc for context). */
  /** regenerateBackupCodes (see class JSDoc for context). */
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  @ApiResponse({ status: 200, description: '2FA disabled' })
  /** disable (see class JSDoc for context). */
  /** disable (see class JSDoc for context). */
  async disable(@Request() req: any) {
    await this.twoFactorService.disableTwoFactor(req.user.id);
    return {
      success: true,
      message: '2FA has been disabled',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 2FA status and remaining time' })
  @ApiResponse({ status: 200, description: '2FA status' })
  /** status (see class JSDoc for context). */
  /** status (see class JSDoc for context). */
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
