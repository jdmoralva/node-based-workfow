# Risk Viewer

## Resumen Ejecutivo

Risk Viewer es una plataforma no-code de analitica de riesgo crediticio para portafolios de consumo. El objetivo es permitir que usuarios de negocio y analistas construyan pipelines visuales basados en nodos, ejecuten analisis de riesgo y consulten informacion del portafolio mediante un chat con IA, reduciendo la dependencia de desarrollo tecnico para tareas analiticas recurrentes.

El MVP definido en `docs/PRD.md` y `docs/SPEC.md` incluye tres capacidades principales:

- canvas visual para construir pipelines simples
- dos nodos analiticos dedicados: cosechas de mora y cosechas de default
- chat IA para asistencia contextual, interpretacion de resultados y consultas sobre la base de datos del portafolio

## Estado Actual

- El producto esta definido a nivel funcional en `docs/PRD.md`.
- La especificacion tecnica base esta documentada en `docs/SPEC.md`.
- Las reglas metodologicas de los nodos de cosechas viven en `docs/METHODOLOGY.md`.
- Los prototipos existentes viven en `agents/`:
  - `agents/text2sql` como referencia para consultas SQL sobre la base del portafolio
  - `agents/rag` como referencia para recuperacion documental e interpretacion
- Todo lo encontrado dentro de `github/`, especialmente `github/orange3`, debe tratarse como material de referencia para la funcionalidad del MVP.
- El stack objetivo del MVP ya esta cerrado en la especificacion:
  - frontend: `Next.js`
  - backend: `FastAPI`
  - base principal del portafolio: `SQLite`
  - exportacion: `PDF` y `PPTX`
- Aun no existe codigo de aplicacion para `apps/web` o `apps/api`; el repositorio sigue compuesto por documentacion y prototipos de referencia.

## Alcance del MVP

- carga de CSV, Excel y datasets precargados
- edicion y guardado de pipelines
- ejecucion secuencial con validacion previa
- inspeccion de datos en tabla y propagacion de subconjuntos seleccionados
- preparacion de datos como paso explicito del flujo
- analisis de cosechas de mora y de default
- visualizacion basica de resultados
- exportacion PDF/PPTX
- reportes trazables asociados a la ejecucion
- chat IA con modo explicito para asistencia, interpretacion o consulta del portafolio

## Estructura de Trabajo

- `docs/PRD.md`: definicion funcional del producto
- `docs/SPEC.md`: especificacion tecnica para desarrollo
- `docs/METHODOLOGY.md`: reglas metodologicas de los nodos de cosechas
- `agents/`: experimentos y referencias funcionales
- `github/`: material de referencia para el MVP

## Siguiente Paso

La siguiente fase natural es implementar la estructura de aplicacion real en `apps/web` y `apps/api`, usando `docs/SPEC.md` como guia tecnica principal y `docs/METHODOLOGY.md` como referencia normativa para los calculos de cosechas.
