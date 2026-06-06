# ADR-009: Restringir el chat SQL a consultas de solo lectura con guardrails

## Status
Accepted

## Context
El modo `portfolio_query` del chat permite consultar el portafolio en lenguaje natural.

Como el acceso se realiza sobre una base `SQLite` de negocio, el riesgo principal es permitir consultas no controladas o acciones de escritura que alteren datos de produccion.

## Decision
El chat SQL operara exclusivamente en modo solo lectura.

El backend aplicara guardrails tecnicos antes de ejecutar cualquier consulta:

- solo consultas `SELECT`
- lista blanca de tablas permitidas
- validacion y sanitizacion del SQL generado
- limite de filas
- timeout de ejecucion
- registro interno para auditoria tecnica

## Consequences

### Positive
- Protege la base del portafolio contra escrituras accidentales o maliciosas.
- Reduce el riesgo operativo del modo de consulta.
- Hace mas predecible la respuesta del sistema.
- Permite auditar internamente las consultas sin exponer SQL al usuario.
- Facilita alinear el chat con requisitos basicos de seguridad interna.

### Negative
- Limita la flexibilidad de la consulta en lenguaje natural.
- Requiere mantenimiento de tablas permitidas y reglas de validacion.
- Puede rechazar consultas legitimas si no encajan en el conjunto permitido.
- Aumenta la responsabilidad del backend en el manejo seguro de SQL.

### Neutral
- La experiencia del usuario sigue siendo conversacional, pero la ejecucion subyacente es estrictamente estructurada.
- La politica de guardrails puede evolucionar sin cambiar el contrato principal del chat.

## Alternatives Considered

**Permitir SQL de lectura y escritura**
- Rechazado: demasiado riesgoso para un producto interno que debe proteger la base de negocio.

**No validar el SQL generado por LLM**
- Rechazado: deja la seguridad y la integridad de datos demasiado expuestas.

**Bloquear completamente el chat SQL**
- Rechazado: elimina una capacidad central del MVP.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
