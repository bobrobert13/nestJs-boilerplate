/**
 * Stored WebAuthn credential after successful registration.
 */
export interface PasskeyCredential {
  /** Unique credential identifier */
  id: string;
  /** Base64-encoded public key */
  publicKey: string;
  /** Signature counter for replay protection */
  counter: number;
  /** Device type (e.g. 'platform', 'cross-platform') */
  deviceType: string;
  /** Whether the credential is backed up (synced) */
  backedUp: boolean;
  /** Whether the origin was considered secure during creation */
  isInsideSecureOrigin: boolean;
  /** User ID that owns this credential */
  userId: string;
  /** When the credential was created */
  createdAt: Date;
}

/**
 * Input parameters for generating registration options.
 */
export interface PasskeyRegistrationOptions {
  /** User to register the passkey for */
  userId: string;
  /** Username for the credential */
  username: string;
}

/**
 * Input parameters for generating authentication options.
 */
export interface PasskeyAuthenticationOptions {
  /** Optional user ID to scope the credential list */
  userId?: string;
}

/**
 * Result of a passkey authentication verification.
 */
export interface PasskeyVerifyResult {
  /** Whether authentication was successful */
  valid: boolean;
  /** Authenticated user ID (set on success) */
  userId?: string;
  /** Error message (set on failure) */
  error?: string;
}