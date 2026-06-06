# ADR-001: Adoptar arquitectura modular monolith para el backend MVP

## Status
Accepted

## Context
El MVP de la plataforma no-code de analitica de riesgo crediticio necesita entregar canvas visual, ejecucion secuencial de pipelines, nodos analiticos, chat IA, exportacion y trazabilidad, todo en un despliegue simple sobre una sola maquina.

La arquitectura debe funcionar con `FastAPI`, `Python`, `SQLite` y almacenamiento local, evitando complejidad operativa innecesaria mientras el producto valida su valor en un piloto interno acotado.

## Decision
Se adopta una arquitectura de tipo `modular monolith` para `apps/api`.

El backend se organizara en modulos de dominio y soporte claramente separados, pero desplegados como una sola unidad de aplicacion.

## Consequences

### Positive
- Menor complejidad operativa para el MVP.
- Despliegue mas simple en una sola maquina.
- Menor costo de coordinacion entre componentes.
- Mejor ajuste al uso de `SQLite`, filesystem local y runner secuencial.
- Facilita trazabilidad end-to-end dentro de un unico backend.

### Negative
- Menor escalado independiente por dominio.
- Mayor acoplamiento de runtime que en microservices.
- El host unico se mantiene como punto unico de falla.
- Requiere disciplina interna para no convertir el monolito en un bloque poco mantenible.

### Neutral
- El frontend permanece separado como `apps/web`, aunque el backend se despliegue como una sola unidad.
- La evolucion futura hacia servicios separados queda abierta.

## Alternatives Considered

**Microservices**
- Rechazado: introduce complejidad de red, observabilidad, contratos y despliegue que no aporta valor suficiente para el piloto.

**Event-driven desde el inicio**
- Rechazado: el flujo del MVP es mayormente secuencial y determinista, por lo que un bus de eventos agrega complejidad antes de validar el producto.

**Serverless**
- Rechazado: reduce control sobre procesos largos, filesystem local y dependencias analiticas, y no encaja bien con un despliegue en una sola maquina.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
