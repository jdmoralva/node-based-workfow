# ADR-005: Ejecutar pipelines con runner secuencial liviano

## Status
Accepted

## Context
El MVP requiere ejecutar pipelines visuales con validacion previa, orden topologico, ejecucion nodo por nodo, trazabilidad por estado y manejo simple de errores.

El sistema se despliega en una sola maquina y no necesita en esta etapa una infraestructura de colas distribuidas o un motor de jobs robusto.

## Decision
Se implementara un runner local liviano y secuencial para procesar ejecuciones de pipelines.

El backend registrara la ejecucion, devolvera un `execution_id` y procesara el trabajo en background dentro del entorno local del backend, actualizando estados y resultados de forma progresiva.

## Consequences

### Positive
- Simplifica la operacion del MVP.
- Evita introducir colas distribuidas o brokers innecesarios.
- Mantiene la ejecucion determinista y facil de depurar.
- Reduce el riesgo de timeouts HTTP al desacoplar la ejecucion del request.
- Encaja bien con trazabilidad por `Execution` y `NodeExecution`.

### Negative
- No ofrece alta concurrencia de jobs.
- El host sigue siendo un punto unico de falla.
- Si el proceso o la maquina caen, las ejecuciones en curso no se reanudan automaticamente.
- Requiere reejecucion manual tras una interrupcion.

### Neutral
- El runner puede implementarse como tarea en background dentro del backend o como proceso local equivalente, siempre que se preserve el contrato funcional del MVP.
- La evolucion futura puede migrar a un sistema de jobs mas robusto sin cambiar la API publica de alto nivel.

## Alternatives Considered

**Ejecucion inline dentro del request**
- Rechazado: aumenta el riesgo de timeout y acopla el ciclo de vida del request al tiempo total de la ejecucion.

**Cola distribuida con worker externo**
- Rechazado: agrega complejidad operacional innecesaria para un piloto interno en una sola maquina.

**Motor de jobs completamente asincronico desde el inicio**
- Rechazado: no es necesario para datasets pequenos y medianos del MVP y complica la validacion temprana del producto.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
