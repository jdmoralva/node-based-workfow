# ADR-010: Persistir trazabilidad de datasets, ejecuciones, chat y exportaciones

## Status
Accepted

## Context
El MVP necesita soportar auditoria operativa, depuracion y reutilizacion de resultados.

Para ello, el sistema debe conservar trazabilidad suficiente de los datasets cargados, pipelines ejecutados, conversaciones de chat y exportaciones generadas.

## Decision
Se persistira trazabilidad operativa para:

- datasets registrados
- pipelines
- ejecuciones
- ejecuciones por nodo
- snapshots de seleccion
- sesiones y mensajes de chat
- exportaciones generadas

La trazabilidad se almacenara en la base `SQLite` de aplicacion y en logs correlacionables por `request_id`, `pipeline_id`, `execution_id` y `chat_session_id` cuando aplique.

## Consequences

### Positive
- Facilita auditoria y soporte operativo.
- Permite reconstruir el contexto de una ejecucion o consulta.
- Ayuda a depurar fallos por nodo o por consulta.
- Soporta reutilizacion de pipelines y resultados exportados.
- Alinea el MVP con un uso interno controlado y trazable.

### Negative
- Aumenta el volumen de metadatos a persistir.
- Requiere consistencia en el registro de eventos y estados.
- Puede introducir esfuerzo adicional para mantener limpieza y retencion.
- No sustituye una plataforma completa de observabilidad o auditoria de nivel empresarial.

### Neutral
- La trazabilidad del MVP es suficiente para operacion interna, pero podra ampliarse despues con metricas o integraciones mas avanzadas.
- Los datos de trazabilidad pueden servir como base para evolucion futura del producto.

## Alternatives Considered

**Mantener trazabilidad solo en logs**
- Rechazado: dificulta la reconstruccion estructurada de ejecuciones, chat y exports.

**Persistir solo pipelines y ejecuciones**
- Rechazado: deja fuera chat y exportaciones, que tambien forman parte del ciclo de uso del MVP.

**Usar una solucion externa de observabilidad desde el MVP**
- Rechazado: agrega complejidad innecesaria para un piloto interno en una sola maquina.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
