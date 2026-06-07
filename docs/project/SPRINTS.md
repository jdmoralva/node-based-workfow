# SPRINTS MVP

## 1. Objetivo

Este documento organiza `docs/project/BACKLOG.md` en sprints de 1 semana para ejecutar la implementacion del MVP en una secuencia controlada.

Cada sprint define:

- objetivo
- alcance
- dependencias
- salida esperada
- riesgos principales

## 2. Criterios de Planificacion

- cada sprint debe dejar un incremento verificable
- primero se priorizan fundaciones tecnicas y flujos deterministas
- las capacidades con LLM entran despues de tener datasets, pipelines, ejecucion y resultados
- exportaciones y hardening se dejan para la etapa final
- se favorece un primer corte util antes de completar todo el MVP

## 3. Vista General

| Sprint | Foco principal | Resultado esperado |
|---|---|---|
| Sprint 1 | Foundation base | repo productivo, apps base y datos locales |
| Sprint 2 | Persistencia y auth | base app, usuarios, sesion y logging minimo |
| Sprint 3 | Datasets y pipelines | carga de datasets y CRUD de pipelines |
| Sprint 4 | Canvas y validacion | canvas persistente y validacion estructural |
| Sprint 5 | Runner y resultados base | ejecucion secuencial, polling y estados |
| Sprint 6 | Preparacion e inspeccion | nodos basicos y tabla de inspeccion |
| Sprint 7 | Analitica mora | primer corte util con cosechas de mora |
| Sprint 8 | Analitica default y visualizacion | cierre de analitica MVP |
| Sprint 9 | Chat base y product help | sesiones de chat y ayuda contextual |
| Sprint 10 | NL2SQL portfolio query | consulta de portafolio con guardrails |
| Sprint 11 | RAG result interpretation | interpretacion asistida de resultados |
| Sprint 12 | Exportacion y hardening | PDF, PPT y cierre operativo del MVP |

## 4. Sprints

## Sprint 1. Foundation Base

### Objetivo

Crear la estructura productiva inicial y dejar levantables `apps/web` y `apps/api`.

### Alcance

- bootstrap de `apps/web` con `Next.js`
- bootstrap de `apps/api` con `FastAPI`
- estructura de carpetas alineada con `SPEC`
- creacion de `data/uploads`, `data/exports`, `data/app`, `data/portfolio`
- configuracion base de entorno y arranque local

### Dependencias

- ninguna

### Salida esperada

- aplicaciones creadas y levantando localmente
- estructura del repositorio lista para desarrollo
- setup local basico documentado

### Riesgos principales

- definir tarde la forma de monorepo puede generar retrabajo

## Sprint 2. Persistencia y Autenticacion

### Objetivo

Construir la base persistente del sistema y habilitar acceso autenticado.

### Alcance

- esquema inicial de `SQLite` de aplicacion
- acceso separado a `SQLite` de portafolio
- entidades base del dominio
- login, logout y password hash
- sesion con cookie segura `HTTP-only`
- logging minimo con `request_id`

### Dependencias

- Sprint 1

### Salida esperada

- base app inicializable
- usuarios internos autenticables
- trazabilidad minima activa

### Riesgos principales

- decisiones tardias sobre sesion y modelo de usuario afectan toda la API

## Sprint 3. Datasets y CRUD de Pipelines

### Objetivo

Habilitar el ingreso de datasets y la persistencia del workflow canonico.

### Alcance

- `POST /api/datasets/upload`
- soporte `CSV` y `Excel`
- registro de datasets precargados
- metadata y preview de datasets
- definicion de `graph_json`
- `POST`, `GET`, `PUT` de pipelines
- pantalla de datasets registrados
- pantalla de pipelines guardados

### Dependencias

- Sprint 2

### Salida esperada

- datasets registrados y consultables
- pipelines guardables y reabribles

### Riesgos principales

- si `graph_json` queda ambiguo, el canvas y el runner se bloquean despues

## Sprint 4. Canvas Persistente y Validacion

### Objetivo

Montar el canvas base y validar pipelines antes de ejecutar.

### Alcance

- pantalla base del canvas
- integracion de libreria visual de grafos
- crear, mover, conectar y eliminar nodos
- persistencia de layout y conexiones
- `POST /api/pipelines/{pipeline_id}/validate`
- validacion de DAG, nodos de entrada/salida, dataset unico y compatibilidad de tipos

### Dependencias

- Sprint 3

### Salida esperada

- canvas editable conectado a backend
- validacion estructural utilizable desde frontend

### Riesgos principales

- la validacion visual puede divergir de la validacion real del backend

## Sprint 5. Runner y Resultados Base

### Objetivo

Construir el motor secuencial del MVP y su visibilidad en frontend.

### Alcance

- `POST /api/pipelines/{pipeline_id}/execute`
- registro de `Execution`
- runner local liviano
- polling de estado de ejecucion
- `GET /api/executions/{execution_id}/results`
- orden topologico
- `NodeExecution`, snapshots y `result_json`
- estado de ejecucion y errores visibles en frontend

### Dependencias

- Sprint 4

### Salida esperada

- ejecucion secuencial funcional con trazabilidad por nodo
- frontend mostrando estados y fallos

### Riesgos principales

- definir tarde `result_json` bloquea fases de analitica, chat y exportacion

## Sprint 6. Nodos de Preparacion e Inspeccion

### Objetivo

Implementar transformaciones tabulares basicas e inspeccion de datos intermedios.

### Alcance

- nodos `select_columns`, `filter_rows`, `fill_nulls`, `segment_dataset`, `cast_types`
- formularios de configuracion de nodos
- carga de metadata de columnas
- tabla paginada de outputs intermedios
- base de `SelectionSnapshot`
- seleccion de filas y columnas
- propagacion downstream de selecciones y filtros activos

### Dependencias

- Sprint 5

### Salida esperada

- pipelines de preparacion ejecutables
- inspeccion tabular de outputs intermedios
- propagacion funcional de subconjuntos en el flujo

### Riesgos principales

- la propagacion de selecciones puede crecer mas que el alcance de 1 sprint

## Sprint 7. Analitica de Mora

### Objetivo

Entregar el primer corte util del MVP con analisis de cosechas de mora.

### Alcance

- contrato comun `analysis_result`
- mapeo de columnas fisicas a logicas
- validacion de configuracion minima analitica
- nodo `vintage_delinquency_analysis`
- metricas, tabla agregada, serie de grafico y narrativa corta
- panel de metricas, tabla principal y grafico basico para mora
- nodo `table_output`
- nodo `chart_output`

### Dependencias

- Sprint 6

### Salida esperada

- primer flujo end-to-end util para cosechas de mora

### Riesgos principales

- inconsistencias con `docs/METHODOLOGY.md` comprometen la validez del MVP

## Sprint 8. Default y Visualizacion Completa

### Objetivo

Completar la capa analitica del MVP con default y una visualizacion comun robusta.

### Alcance

- nodo `vintage_default_analysis`
- diferencias explicitas entre mora y default
- mejoras en tabla, metricas y grafico comun
- nodo `export_output`
- acciones rapidas para exportar e interpretar con IA

### Dependencias

- Sprint 7

### Salida esperada

- ambos nodos analiticos funcionando y visibles en frontend

### Riesgos principales

- si el contrato `analysis_result` cambia tarde, obliga a retrabajo en chat y exportacion

## Sprint 9. Chat Base y Product Help

### Objetivo

Montar el subsistema de chat y el primer modo funcional sin depender totalmente de RAG.

### Alcance

- `POST /api/chat/sessions`
- `POST /api/chat/sessions/{session_id}/messages`
- `GET /api/chat/sessions/{session_id}`
- persistencia de `ChatSession` y `ChatMessage`
- panel de chat persistente en frontend
- selector explicito de `mode`
- modo `product_help`

### Dependencias

- Sprint 8

### Salida esperada

- sesiones de chat funcionales
- ayuda contextual sobre nodos, configuracion y errores

### Riesgos principales

- si el contexto estructurado del producto es pobre, la ayuda pierde utilidad

## Sprint 10. Portfolio Query con NL2SQL

### Objetivo

Agregar consulta de portafolio en lenguaje natural con control fuerte desde backend.

### Alcance

- extraccion de referencia util desde `agents/text2sql`
- introspeccion de esquema del portfolio
- generacion de SQL solo lectura
- whitelist de tablas, limite de filas, timeout y validacion previa
- ejecucion contra `SQLite` de portafolio
- respuesta ejecutiva sin exponer SQL

### Dependencias

- Sprint 9

### Salida esperada

- `portfolio_query` operativo con guardrails

### Riesgos principales

- la calidad de guardrails define el riesgo operativo de esta capacidad

## Sprint 11. Result Interpretation con RAG

### Objetivo

Incorporar interpretacion asistida de resultados usando `execution.result_json` y contexto documental.

### Alcance

- extraccion de referencia util desde `agents/rag`
- indexacion local en `Chroma`
- recuperacion documental
- modo `result_interpretation`
- combinacion de resultados deterministas con contexto de dominio

### Dependencias

- Sprint 10

### Salida esperada

- interpretacion de resultados existente sin recalculo

### Riesgos principales

- degradacion de `Chroma` debe manejarse sin romper el resto del sistema

## Sprint 12. Exportacion y Hardening

### Objetivo

Cerrar el MVP con exportaciones, auditoria y endurecimiento operativo minimo.

### Alcance

- exportacion PDF
- exportacion PPT
- consulta y descarga de exports
- revision de logs y secretos
- revision de fallos de runner, `Chroma` y filesystem
- procedimiento minimo de backup y limites operativos del host unico

### Dependencias

- Sprint 11

### Salida esperada

- PDF y PPT generados desde ejecuciones completadas
- MVP endurecido para piloto interno

### Riesgos principales

- exportaciones pueden consumir tiempo extra por templates y formato final

## 5. Primer Corte Recomendado

El primer corte recomendable para mostrar valor temprano es al cierre de `Sprint 7`.

Ese punto ya deberia permitir:

- login al sistema
- carga de datasets
- creacion y guardado de pipelines
- listado de datasets y pipelines guardados
- ejecucion secuencial con trazabilidad
- nodos de preparacion basica
- seleccion y propagacion de subconjuntos
- analisis de cosechas de mora con visualizacion inicial

## 6. Criterio de Cierre del Plan de Sprints

El plan se considera completado cuando:

- termina `Sprint 12`
- se cumplen los hitos de aceptacion de `BACKLOG.md`
- el sistema puede operar como piloto interno sobre una sola maquina
