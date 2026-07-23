import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import {
  PasskeyCredential,
  PasskeyVerifyResult,
} from './interfaces/passkeys.interfaces';
import { PasskeyChallengeStore } from './passkey-challenge.store';

/** ponytail: Base64URLString is a branded `string` type not re-exported by v10 barrel; local alias suffices for demo. */
type Base64URLString = string;

/**
 * WebAuthn/Passkeys service for passwordless authentication.
 * Manages credential registration and verification using @simplewebauthn/server.
 *
 * Flow:
 * 1. Registration: generateRegistrationOptions() → client creates credential → verifyRegistration()
 * 2. Authentication: generateAuthenticationOptions() → client signs challenge → verifyAuthentication()
 *
 * Challenges are stored via PasskeyChallengeStore to prevent replay attacks.
 */
@Injectable()
export class PasskeysService implements OnModuleInit {
  private readonly logger = new Logger(PasskeysService.name);
  private readonly credentials: Map<string, PasskeyCredential> = new Map();
  private rpId: string = 'localhost';
  private rpName: string = 'MyApp';
  private rpOrigin: string = 'http://localhost:3000';

  constructor(
    private readonly configService: ConfigService,
    private readonly challengeStore: PasskeyChallengeStore,
  ) {}

  onModuleInit() {
    const config = this.configService.get<{ passkeys: any }>('auth');
    if (config?.passkeys) {
      this.rpId = config.passkeys.rpId || this.rpId;
      this.rpName = config.passkeys.rpName || this.rpName;
      this.rpOrigin = config.passkeys.rpOrigin || this.rpOrigin;
    }
    this.logger.log(
      `âœ… PasskeysService initialized - RP: ${this.rpName} (${this.rpId})`,
    );
  }

  /**
   * Generate WebAuthn registration options for a new passkey.
   * Stores the challenge for later verification.
   *
   * @param userId - User ID to register the passkey for
   * @param username - Username for the credential
   * @returns Registration options to send to the client
   */
  async generateRegistrationOptions(userId: string, username: string) {
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userID: new TextEncoder().encode(userId),
      userName: username,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
    });

    // PR3 / C1 / REQ-auth-crypto-2 â€” store the generated challenge so
    // verification can retrieve the SAME value instead of minting a fresh one.
    this.challengeStore.put(userId, options.challenge);

    this.logger.debug(`Generated registration options for userId=${userId}`);
    return options;
  }

  /**
   * Verify a WebAuthn registration response from the client.
   * Consumes the stored challenge and stores the credential on success.
   *
   * @param userId - User ID registering the passkey
   * @param username - Username for the credential
   * @param response - WebAuthn registration response from the client
   * @returns Object with verified flag and credentialId on success
   */
  async verifyRegistration(
    userId: string,
    username: string,
    response: any,
  ): Promise<{ verified: boolean; credentialId?: string }> {
    try {
      // PR3 / C1 â€” pull the same challenge stored at options time.
      const expectedChallenge = this.challengeStore.take(userId);
      if (!expectedChallenge) {
        this.logger.warn(
          `No stored challenge for userId=${userId}; cannot verify`,
        );
        return { verified: false };
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.rpOrigin,
        expectedRPID: this.rpId,
      });

      if (!verification.verified || !verification.registrationInfo) {
        this.logger.warn(
          `Registration verification failed for user: ${username}`,
        );
        return { verified: false };
      }

      const info = verification.registrationInfo;
      const credential: PasskeyCredential = {
        id: info.credentialID,
        publicKey: Buffer.from(info.credentialPublicKey).toString('base64'),
        counter: info.counter,
        deviceType: info.credentialDeviceType || 'unknown',
        backedUp: info.credentialBackedUp,
        isInsideSecureOrigin: false,
        userId,
        createdAt: new Date(),
      };

      this.credentials.set(credential.id, credential);
      this.logger.log(`Passkey registered for user: ${username}`);
      return { verified: true, credentialId: credential.id };
    } catch (error) {
      this.logger.error(
        `Passkey registration failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { verified: false };
    }
  }

  /**
   * Generate WebAuthn authentication options for passkey login.
   * Stores the challenge for later verification.
   *
   * @param userId - Optional user ID (if known) to limit allowed credentials
   * @returns Authentication options to send to the client
   */
  async generateAuthenticationOptions(userId?: string) {
    const userCredentials = userId ? this.getCredentialsForUser(userId) : [];
    const allowCredentials =
      userCredentials.length > 0
        ? userCredentials.map((cred) => ({
            id: cred.id,
            type: 'public-key' as const,
          }))
        : undefined;

    const options = await generateAuthenticationOptions({
      timeout: 60000,
      rpID: this.rpId,
      userVerification: 'preferred',
      challenge: this.generateChallenge(),
      allowCredentials,
    });

    // PR3 / C1 â€” store the auth challenge for verification.
    if (userId) {
      this.challengeStore.put(userId, options.challenge);
    }

    this.logger.debug(
      `Generated authentication options for userId: ${userId || 'any'}`,
    );
    return options;
  }

  /**
   * Verify a WebAuthn authentication response from the client.
   * Consumes the stored challenge and updates the credential counter.
   *
   * @param userId - User ID authenticating
   * @param credentialId - Credential ID used for authentication
   * @param response - WebAuthn authentication response from the client
   * @returns PasskeyVerifyResult with valid flag and userId or error
   */
  async verifyAuthentication(
    userId: string,
    credentialId: string,
    response: any,
  ): Promise<PasskeyVerifyResult> {
    try {
      const credential = this.credentials.get(credentialId);

      if (!credential) {
        this.logger.warn(`Credential not found: ${credentialId}`);
        return { valid: false, error: 'Credential not found' };
      }

      // PR3 / C1 â€” pull the same challenge stored at options time.
      const expectedChallenge = this.challengeStore.take(userId);
      if (!expectedChallenge) {
        return { valid: false, error: 'Challenge expired or missing' };
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: this.rpOrigin,
        expectedRPID: this.rpId,
        authenticator: {
          credentialID: credential.id,
          credentialPublicKey: new Uint8Array(
            Buffer.from(credential.publicKey, 'base64'),
          ),
          counter: credential.counter,
        },
        requireUserVerification: false,
      });

      if (!verification.verified || !verification.authenticationInfo) {
        this.logger.warn(
          `Authentication verification failed for user: ${userId}`,
        );
        return { valid: false, error: 'Authentication verification failed' };
      }

      credential.counter = verification.authenticationInfo.newCounter;
      this.credentials.set(credentialId, credential);

      this.logger.log(`Passkey authentication successful for user: ${userId}`);
      return { valid: true, userId };
    } catch (error) {
      this.logger.error(
        `Passkey authentication failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  /**
   * Get all passkey credentials registered for a user.
   * @param userId - User ID to query
   * @returns Array of PasskeyCredential objects
   */
  async getUserPasskeys(userId: string): Promise<PasskeyCredential[]> {
    return Array.from(this.credentials.values()).filter(
      (c) => c.userId === userId,
    );
  }

  /**
   * Delete a passkey credential for a user.
   * @param userId - Owner user ID
   * @param credentialId - Credential ID to delete
   * @returns true if deleted, false if not found or not owned by user
   */
  async deletePasskey(userId: string, credentialId: string): Promise<boolean> {
    const credential = this.credentials.get(credentialId);
    if (!credential || credential.userId !== userId) {
      return false;
    }
    this.credentials.delete(credentialId);
    this.logger.log(`Passkey deleted for user: ${userId}`);
    return true;
  }

  private generateChallenge(): string {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
      'base64',
    );
  }

  private getStoredChallenge(_userId: string): Base64URLString {
    return this.generateChallenge() as Base64URLString;
  }

  private getCredentialsForUser(userId: string): PasskeyCredential[] {
    return Array.from(this.credentials.values()).filter(
      (c) => c.userId === userId,
    );
  }
}
