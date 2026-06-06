# ADR-007: Separar funcionalmente `RAG` y `NL2SQL` como rutas distintas del chat

## Status
Accepted

## Context
El chat del MVP cumple tres funciones distintas:

- ayuda contextual del producto
- interpretacion de resultados
- consulta del portafolio

Estas funciones no comparten el mismo tipo de procesamiento. `RAG` sirve para recuperar contexto documental y apoyar explicaciones, mientras que `NL2SQL` sirve para traducir preguntas estructuradas del portafolio a consultas de solo lectura.

## Decision
Se separaran funcionalmente `RAG` y `NL2SQL` como rutas distintas dentro del chat.

Cada modo de chat seleccionara su flujo de procesamiento explicitamente en backend, sin mezclar recuperacion documental con generacion y ejecucion de SQL.

## Consequences

### Positive
- Clarifica la responsabilidad de cada modo de chat.
- Facilita aplicar guardrails especificos por ruta.
- Reduce el riesgo de mezclar explicacion documental con consulta estructurada.
- Mejora la trazabilidad tecnica y la depuracion.
- Permite que `product_help` siga operando con contexto estructurado aun si `RAG` falla.

### Negative
- El backend necesita orquestar mas ramas de procesamiento.
- Aumenta la necesidad de buena clasificacion por `mode`.
- Requiere disciplina para evitar que un modo termine llamando al flujo equivocado.

### Neutral
- `RAG` y `NL2SQL` pueden compartir infraestructura de LLM, pero no la logica de negocio ni la semantica de respuesta.
- El contrato del frontend permanece simple: enviar modo, mensaje y contexto funcional.

## Alternatives Considered

**Un solo pipeline de chat para todo**
- Rechazado: mezclar recuperacion documental y SQL aumenta el riesgo de respuestas incoherentes y dificulta los guardrails.

**NL2SQL atraves de RAG**
- Rechazado: no es apropiado usar recuperacion documental como sustituto de una ruta estructurada de consulta a base de datos.

**RAG y NL2SQL expuestos como servicios separados al frontend**
- Rechazado: complica el contrato de la UI y expone mas superficie de error al usuario.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
