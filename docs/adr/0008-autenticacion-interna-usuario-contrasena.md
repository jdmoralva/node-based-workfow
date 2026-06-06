# ADR-008: Implementar autenticacion interna con usuario y contrasena

## Status
Accepted

## Context
El MVP se utiliza como aplicacion interna para una sola area del piloto y requiere control de acceso basico para proteger el uso de datasets, ejecuciones, consultas al portafolio y exportaciones.

La arquitectura del MVP ya asume una `cookie` segura y `HTTP-only` para gestionar la sesion autenticada.

## Decision
Se implementara autenticacion interna basada en usuario y contrasena.

Las credenciales se gestionaran en el backend y la identidad del usuario se persistira en la base `SQLite` de aplicacion.

## Consequences

### Positive
- Control de acceso sencillo y suficiente para el piloto.
- No requiere integracion temprana con SSO corporativo.
- Encaja bien con el despliegue en una sola maquina.
- Permite asociar la identidad del usuario con sesiones de chat y trazabilidad operativa.
- Reduce la superficie de exposicion de credenciales al mantener la sesion en backend.

### Negative
- No ofrece federacion de identidad empresarial.
- Requiere gestion interna de altas, bajas y cambios de contrasena.
- La seguridad depende de una implementacion correcta de hash, sesion y proteccion de credenciales.
- No es una solucion definitiva para un entorno de mayor escala o multi-area.

### Neutral
- La autorizacion puede permanecer minima en el MVP y evolucionar despues.
- La migracion futura a SSO o IAM corporativo sigue siendo posible sin cambiar el contrato funcional principal.

## Alternatives Considered

**SSO corporativo desde el MVP**
- Rechazado: agrega dependencias externas y complejidad innecesaria para un piloto interno acotado.

**Acceso sin autenticacion**
- Rechazado: no cumple con los requisitos basicos de control y proteccion de datos del producto.

**Autenticacion delegada a un proxy o capa externa sin gestion interna**
- Rechazado: complica la trazabilidad del MVP y no resuelve por si sola el modelo de identidad requerido por el backend.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
