
# Plan de Migración JSDoc — Fase 3

> Guía para documentar los **376 exports públicos** detectados por `scripts/audit-docs.js` con cobertura actual 0% y target >=80%.

## Objetivo

Pasar de **0% → 80%+** de cobertura JSDoc en metodos publicos. La regla ESLint `ai-readiness/require-public-jsdoc` actualmente detecta todos los gaps como `warn` — promovra a `error` post-Fase 3.

## Estrategia Recomendada

Procesar paquete por paquete, siguiendo el orden de **mayor impacto en LLM**:

| # | Paquete | Metodos | Prioridad | Justificacion |
|---|---------|---------|-----------|---------------|
| 1 | `@common/database` | 33 | Alta | Core de toda la app (transacciones son criticas) |
| 2 | `@common/common` | 25 | Alta | Utilidades transversales (HttpError, BaseAdapter) |
| 3 | `@common/playwright` | 19 | Media | API pequena, facil de cubrir completa |
| 4 | `@common/auth` | 104 | Alta | Volumen mayor, pero flujos bien delimitados |
| 5 | `@common/ai` | 33 | Media | API publica estable |
| 6 | `@common/http` | 27 | Media | Cliente HTTP con shapes conocidas |
| 7 | `@common/documents` | 17 | Baja | Pocos metodos publicos |
| 8 | `@common/resend` | 30 | Media | Newsletter y sendEmail |
| 9 | `@common/serve-static` | 12 | Baja | API pequena |
| 10 | `@common/inngest` | 10 | Baja | Ya marcado `complete` (verificar nada mas) |
| 11 | `apps/nominas/usuarios` | ~25 | Alta | Ejemplo del repo, deberia liderar |
| 12 | `apps/nominas/dynamic-schema` | ~25 | Media | Multi-flujo |

## Template JSDoc

Para cada metodo publico, usar este formato minimo:

```typescript
/**
 * Descripcion de UNA LINEA (que hace, no como).
 *
 * Descripcion extendida opcional con casos de uso, ejemplo, o referencia
 * a documentacion externa si aplica.
 *
 * @param paramName - Descripcion del parametro (incluir tipo si no es obvio).
 * @param otherParam - Otro parametro. Default: `valor`.
 * @returns Descripcion del valor de retorno. Incluir shape (`Promise<T>`).
 * @throws {HttpError} Cuando `statusCode === 404`, por ejemplo.
 * @throws {NotFoundException} (NestJS) Cuando no se encuentra el recurso.
 *
 * @example
 * // Uso tipico:
 * const result = await service.methodName('input');
 *
 * @see {@link OtroMetodo} para comportamiento relacionado.
 */
async methodName(paramName: string, otherParam = 'default'): Promise<ReturnType> {
  // ...
}
```

## Reglas Mnemonicas

- **WHAT antes que HOW**: La descripcion dice QUE hace el metodo, no como lo implementa.
- **Primera linea completa**: Linea 1 del JSDoc debe ser una frase autocontenida.
- **No repetir el nombre**: `/** Envia un email. */` no es valido si el metodo se llama `sendEmail` — debe agregar valor.
- **@returns obligatorio**: Aunque sea `Promise<void>` — describe el efecto.
- **@throws especifico**: Si lanza `HttpError(404)`, decirlo explicitamente.
- **Sin informacion falsa**: Si no estas seguro, marca `@todo document better` y vuelve despues.
- **Idioma**: Espanol o ingles consistente. Actual proyecto mezcla ambos; preferir **ingles** para JSDoc (es lo que esperan las herramientas).

## Workflow por Paquete

```bash
# 1. Ver gaps exactos
npm run audit:docs -- --json

# 2. Documentar manualmente en el archivo
$EDITOR packages/auth/src/auth.service.ts
# Agregar JSDoc a cada metodo listado

# 3. Verificar progreso (debe bajar gap-files)
npm run audit:docs

# 4. Validar build
npm run build

# 5. Lint
npx eslint packages/auth/src

# 6. Marcar status del paquete
# Editar packages/auth/README.md primera linea:
# <!-- @common/auth — status: complete -->
```

## Atajos

### Para constructores

```typescript
/**
 * Servicio de autenticacion principal.
 *
 * Encapsula la logica de hash con Argon2, validacion de credenciales,
 * emision de tokens JWT y rotacion de refresh tokens.
 *
 * @param usersRepository - Repositorio de usuarios (mockeable en tests).
 */
constructor(private readonly usersRepository: UsersRepository) {}
```

### Para metodos que delegan

```typescript
/**
 * @see {@link JwtStrategy.validate} para la logica de validacion.
 */
async validate(token: string): Promise<User> {
  return this.jwtStrategy.validate(token);
}
```

### Para metodos privados

NO documentar (la regla ESLint los excluye). Si el nombre no es autodescriptivo, renombrar.

## Metricas de Exito

- `npm run audit:docs --strict` retorna exit 0
- `npx eslint packages/*/src apps/*/src` sin warnings de `ai-readiness/require-public-jsdoc`
- 0 falsos positivos en la regla (metodos privados no deberian warning-ear)
- Tiempo total < 16h para los 376 metodos (~2.5min por metodo)

## Despues de Completar

1. Cambiar regla ESLint de `warn` → `error` en `eslint.config.mjs`.
2. Commit con mensaje `docs(@common/X): add JSDoc coverage` o `feat(docs): JSDoc Phase 3 complete`.
3. Actualizar `CHANGELOG.md` con entrada v0.4.0.
4. Cerrar el change OpenSpec `documentation-llm-readiness-audit` (mover a `archive/`).
