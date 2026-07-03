import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { MagicLinkService } from '../services/magic-link.service';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../rbac/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  MagicLinkRequestDto,
  MagicLinkVerifyDto,
} from '../dto/auth.dto';

/**
 * Auth controller handling user registration, login, token refresh,
 * magic link authentication, logout, and admin-only demo routes.
 *
 * @description Exposes REST endpoints under `/auth`. Most routes are
 * marked as `@Public()` to allow unauthenticated access during
 * registration and login flows. Uses Swagger decorators for API
 * documentation.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly magicLinkService: MagicLinkService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user', description: '⚠️ DEMO: Uses hardcoded demo user. Not for production.' })
  @ApiResponse({ status: 201, description: 'User registered' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto.email, dto.password, dto.name);
    return {
      success: true,
      data: user,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with credentials', description: '⚠️ DEMO: Uses hardcoded demo user (demo@example.com / demo123).' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials',
      };
    }
    const tokens = await this.authService.login(user);
    return {
      success: true,
      data: tokens,
    };
  }

  @Public()
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
  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a magic link for passwordless login' })
  @ApiResponse({ status: 200, description: 'Magic link sent' })
  async requestMagicLink(@Body() dto: MagicLinkRequestDto) {
    if (!this.magicLinkService.isEnabled()) {
      return {
        success: false,
        message: 'Magic link authentication is disabled',
      };
    }

    const token = await this.magicLinkService.generateMagicLink(dto.email);
    
    return {
      success: true,
      data: {
        token,
        message: 'Magic link sent (check console for demo token)',
      },
    };
  }

  @Public()
  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a magic link token' })
  @ApiResponse({ status: 200, description: 'Token verified, returns JWT tokens' })
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
  @ApiResponse({ status: 403, description: 'Forbidden — not an admin' })
  async adminEndpoint() {
    return {
      success: true,
      message: 'Admin access granted',
    };
  }
}
