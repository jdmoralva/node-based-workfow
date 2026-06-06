# ADR-011: Mantener `mode` de chat explicito en el cliente para el MVP

## Status
Accepted

## Context
El chat del MVP tiene tres modos funcionales distintos: `product_help`, `result_interpretation` y `portfolio_query`.

Cada modo activa una ruta de procesamiento diferente en backend, por lo que la seleccion del modo debe ser clara y controlada desde la interfaz.

## Decision
El cliente enviara el `mode` de forma explicita en cada mensaje de chat.

El backend no intentara inferir automaticamente el modo a partir del texto del usuario durante el MVP.

## Consequences

### Positive
- Reduce ambiguedad en la orquestacion del chat.
- Simplifica la clasificacion y el enrutamiento en backend.
- Disminuye el riesgo de enviar una consulta al flujo equivocado.
- Mejora la trazabilidad y depuracion del comportamiento del chat.
- Hace mas visible para el usuario el tipo de respuesta que espera.

### Negative
- El usuario debe elegir el modo antes de enviar el mensaje.
- Introduce una decision extra en la interfaz.
- Si el modo elegido no coincide con la intencion, la experiencia puede ser menos fluida.

### Neutral
- El backend sigue siendo responsable de validar la coherencia entre modo y mensaje.
- La politica puede evolucionar despues hacia inferencia asistida si el producto lo requiere.

## Alternatives Considered

**Inferir el modo automaticamente en backend**
- Rechazado: introduce incertidumbre y dificulta aplicar guardrails y trazabilidad por ruta.

**Ocultar el modo al usuario y resolverlo internamente**
- Rechazado: complica la depuracion y puede llevar a clasificacion incorrecta.

**Unificar todos los modos en un solo chat generico**
- Rechazado: diluye responsabilidades y aumenta el riesgo de respuestas inconsistentes.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
