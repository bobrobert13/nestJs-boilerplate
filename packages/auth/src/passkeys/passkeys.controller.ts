import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PasskeysService } from './passkeys.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/public.decorator';
import { RegisterPasskeyDto, VerifyPasskeyDto, LoginWithPasskeyDto } from './dto/passkeys.dto';

@ApiTags('auth', 'passkeys')
@Controller('auth/passkeys')
export class PasskeysController {
  constructor(private readonly passkeysService: PasskeysService) {}

  @UseGuards(JwtAuthGuard)
  @Post('register-options')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get WebAuthn registration options' })
  @ApiResponse({ status: 200, description: 'Registration options' })
  async generateRegistrationOptions(@Request() req: any, @Body() dto: RegisterPasskeyDto) {
    const options = await this.passkeysService.generateRegistrationOptions(
      req.user.id,
      dto.username,
    );
    return {
      success: true,
      data: options,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('register-verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify and register a passkey' })
  @ApiResponse({ status: 200, description: 'Passkey registered' })
  async verifyRegistration(@Request() req: any, @Body() body: { response: any }) {
    const result = await this.passkeysService.verifyRegistration(
      req.user.id,
      req.user.email,
      body.response,
    );
    return {
      success: result.verified,
      data: result,
    };
  }

  @Public()
  @Post('login-options')
  @ApiOperation({ summary: 'Get WebAuthn login (authentication) options' })
  @ApiResponse({ status: 200, description: 'Login options' })
  async generateLoginOptions(@Body() dto: LoginWithPasskeyDto) {
    const options = await this.passkeysService.generateAuthenticationOptions(dto.userId);
    return {
      success: true,
      data: options,
    };
  }

  @Public()
  @Post('login-verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify passkey authentication' })
  @ApiResponse({ status: 200, description: 'Authentication result' })
  async verifyLogin(@Body() body: { response: any; userId: string }) {
    const result = await this.passkeysService.verifyAuthentication(
      body.userId,
      body.response.credentialId,
      body.response,
    );
    return {
      success: result.valid,
      data: result,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user registered passkeys' })
  @ApiResponse({ status: 200, description: 'Passkey list' })
  async listPasskeys(@Request() req: any) {
    const passkeys = await this.passkeysService.getUserPasskeys(req.user.id);
    return {
      success: true,
      data: passkeys.map((pk) => ({
        id: pk.id,
        deviceType: pk.deviceType,
        createdAt: pk.createdAt,
      })),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:credentialId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a registered passkey' })
  @ApiResponse({ status: 200, description: 'Passkey deleted' })
  async deletePasskey(@Request() req: any, @Param('credentialId') credentialId: string) {
    const deleted = await this.passkeysService.deletePasskey(req.user.id, credentialId);
    return {
      success: deleted,
      message: deleted ? 'Passkey deleted' : 'Passkey not found',
    };
  }
}
