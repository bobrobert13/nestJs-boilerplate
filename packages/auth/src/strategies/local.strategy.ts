import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';

/**
 * Passport strategy for email/password (local) authentication.
 *
 * @description Configures passport-local to use `email` as the username
 * field. Delegates credential validation to {@link AuthService.validateUser}
 * and attaches the returned user to `req.user`.
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * Validates credentials extracted from the request body.
   *
   * @param email - User's email address (mapped from the `email` field)
   * @param password - Plaintext password from the request
   * @returns The authenticated user object
   * @throws UnauthorizedException if credentials are invalid
   */
  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}