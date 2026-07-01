import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

/**
 * DTO for user registration requests.
 */
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}

/**
 * DTO for credential-based login requests.
 */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

/**
 * DTO for refreshing an expired access token.
 */
export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

/**
 * DTO for requesting a passwordless magic link.
 */
export class MagicLinkRequestDto {
  @IsEmail()
  email: string;
}

/**
 * DTO for verifying a magic link token.
 */
export class MagicLinkVerifyDto {
  @IsString()
  token: string;
}

/**
 * DTO for initiating a password reset flow.
 */
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

/**
 * DTO for completing a password reset with a new password.
 */
export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  newPassword: string;
}