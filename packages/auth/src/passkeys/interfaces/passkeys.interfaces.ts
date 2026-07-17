export interface PasskeyCredential {
  id: string;
  publicKey: string;
  counter: number;
  deviceType: string;
  backedUp: boolean;
  isInsideSecureOrigin: boolean;
  userId: string;
  createdAt: Date;
}

export interface PasskeyRegistrationOptions {
  userId: string;
  username: string;
}

export interface PasskeyAuthenticationOptions {
  userId?: string;
}

export interface PasskeyVerifyResult {
  valid: boolean;
  userId?: string;
  error?: string;
}
