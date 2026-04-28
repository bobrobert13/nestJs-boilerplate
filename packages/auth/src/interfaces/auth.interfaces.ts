export interface JwtPayload {
  sub: string;
  email: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
}

export interface RefreshTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
}
