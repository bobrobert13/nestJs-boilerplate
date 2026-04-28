import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { Base64URLString } from '@simplewebauthn/server';
import {
  PasskeyCredential,
  PasskeyVerifyResult,
} from './interfaces/passkeys.interfaces';

@Injectable()
export class PasskeysService implements OnModuleInit {
  private readonly logger = new Logger(PasskeysService.name);
  private readonly credentials: Map<string, PasskeyCredential> = new Map();
  private rpId: string = 'localhost';
  private rpName: string = 'MyApp';
  private rpOrigin: string = 'http://localhost:3000';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const config = this.configService.get<{ passkeys: any }>('auth');
    if (config?.passkeys) {
      this.rpId = config.passkeys.rpId || this.rpId;
      this.rpName = config.passkeys.rpName || this.rpName;
      this.rpOrigin = config.passkeys.rpOrigin || this.rpOrigin;
    }
    this.logger.log(
      `✅ PasskeysService initialized - RP: ${this.rpName} (${this.rpId})`,
    );
  }

  async generateRegistrationOptions(userId: string, username: string) {
    const options = generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userID: userId,
      userName: username,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'cross-platform',
        userVerification: 'preferred',
        residentKey: 'preferred',
      },
    });

    this.logger.debug(`Generated registration options for user: ${username}`);
    return options;
  }

  async verifyRegistration(
    userId: string,
    username: string,
    response: any,
  ): Promise<{ verified: boolean; credentialId?: string }> {
    try {
      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: this.getStoredChallenge(userId),
        expectedOrigin: this.rpOrigin,
        expectedRPID: this.rpId,
      });

      const credential: PasskeyCredential = {
        id: verification.credentialID,
        publicKey: Buffer.from(verification.credentialPublicKey).toString(
          'base64',
        ),
        counter: verification.credential.counter,
        deviceType: verification.credentialDeviceType || 'unknown',
        backedUp: verification.credential.backedUp || false,
        isInsideSecureOrigin:
          verification.credential.isInsideSecureOrigin || false,
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

  async generateAuthenticationOptions(userId?: string) {
    const options = generateAuthenticationOptions({
      timeout: 60000,
      rpID: this.rpId,
      userVerification: 'preferred',
      challenge: this.generateChallenge(),
      allowCredentials: userId ? [] : undefined,
    });

    if (userId) {
      const userCredentials = this.getCredentialsForUser(userId);
      options.allowCredentials = userCredentials.map((cred) => ({
        id: cred.id,
        type: 'public-key',
      }));
    }

    this.logger.debug(
      `Generated authentication options for userId: ${userId || 'any'}`,
    );
    return options;
  }

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

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: this.getStoredChallenge(userId),
        expectedOrigin: this.rpOrigin,
        expectedRPID: this.rpId,
        credential: {
          id: credential.id,
          publicKey: Buffer.from(credential.publicKey, 'base64'),
          counter: credential.counter,
          transports: undefined,
        },
        requireUserVerification: false,
      });

      credential.counter = verification.credential.counter;
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

  async getUserPasskeys(userId: string): Promise<PasskeyCredential[]> {
    return Array.from(this.credentials.values()).filter(
      (c) => c.userId === userId,
    );
  }

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

  private getStoredChallenge(userId: string): Base64URLString {
    return this.generateChallenge() as Base64URLString;
  }

  private getCredentialsForUser(userId: string): PasskeyCredential[] {
    return Array.from(this.credentials.values()).filter(
      (c) => c.userId === userId,
    );
  }
}
