import { IsString, IsOptional } from 'class-validator';

/**
 * DTO for initiating passkey registration with a username.
 */
export class RegisterPasskeyDto {
  @IsString()
  username: string;
}

/**
 * DTO for verifying passkey registration with a credential ID.
 */
export class VerifyPasskeyDto {
  @IsString()
  credentialId: string;

  @IsString()
  userId: string;
}

/**
 * DTO for requesting passkey login options (optional user ID).
 */
export class LoginWithPasskeyDto {
  @IsOptional()
  @IsString()
  userId?: string;
}