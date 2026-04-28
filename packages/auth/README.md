# @common/auth - Authentication Module

Authentication module for NestJS with JWT, Magic Links, and OAuth support.

## Features

- **JWT Authentication** - Stateless token-based authentication
- **Magic Links** - Passwordless authentication via email links
- **Role-based Access Control** - Guards and decorators for authorization
- **Refresh Tokens** - Token renewal support

## Installation

```bash
npm install @common/auth
```

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_ACCESS_TOKEN_TTL=900
JWT_REFRESH_TOKEN_TTL=604800
JWT_ISSUER=your-app-name
JWT_AUDIENCE=your-app-name

# Magic Link (Passwordless)
MAGIC_LINK_ENABLED=true
MAGIC_LINK_TOKEN_TTL=300

# OAuth (Optional)
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=
OAUTH_GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# Password Hashing
BCRYPT_SALT_ROUNDS=12
```

## Quick Start

### 1. Import AuthModule

```typescript
// app.module.ts
import { AuthModule } from '@common/auth';

@Module({
  imports: [
    AuthModule,
    // other modules...
  ],
})
export class AppModule {}
```

### 2. Use JWT Authentication

```typescript
//Protect routes with JWT
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@common/auth';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get('data')
  getData() {
    return { message: 'Protected data' };
  }
}
```

### 3. Public Routes

```typescript
import { Public } from '@common/auth';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  async login() {
    // Public endpoint - no JWT required
  }
}
```

### 4. Role-based Access

```typescript
import { Roles, RolesGuard } from '@common/auth';

@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  @Roles('admin')
  @Post('settings')
  updateSettings() {
    // Only admin role can access
  }
}
```

## Services

### AuthService

Core authentication operations.

```typescript
import { AuthService } from '@common/auth';

@Injectable()
export class MyService {
  constructor(private readonly authService: AuthService) {}

  async login(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (user) {
      return this.authService.login(user);
    }
  }

  async register(email: string, password: string, name?: string) {
    return this.authService.register(email, password, name);
  }

  async refreshTokens(refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  async hashPassword(password: string) {
    return this.authService.hashPassword(password);
  }

  async comparePassword(password: string, hash: string) {
    return this.authService.comparePassword(password, hash);
  }
}
```

### MagicLinkService

Passwordless authentication via magic links.

```typescript
import { MagicLinkService } from '@common/auth';

@Injectable()
export class AuthService {
  constructor(private readonly magicLinkService: MagicLinkService) {}

  async requestMagicLink(email: string) {
    if (this.magicLinkService.isEnabled()) {
      const token = await this.magicLinkService.generateMagicLink(email);
      // Send email with magic link containing token
      return token;
    }
    throw new Error('Magic link disabled');
  }

  async verifyMagicLink(token: string) {
    const email = await this.magicLinkService.verifyMagicLink(token);
    // Login user with verified email
    return email;
  }
}
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login with email/password | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/magic-link/request` | Request magic link | Public |
| POST | `/auth/magic-link/verify` | Verify magic link | Public |
| POST | `/auth/logout` | Logout user | JWT |
| POST | `/auth/verify` | Verify JWT token | JWT |

## Decorators

### @Public()

Mark routes as public (skip JWT validation).

```typescript
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

### @Roles(...roles)

Require specific roles for access.

```typescript
@Roles('admin', 'moderator')
@Post('admin-action')
adminAction() {
  return { message: 'Admin action performed' };
}
```

## Guards

### JwtAuthGuard

Protects routes with JWT authentication.

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;
}
```

### RolesGuard

Enforces role-based access control.

```typescript
@UseGuards(RolesGuard)
@Roles('admin')
@Get('admin-panel')
adminPanel() {
  return { data: 'admin panel' };
}
```

## Example: Full Authentication Flow

```typescript
// auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '@common/auth';
import { Public } from '@common/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() { email, password }) {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Public()
  @Post('register')
  async register(@Body() { email, password, name }) {
    const user = await this.authService.register(email, password, name);
    return { user };
  }

  @Post('refresh')
  async refresh(@Body() { refreshToken }) {
    return this.authService.refreshTokens(refreshToken);
  }
}
```

## User Object in Request

When using JwtAuthGuard, the request user object contains:

```typescript
interface AuthenticatedUser {
  id: string;      // User ID from JWT sub claim
  email: string;   // User email
  roles: string[]; // User roles
}
```

## Token Payload

JWT tokens contain:

```typescript
interface JwtPayload {
  sub: string;      // User ID
  email: string;   // User email
  roles?: string[];// User roles
  iat?: number;     // Issued at
  exp?: number;     // Expiration
}
```