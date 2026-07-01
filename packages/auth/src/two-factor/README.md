# Two-Factor Authentication (2FA)

Módulo de autenticación de dos factores compatible con Google Authenticator, Authy y otras aplicaciones TOTP.

## Características

- **TOTP (Time-based One-Time Password)**: Códigos de 6 u 8 dígitos compatibles con Google Authenticator
- **Backup Codes**: 10 códigos únicos hasheados para recuperación
- **QR Code**: Generación automática de códigos QR para escaneo
- **Configuración flexible**: Algoritmo, dígitos, período ajustables

## Instalación

El módulo se instala automáticamente con `@common/auth`. Dependencias necesarias:

```bash
npm install otplib qrcode
npm install -D @types/qrcode
```

## Configuración

### Variables de Entorno

```env
# Two Factor Authentication
TWO_FACTOR_ISSUER=MyApp
TWO_FACTOR_ALGORITHM=SHA1
TWO_FACTOR_DIGITS=6
TWO_FACTOR_PERIOD=30
TWO_FACTOR_STEP=30
TWO_FACTOR_BACKUP_CODES_COUNT=10
TWO_FACTOR_BACKUP_CODES_LENGTH=10
```

## Uso

### Importar el Módulo

```typescript
// app.module.ts
import { AuthModule, TwoFactorModule } from '@common/auth';

@Module({
  imports: [AuthModule, TwoFactorModule],
})
export class AppModule {}
```

### Inyectar el Servicio

```typescript
import { TwoFactorService } from '@common/auth';

@Injectable()
export class MyService {
  constructor(private readonly twoFactorService: TwoFactorService) {}
}
```

## API Endpoints

| Método | Endpoint                            | Descripción                  | Auth    |
| ------ | ----------------------------------- | ---------------------------- | ------- |
| POST   | `/auth/2fa/generate`                | Generar secreto y QR         | JWT     |
| POST   | `/auth/2fa/enable`                  | Habilitar 2FA con código     | JWT     |
| POST   | `/auth/2fa/verify`                  | Verificar código TOTP        | JWT     |
| POST   | `/auth/2fa/verify-backup`           | Verificar código de respaldo | Público |
| POST   | `/auth/2fa/regenerate-backup-codes` | Regenerar códigos            | JWT     |
| POST   | `/auth/2fa/disable`                 | Deshabilitar 2FA             | JWT     |
| POST   | `/auth/2fa/status`                  | Estado de 2FA                | JWT     |

## Flujo de Implementación

### 1. Generar Secreto y QR Code

```typescript
// En tu servicio de usuario
async setupTwoFactor(userId: string, userEmail: string) {
  const result = await this.twoFactorService.generateSecret(userEmail);

  return {
    secret: result.secret,        // Clave secreta (guardar en BBDD)
    qrCode: result.qrCode,       // Imagen base64 del QR
    backupCodes: result.backupCodes, // Guardar estos códigos
  };
}
```

### 2. Habilitar 2FA

```typescript
// El usuario escanea el QR y provee el código
async enableTwoFactor(userId: string, code: string) {
  const result = await this.twoFactorService.enableTwoFactor(userId, code);

  if (result.success) {
    // Guardar los backupCodes de forma segura
    // Mostrar al usuario los códigos de respaldo
    return {
      enabled: true,
      backupCodes: result.backupCodes,
    };
  }

  throw new BadRequestException('Código 2FA inválido');
}
```

### 3. Verificar en Login

```typescript
async verifyLogin(userId: string, code: string) {
  // Verificar código TOTP
  const result = await this.twoFactorService.verifyCode(userId, code);

  if (!result.valid) {
    throw new UnauthorizedException('Código 2FA inválido');
  }

  // Login exitoso
  return this.generateTokens(userId);
}
```

### 4. Verificar con Backup Code

```typescript
async loginWithBackupCode(userId: string, backupCode: string) {
  const isValid = await this.twoFactorService.verifyBackupCodeWithUser(
    userId,
    backupCode,
  );

  if (!isValid) {
    throw new UnauthorizedException('Código de respaldo inválido');
  }

  // Permitir login
  return this.generateTokens(userId);
}
```

## Backup Codes

Los códigos de respaldo son:

- **10 códigos únicos** generados por defecto
- **Hash con SHA-256** antes de almacenar
- **Un solo uso**: se marcan como usados tras verificar
- **Longitud configurable**: 10 caracteres por defecto

### Almacenamiento Recomendado

```typescript
interface User2FA {
  userId: string;
  secret: string; // Secreto TOTP (encriptado)
  isEnabled: boolean;
  enabledAt: Date;
  backupCodes: {
    code: string; // Hash SHA-256
    isUsed: boolean;
    usedAt?: Date;
  }[];
}
```

## Verificación Manual

Si el usuario no tiene la app, puede verificar con:

```typescript
// 1. Solicitar código de respaldo
// 2. Verificar el backup code
const isValid = await twoFactorService.verifyBackupCodeWithUser(
  userId,
  backupCodeInput,
);
```

## Estados de Verificación

```typescript
interface TwoFactorVerifyResult {
  valid: boolean; // true si el código TOTP es válido
  requiresBackupCode?: boolean; // Indica si debe usar backup
}
```

## Configuración Avanzada

```typescript
// En auth.config.ts
{
  twoFactor: {
    issuer: 'MyApp',           // Nombre de la app
    algorithm: 'SHA1',         // SHA1, SHA256, SHA512
    digits: 6,                 // 6 u 8 dígitos
    period: 30,                // Segundos de validez
    step: 30,
    backupCodes: {
      count: 10,               // Cantidad de códigos
      length: 10,              // Longitud de cada código
    },
  },
}
```

## Compatibilidad

- ✅ Google Authenticator
- ✅ Authy
- ✅ Microsoft Authenticator
- ✅ 1Password
- ✅ Cualquier app compatible con TOTP (RFC 6238)

## Seguridad

- Secretos almacenados en memoria (en implementación real, usar BBDD encriptada)
- Backup codes hasheados con SHA-256
- Códigos de un solo uso
- Periodo de validez de 30 segundos (estándar)
