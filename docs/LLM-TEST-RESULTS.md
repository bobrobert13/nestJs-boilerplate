# LLM Orientation Test Results

> Self-evaluation: el script busca en la documentacion del proyecto
> que elementos esperados estan disponibles para responder 10 preguntas
> realistas que un developer haria a un LLM sobre el codebase.

## Resumen

| Metrica | Valor |
|---------|-------|
| Casos evaluados | 10 |
| Score promedio ponderado | **91%** |
| Score promedio simple | 91% |
| Tiempo total | 1170ms |
| Total chars leidos | 932.500 |
| Casos >=80% | 8/10 |
| Casos <50% | 0/10 |
| Costo GPT-4o (10 runs) | $1.3156 |
| Costo Claude Sonnet (10 runs) | $0.8494 |

## Tabla de Resultados por Caso

| ID | Pregunta | Precision | Encontrados/Faltantes |
|----|----------|-----------|------------------------|
| Q1 | Donde esta la conexion MongoDB? Como se configura con retry? | 57% | 4/7 |
| | _faltantes_ | | packages/database/src/database.service.ts, connectWithRetry, withRetry |
| Q2 | Que dependencias debo agregar para usar transacciones MongoD... | 67% | 4/6 |
| | _faltantes_ | | TransactionOptions, ClientSession |
| Q3 | Cuales son los endpoints REST del modulo usuarios? | 100% | 10/10 |
| | _faltantes_ | | (ninguno) |
| Q4 | Que providers de AI soporta el wrapper @common/ai? | 100% | 7/7 |
| | _faltantes_ | | (ninguno) |
| Q5 | Como creo un nuevo modulo siguiendo las convenciones del pro... | 100% | 7/7 |
| | _faltantes_ | | (ninguno) |
| Q6 | Que tipos de error HTTP puedo lanzar desde @common/common? | 100% | 9/9 |
| | _faltantes_ | | (ninguno) |
| Q7 | Cual es el contrato del endpoint POST /api/dynamic-schema/pi... | 88% | 7/8 |
| | _faltantes_ | | compileSchema |
| Q8 | Como lanzo Playwright en modo headless y que variables lo co... | 100% | 6/6 |
| | _faltantes_ | | (ninguno) |
| Q9 | Como envio un email transaccional con @common/resend? | 100% | 7/7 |
| | _faltantes_ | | (ninguno) |
| Q10 | Cuales son las variables de entorno requeridas para arrancar... | 100% | 7/7 |
| | _faltantes_ | | (ninguno) |

## Conclusion

**Score ponderado: 91%** - Excelente cobertura documental.

## Conclusion sobre Fase 3

**Fase 3 (JSDoc asistida) NO es estrictamente necesaria** dado que la documentacion estructurada (specs + READMEs + sidecars) ya cubre 91% de las preguntas comunes.

_Generado: 2026-07-13T00:06:14.382Z_