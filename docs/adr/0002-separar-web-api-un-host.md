# ADR-002: Separar `apps/web` y `apps/api` con despliegue conjunto en una sola maquina

## Status
Accepted

## Context
El MVP necesita una experiencia web clara y una API dedicada para ejecutar pipelines, chat, exportaciones y persistencia.

El producto debe operar en una sola maquina para simplificar infraestructura, pero mantener una separacion logica entre frontend y backend para preservar limites de responsabilidad y facilitar la evolucion futura.

## Decision
Se separan `apps/web` y `apps/api` como aplicaciones distintas.

Ambas se despliegan en la misma maquina del MVP, con un reverse proxy ligero como punto unico de entrada hacia los servicios publicados.

## Consequences

### Positive
- Separacion clara entre experiencia de usuario y logica de negocio.
- Menor acoplamiento entre frontend y backend.
- Facilita el reemplazo o evolucion independiente de `web` y `api` en el futuro.
- Mantiene una operacion simple en una sola maquina.
- Permite proteger mejor la API interna mediante un punto de entrada controlado.

### Negative
- Introduce una pieza operativa adicional en el host.
- Requiere definir routing y puertos entre procesos.
- Mantiene el host unico como punto unico de falla.
- No aporta independencia real de escalado en el MVP.

### Neutral
- `apps/web` y `apps/api` comparten el mismo entorno fisico, pero no el mismo codigo ni el mismo ciclo de despliegue.
- La topologia fisica puede evolucionar despues hacia despliegues separados.

## Alternatives Considered

**Monolito unico web + api en un solo proceso**
- Rechazado: difumina responsabilidades y complica la evolucion futura del frontend o del backend por separado.

**Despliegue separado en maquinas distintas**
- Rechazado: agrega complejidad de infraestructura innecesaria para el alcance del MVP.

**Frontend embebido directamente en el backend**
- Rechazado: reduce claridad arquitectonica y dificulta la evolucion del producto.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
