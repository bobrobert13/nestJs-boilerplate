import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { MagicLinkService } from '../services/magic-link.service';
import { Public } from '../decorators/public.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../rbac/roles.guard';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  MagicLinkRequestDto,
  MagicLinkVerifyDto,
} from '../dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly magicLinkService: MagicLinkService,
  ) {}

  @Public()
  @Post('register')
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
  async adminEndpoint() {
    return {
      success: true,
      message: 'Admin access granted',
    };
  }
}