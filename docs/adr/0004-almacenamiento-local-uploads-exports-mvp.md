# ADR-004: Usar almacenamiento local para `uploads` y `exports` durante el MVP

## Status
Accepted

## Context
El MVP se despliega en una sola maquina y debe manejar archivos cargados por usuarios, asi como artefactos exportados en PDF y PPT.

La prioridad del piloto es mantener simplicidad operativa y trazabilidad suficiente, sin introducir almacenamiento externo ni dependencias adicionales antes de validar el producto.

## Decision
Se utilizara almacenamiento local en el host del MVP para:

- archivos de entrada cargados por usuarios en `data/uploads/`
- archivos exportados en `data/exports/`

## Consequences

### Positive
- Implementacion y operacion simples.
- Menor complejidad de infraestructura.
- Integracion directa con el flujo de ejecucion y exportacion.
- Facilita la trazabilidad local de artefactos del MVP.
- Encaja con el despliegue en una sola maquina.

### Negative
- Dependencia directa del disco del host.
- Mayor riesgo de perdida de artefactos ante falla del servidor.
- Requiere politicas explicitas de backup y limpieza.
- No escala tan bien como un storage objeto externo.

### Neutral
- `uploads` y `exports` se tratan como activos operativos del MVP, pero con distinto valor funcional segun el caso.
- La evolucion futura podra mover estos artefactos a almacenamiento externo sin romper el contrato funcional.

## Alternatives Considered

**Storage externo tipo object storage**
- Rechazado: agrega complejidad operacional y de integracion innecesaria para el piloto.

**Base de datos como contenedor de archivos**
- Rechazado: no es una buena separacion entre metadatos estructurados y artefactos binarios.

**No persistir exports**
- Rechazado: rompe el requisito de trazabilidad y reutilizacion de resultados exportados.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
