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

/**
 * Contract that a consumer (e.g. UsuariosService) must implement to
 * replace the demo stub in AuthService.  Return `null` when the user
 * is not found — AuthService will fall back to the stub automatically.
 */
export interface IUserService {
  findByEmail(email: string): Promise<{
    id: string;
    email: string;
    password: string;
    roles: string[];
  } | null>;
}

/** Injection token for the optional IUserService provider. */
export const USER_SERVICE = Symbol('USER_SERVICE');

export type { IRefreshTokenStore } from './refresh-token-store.interface';
export { REFRESH_TOKEN_STORE } from './refresh-token-store.interface';