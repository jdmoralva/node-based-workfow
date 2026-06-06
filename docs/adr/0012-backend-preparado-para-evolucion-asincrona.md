# ADR-012: Disenar el backend para evolucion futura a ejecucion asincronica mas robusta

## Status
Accepted

## Context
El MVP usa un runner local liviano y secuencial para ejecutar pipelines en background dentro del host unico.

Aunque esta solucion es suficiente para el piloto, el producto debera poder evolucionar hacia un mecanismo de ejecucion mas robusto si crecen la concurrencia, el volumen de datos o la complejidad operativa.

## Decision
El backend se diseniara con una frontera clara entre:

- registro de ejecuciones
- orquestacion de estados
- procesamiento de nodos
- persistencia de resultados

Esta separacion permitira reemplazar o ampliar el runner local por un mecanismo asincronico mas robusto en el futuro, sin cambiar el contrato funcional principal del MVP.

## Consequences

### Positive
- Facilita una migracion futura sin redisenar toda la API.
- Mantiene el MVP simple, pero no bloquea su evolucion.
- Fomenta separar orquestacion de procesamiento.
- Reduce el acoplamiento entre la interfaz de ejecucion y el mecanismo interno que la procesa.
- Ayuda a preservar trazabilidad por `Execution` y `NodeExecution`.

### Negative
- Requiere disciplina arquitectonica adicional desde el MVP.
- Puede parecer mas abstraccion de la estrictamente necesaria para un piloto pequeno.
- Obliga a pensar desde ahora en contratos y estados que soporten futuros cambios.

### Neutral
- El backend no implementa aun una cola distribuida, pero queda preparado para introducirla despues.
- La evolucion futura podra cambiar el mecanismo de procesamiento sin alterar demasiado el frontend.

## Alternatives Considered

**Cerrar el MVP sin considerar evolucion futura**
- Rechazado: incrementa el costo de una migracion posterior y favorece decisiones mas rigidas.

**Introducir una cola distribuida desde el inicio**
- Rechazado: seria prematuro para el piloto interno y aumentaria complejidad operativa sin necesidad inmediata.

**Acoplar la ejecucion al request HTTP**
- Rechazado: dificulta la evolucion hacia mecanismos asincronicos y aumenta el riesgo de timeouts.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
