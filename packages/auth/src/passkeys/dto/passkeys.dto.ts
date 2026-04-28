import { IsString, IsOptional } from 'class-validator';

export class RegisterPasskeyDto {
  @IsString()
  username: string;
}

export class VerifyPasskeyDto {
  @IsString()
  credentialId: string;

  @IsString()
  userId: string;
}

export class LoginWithPasskeyDto {
  @IsOptional()
  @IsString()
  userId?: string;
}