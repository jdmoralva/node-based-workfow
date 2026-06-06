# ADR-006: Centralizar las integraciones LLM en el backend

## Status
Accepted

## Context
El MVP incluye chat IA para ayuda contextual, interpretacion de resultados y consulta del portafolio.

Estas capacidades requieren acceso a contexto de negocio, resultados de ejecuciones, RAG y NL2SQL, ademas de guardrails y trazabilidad tecnica.

## Decision
Todas las integraciones con LLM se centralizaran en `apps/api`.

El frontend `apps/web` solo enviara el mensaje, el modo de chat y el contexto funcional necesario, sin administrar prompts sensibles ni ejecutar logica LLM directamente.

## Consequences

### Positive
- Protege prompts, guardrails y logica de acceso a datos.
- Simplifica el frontend.
- Facilita trazabilidad y auditoria tecnica.
- Permite aplicar validaciones y restricciones de seguridad en un unico punto.
- Reduce el riesgo de exponer SQL, contexto interno o razonamiento intermedio al usuario.

### Negative
- El backend asume mayor responsabilidad funcional.
- Se incrementa el acoplamiento de las capacidades de chat al servicio API.
- Requiere buena disciplina para separar orquestacion, recuperacion y generacion.

### Neutral
- La integracion con distintos proveedores o modelos puede cambiar sin modificar el contrato principal del frontend.
- El frontend permanece como consumidor pasivo de respuestas ya filtradas y consolidadas.

## Alternatives Considered

**LLM directo desde el frontend**
- Rechazado: expone prompts y claves potenciales, dificulta guardrails y complica la trazabilidad.

**LLM distribuido entre frontend y backend**
- Rechazado: fragmenta la logica sensible y aumenta el riesgo de inconsistencia.

**Servicio LLM externo dedicado desde el MVP**
- Rechazado: agrega complejidad operacional innecesaria para un piloto interno en una sola maquina.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
