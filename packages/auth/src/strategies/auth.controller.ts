import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@common/common';
import { AuthService } from '../services/auth.service';
import { MagicLinkService } from '../services/magic-link.service';
import { ResendService } from '@common/resend';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  MagicLinkRequestDto,
  MagicLinkVerifyDto,
} from '../dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly magicLinkService: MagicLinkService,
    private readonly resendService: ResendService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'âš ï¸ DEMO: Uses hardcoded demo user. Not for production.',
  })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(
      dto.email,
      dto.password,
      dto.name,
    );
    return {
      success: true,
      data: user,
    };
  }

  @Public()
  @Throttle({ limit: 5, ttl: 60 })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with credentials',
    description:
      'âš ï¸ DEMO: Uses hardcoded demo user (demo@example.com / demo123).',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, returns JWT tokens',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    // M6 / REQ-auth-1 â€” invalid credentials MUST return HTTP 401.
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.authService.login(user);
    return {
      success: true,
      data: tokens,
    };
  }

  @Public()
  @Throttle({ limit: 10, ttl: 60 })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh JWT tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refreshTokens(dto.refreshToken);
    return {
      success: true,
      data: tokens,
    };
  }

  @Public()
  @Throttle({ limit: 5, ttl: 60 })
  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a magic link for passwordless login',
    description:
      'Generates a one-time token and delivers it to the user via Resend. The token is never returned in the response (C3/REQ-auth-2).',
  })
  @ApiResponse({ status: 200, description: 'Magic link sent (out-of-band)' })
  @ApiResponse({
    status: 503,
    description: 'Magic-link delivery is unavailable',
  })
  async requestMagicLink(@Body() dto: MagicLinkRequestDto) {
    if (!this.magicLinkService.isEnabled()) {
      throw new ServiceUnavailableException(
        'Magic link authentication is disabled',
      );
    }

    const token = await this.magicLinkService.generateMagicLink(dto.email);
    const config = this.magicLinkService.getConfig();
    const ttl = config?.tokenTtl ?? 300;

    try {
      await this.resendService.sendMagicLink(dto.email, token, ttl);
    } catch {
      // Roll back the stored token so it cannot be replayed.
      await this.magicLinkService.invalidateToken(token);
      throw new ServiceUnavailableException(
        'Magic-link delivery is currently unavailable',
      );
    }

    // C3 â€” token MUST NOT appear in body or headers.
    return {
      success: true,
      data: {
        message: 'If the email exists, a magic link has been sent.',
      },
    };
  }

  @Public()
  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a magic link token' })
  @ApiResponse({
    status: 200,
    description: 'Token verified, returns JWT tokens',
  })
  async verifyMagicLink(@Body() dto: MagicLinkVerifyDto) {
    try {
      const email = await this.magicLinkService.verifyMagicLink(dto.token);
      const user = await this.authService.validateUser(email, '');

      if (user) {
        const tokens = await this.authService.login(user);
        return {
          success: true,
          data: tokens,
        };
      }

      return {
        success: false,
        message: 'User not found',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Invalid token',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify JWT token and return user data' })
  @ApiResponse({ status: 200, description: 'Token valid, returns user' })
  async verify(@Request() req: any) {
    return {
      success: true,
      data: {
        user: req.user,
      },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin-only')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin-only endpoint (demo)' })
  @ApiResponse({ status: 200, description: 'Admin access granted' })
  @ApiResponse({ status: 403, description: 'Forbidden â€” not an admin' })
  async adminEndpoint() {
    return {
      success: true,
      message: 'Admin access granted',
    };
  }
}
