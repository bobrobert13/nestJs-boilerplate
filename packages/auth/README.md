<!-- @common/auth — status: partial -->

# @common/auth - Authentication Module

Authentication module for NestJS with JWT, Magic Links, OAuth, 2FA and Passkeys support.

## Features

- **JWT Authentication** - Stateless token-based authentication
- **Magic Links** - Passwordless authentication via email links
- **OAuth2** - Social login (Google, GitHub)
- **2FA/TOTP** - Two-factor with Google Authenticator compatibility
- **Passkeys** - Passwordless hardware authentication (FaceID, TouchID, Windows Hello)
- **Argon2** - Secure password hashing (replaces bcrypt)
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
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=

# Password Hashing (Argon2)
ARGON2_TYPE=2
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4

# Two Factor (2FA)
TWO_FACTOR_ISSUER=MyApp
TWO_FACTOR_ALGORITHM=SHA1
TWO_FACTOR_DIGITS=6
TWO_FACTOR_PERIOD=30
TWO_FACTOR_BACKUP_CODES_COUNT=10
TWO_FACTOR_BACKUP_CODES_LENGTH=10

# Passkeys (WebAuthn)
PASSKEYS_RP_ID=localhost
PASSKEYS_RP_NAME=MyApp
PASSKEYS_RP_ORIGIN=http://localhost:3000
```

## Quick Start

### 1. Import AuthModule

```typescript
import { AuthModule } from '@common/auth';

@Module({
  imports: [AuthModule],
})
export class AppModule {}
```

### 2. Protect Routes with JWT

```typescript
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

## Password Hashing with Argon2

Argon2 is the winner of the Password Hashing Competition and is more secure than bcrypt for customer login passwords.

### Hash a Password

```typescript
const hash = await authService.hashPassword(plainPassword);
```

### Verify a Password

```typescript
const isValid = await authService.comparePassword(plainPassword, hash);
if (!isValid) {
  throw new UnauthorizedException('Invalid credentials');
}
```

### Argon2 Configuration

```env
# Argon2id algorithm (type 2)
ARGON2_TYPE=2

# Memory cost in KiB (64 MB)
ARGON2_MEMORY_COST=65536

# Number of iterations
ARGON2_TIME_COST=3

# Parallelism
ARGON2_PARALLELISM=4
```

## Passkeys (WebAuthn)

Passwordless authentication using hardware security keys, fingerprint, or face recognition.

### How It Works

1. User registers a passkey ( FaceID, TouchID, Windows Hello, security key )
2. User authenticates using the registered passkey
3. No password required - inherently secure 2FA

### Registration Flow

```typescript
// 1. Generate registration options (send to client)
const options = await passkeysService.generateRegistrationOptions(userId, username);
// Client uses options to call navigator.credentials.create()

// 2. Verify registration response
const result = await passkeysService.verifyRegistration(userId, username, response);
// Save the credential ID for later authentication
```

### Authentication Flow

```typescript
// 1. Generate authentication options
const options = await passkeysService.generateAuthenticationOptions(userId);
// Client uses options to call navigator.credentials.get()

// 2. Verify authentication response
const result = await passkeysService.verifyAuthentication(userId, credentialId, response);
if (result.valid) {
  // Login successful - issue JWT tokens
}
```

### Passkeys Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/passkeys/register-options` | Get registration options | JWT |
| POST | `/auth/passkeys/register-verify` | Verify passkey registration | JWT |
| POST | `/auth/passkeys/login-options` | Get login options | Public |
| POST | `/auth/passkeys/login-verify` | Verify passkey login | Public |
| GET | `/auth/passkeys/list` | List user's passkeys | JWT |
| DELETE | `/auth/passkeys/delete/:id` | Delete a passkey | JWT |

## 2FA (TOTP)

Two-factor authentication compatible with Google Authenticator, Authy, etc.

### Enable 2FA

```typescript
// Generate secret and QR code
const result = await twoFactorService.generateSecret(userId);
// Show QR code to user (result.qrCode is base64 image)
// User scans with authenticator app

// Enable with code verification
const enabled = await twoFactorService.enableTwoFactor(userId, code);
```

### Verify 2FA Code

```typescript
const result = await twoFactorService.verifyCode(userId, code);
if (!result.valid) {
  throw new UnauthorizedException('Invalid 2FA code');
}
```

### Backup Codes

```typescript
// User gets 10 backup codes when enabling 2FA
// Use a backup code if device is unavailable
const isValid = await twoFactorService.verifyBackupCodeWithUser(userId, backupCode);
```

### 2FA Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/2fa/generate` | Generate secret and QR | JWT |
| POST | `/auth/2fa/enable` | Enable 2FA | JWT |
| POST | `/auth/2fa/verify` | Verify TOTP code | JWT |
| POST | `/auth/2fa/verify-backup` | Verify backup code | Public |
| POST | `/auth/2fa/regenerate-backup-codes` | Regenerate codes | JWT |
| POST | `/auth/2fa/disable` | Disable 2FA | JWT |
| POST | `/auth/2fa/status` | Check 2FA status | JWT |

## Decorators

### @Public()

Skip JWT validation for a route.

```typescript
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

### @Roles(...roles)

Require specific roles.

```typescript
@Roles('admin', 'moderator')
@Post('admin-action')
adminAction() {
  return { message: 'Admin action performed' };
}
```

## Guards

### JwtAuthGuard

Protects routes requiring JWT authentication.

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

## Auth Service

```typescript
import { AuthService } from '@common/auth';

constructor(private readonly authService: AuthService) {}

// Validate user credentials
const user = await authService.validateUser(email, password);

// Login and get tokens
const tokens = await authService.login(user);

// Refresh tokens
const newTokens = await authService.refreshTokens(refreshToken);

// Hash passwords (Argon2)
const hash = await authService.hashPassword(password);
const match = await authService.comparePassword(password, hash);
```

## Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login with email/password | Public |
| POST | `/auth/refresh` | Refresh access token | Public |
| POST | `/auth/magic-link/request` | Request magic link | Public |
| POST | `/auth/magic-link/verify` | Verify magic link | Public |
| POST | `/auth/logout` | Logout user | JWT |
| POST | `/auth/verify` | Verify JWT token | JWT |

## User Object

When authenticated, `req.user` contains:

```typescript
interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
}
```

## Security Methods Supported

| Method | Description | Security Level |
|--------|-------------|----------------|
| Password + Argon2 | Secure password hashing | High |
| Magic Link | Passwordless email | High |
| 2FA/TOTP | Time-based codes | Very High |
| Passkeys | Hardware biometric | Very High |

## Compatible Clients

- **Passkeys**: FaceID, TouchID, Windows Hello, YubiKey, Google Pixel
- **2FA**: Google Authenticator, Authy, Microsoft Authenticator, 1Password