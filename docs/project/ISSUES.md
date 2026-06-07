# ISSUES MVP

## 1. Objetivo

Este documento descompone `docs/project/BACKLOG.md` en issues accionables para ejecucion y seguimiento.

Cada issue busca ser una unidad de trabajo suficientemente concreta para convertirse despues en ticket de GitHub, Jira o similar.

## 2. Convenciones

- `ID`: identificador unico del issue
- `Tipo`: `epic`, `feature`, `backend`, `frontend`, `data`, `infra`, `quality`, `docs`, `security`
- `Prioridad`: `P0`, `P1`, `P2`
- `Depende de`: issues que deben resolverse antes
- `Definition of Done`: condicion minima para cerrar el issue

## 3. Issues

## Foundation

### RV-001 - Crear estructura productiva base

- Tipo: `infra`
- Prioridad: `P0`
- Depende de: ninguna
- Alcance: crear `apps/web`, `apps/api` y estructura inicial alineada con `SPEC`
- Definition of Done: ambas apps existen y arrancan localmente

### RV-002 - Crear directorios locales de datos del MVP

- Tipo: `infra`
- Prioridad: `P0`
- Depende de: `RV-001`
- Alcance: crear `data/uploads`, `data/exports`, `data/app`, `data/portfolio`
- Definition of Done: los directorios existen y estan documentados en setup local

### RV-003 - Configurar entorno local del proyecto

- Tipo: `infra`
- Prioridad: `P0`
- Depende de: `RV-001`
- Alcance: variables de entorno base, carga de configuracion y comandos de arranque
- Definition of Done: setup local documentado y reproducible

### RV-004 - Implementar esquema inicial de base app

- Tipo: `data`
- Prioridad: `P0`
- Depende de: `RV-001`
- Alcance: esquema inicial de `SQLite` para metadatos
- Definition of Done: la base app puede inicializarse desde cero

### RV-005 - Modelar entidades base del dominio

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-004`
- Alcance: `User`, `Dataset`, `Pipeline`, `Execution`, `NodeExecution`, `ChatSession`, `ChatMessage`, `ExportJob`, `SelectionSnapshot`
- Definition of Done: las entidades base estan modeladas y persistibles

### RV-006 - Configurar acceso separado a SQLite de portfolio

- Tipo: `data`
- Prioridad: `P0`
- Depende de: `RV-004`
- Alcance: acceso diferenciado y solo lectura a base de portfolio
- Definition of Done: la aplicacion puede conectarse a base app y base portfolio por rutas separadas

### RV-007 - Implementar autenticacion interna

- Tipo: `security`
- Prioridad: `P0`
- Depende de: `RV-005`
- Alcance: login, logout, password hash y proteccion de endpoints
- Definition of Done: un usuario interno puede autenticarse y acceder solo a rutas protegidas

### RV-008 - Implementar sesion con cookie HTTP-only

- Tipo: `security`
- Prioridad: `P0`
- Depende de: `RV-007`
- Alcance: manejo de sesion autenticada en backend
- Definition of Done: la sesion se mantiene entre requests sin exponer credenciales al frontend

### RV-009 - Implementar logging estructurado y request_id

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-001`
- Alcance: logs minimos de API y correlacion por request
- Definition of Done: cada request genera `request_id` y logs estructurados

### RV-010 - Definir manejo transversal de errores y timeouts

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-009`
- Alcance: respuestas de error consistentes y timeouts basicos
- Definition of Done: errores controlados y predecibles para frontend

## Datasets

### RV-011 - Implementar upload de datasets CSV y Excel

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-004`, `RV-002`
- Alcance: `POST /api/datasets/upload`
- Definition of Done: archivos CSV y Excel se cargan y registran correctamente

### RV-012 - Registrar datasets precargados

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-011`, `RV-006`
- Alcance: `POST /api/datasets/preloaded/{dataset_key}/register`
- Definition of Done: datasets precargados pueden incorporarse al catalogo del MVP

### RV-013 - Persistir metadata y schema de datasets

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-011`
- Alcance: nombre, origen, schema, row count, storage path y table name
- Definition of Done: la metadata queda persistida y recuperable por API

### RV-014 - Implementar listado y detalle de datasets

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-013`
- Alcance: `GET /api/datasets` y `GET /api/datasets/{dataset_id}`
- Definition of Done: datasets listables y consultables individualmente

### RV-015 - Implementar preview y perfilado basico de datasets

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-013`
- Alcance: `GET /api/datasets/{dataset_id}/preview` y tipos basicos de columnas
- Definition of Done: existe preview tabular y metadata util para configuracion

### RV-016 - Implementar mapping de columnas fisicas a logicas

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-015`
- Alcance: `GET /api/datasets/{dataset_id}/mapping`
- Definition of Done: el frontend puede obtener un contrato de mapping analitico

### RV-016A - Implementar pantalla de datasets registrados

- Tipo: `frontend`
- Prioridad: `P1`
- Depende de: `RV-014`, `RV-015`, `RV-008`
- Alcance: listado frontend de datasets con acceso a detalle o preview
- Definition of Done: el usuario puede navegar y abrir datasets registrados desde la UI

## Pipelines y Canvas

### RV-017 - Definir contrato canonico de graph_json

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-005`
- Alcance: esquema canonico de nodos, edges, layout y configuraciones
- Definition of Done: `graph_json` queda definido y documentado como contrato estable

### RV-018 - Implementar CRUD de pipelines

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-017`
- Alcance: `POST`, `GET`, `PUT` de pipelines
- Definition of Done: los pipelines pueden crearse, listarse, abrirse y actualizarse

### RV-019 - Persistir layout y posiciones del canvas

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-018`
- Alcance: guardar posiciones de nodos y estructura visual del workflow
- Definition of Done: al reabrir un pipeline se conserva el layout

### RV-019A - Implementar pantalla de pipelines guardados

- Tipo: `frontend`
- Prioridad: `P1`
- Depende de: `RV-018`, `RV-008`
- Alcance: listado frontend de pipelines con apertura de workflow existente
- Definition of Done: el usuario puede navegar pipelines guardados y abrir uno en el canvas

### RV-020 - Montar pantalla base del canvas

- Tipo: `frontend`
- Prioridad: `P0`
- Depende de: `RV-001`, `RV-008`
- Alcance: vista principal del canvas autenticado
- Definition of Done: el usuario autenticado puede abrir la pantalla del canvas

### RV-021 - Integrar libreria visual de grafos

- Tipo: `frontend`
- Prioridad: `P0`
- Depende de: `RV-020`, `RV-017`
- Alcance: renderizado de nodos, edges y eventos basicos
- Definition of Done: el canvas puede mostrar el `graph_json` persistido

### RV-022 - Implementar edicion visual del pipeline

- Tipo: `frontend`
- Prioridad: `P0`
- Depende de: `RV-021`, `RV-018`
- Alcance: crear, mover, conectar y eliminar nodos
- Definition of Done: el usuario puede editar visualmente un workflow y guardarlo

### RV-023 - Implementar panel lateral de nodos y panel de configuracion

- Tipo: `frontend`
- Prioridad: `P1`
- Depende de: `RV-022`
- Alcance: libreria de nodos disponible y panel derecho de configuracion
- Definition of Done: el canvas tiene base de interaccion completa para configurar nodos

## Validacion y Ejecucion

### RV-024 - Implementar validacion estructural de pipelines

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-017`, `RV-018`
- Alcance: DAG, nodos de entrada/salida, dataset unico y compatibilidad de tipos
- Definition of Done: `POST /api/pipelines/{pipeline_id}/validate` devuelve errores estructurados

### RV-025 - Registrar entidad Execution y estados base

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-005`, `RV-024`
- Alcance: estados `pending`, `running`, `succeeded`, `failed`
- Definition of Done: existe ciclo de vida persistido de ejecucion

### RV-026 - Implementar runner local liviano

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-025`, `RV-010`
- Alcance: desacople del request HTTP y procesamiento local background
- Definition of Done: una ejecucion puede iniciarse y continuar fuera del request

### RV-027 - Implementar endpoint de ejecucion de pipelines

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-026`
- Alcance: `POST /api/pipelines/{pipeline_id}/execute`
- Definition of Done: el endpoint devuelve `execution_id` y dispara el runner

### RV-028 - Implementar orden topologico y ejecucion por nodo

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-026`, `RV-024`
- Alcance: orden topologico, paso nodo a nodo y detencion en error
- Definition of Done: el motor ejecuta nodos secuencialmente con orden valido

### RV-029 - Persistir NodeExecution y snapshots

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-028`
- Alcance: `NodeExecution`, input/output snapshots y error detail
- Definition of Done: cada nodo ejecutado deja trazabilidad persistida

### RV-030 - Definir y persistir execution.result_json

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-029`
- Alcance: contrato consolidado de resultados por ejecucion
- Definition of Done: existe un formato estable y consumible por frontend, chat y exportacion

### RV-031 - Implementar polling y detalle de ejecucion

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-027`, `RV-029`, `RV-030`
- Alcance: `GET /api/executions/{execution_id}` y `GET /api/executions/{execution_id}/nodes`
- Definition of Done: el frontend puede consultar estado y detalle por nodo

### RV-031A - Implementar endpoint de resultados de ejecucion

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-030`
- Alcance: `GET /api/executions/{execution_id}/results`
- Definition of Done: el frontend puede recuperar el resultado consolidado de una ejecucion con contrato estable

### RV-032 - Implementar resultados de ejecucion en frontend

- Tipo: `frontend`
- Prioridad: `P0`
- Depende de: `RV-031`
- Alcance: estados de ejecucion, estados por nodo y errores visibles
- Definition of Done: el usuario puede seguir una ejecucion desde el canvas

## Preparacion e Inspeccion

### RV-033 - Definir contrato uniforme de nodos dataset->dataset

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-028`
- Alcance: contrato de input y output para nodos de preparacion
- Definition of Done: los nodos basicos comparten interfaz estable

### RV-034 - Implementar nodo select_columns

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-033`, `RV-015`
- Alcance: seleccion de columnas del dataset
- Definition of Done: el nodo transforma el dataset correctamente

### RV-035 - Implementar nodo filter_rows

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-033`, `RV-015`
- Alcance: filtrado basico de filas
- Definition of Done: el nodo aplica filtros configurados sobre el dataset

### RV-036 - Implementar nodo fill_nulls

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-033`, `RV-015`
- Alcance: reemplazo configurable de nulos
- Definition of Done: el nodo procesa nulos segun configuracion

### RV-037 - Implementar nodo segment_dataset

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-033`, `RV-015`
- Alcance: segmentacion basica por columnas seleccionadas
- Definition of Done: el nodo produce segmentacion utilizable downstream

### RV-038 - Implementar nodo cast_types

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-033`, `RV-015`
- Alcance: casteo de tipos soportados por el MVP
- Definition of Done: el nodo convierte tipos validos y reporta errores controlados

### RV-039 - Implementar formularios de configuracion de nodos basicos

- Tipo: `frontend`
- Prioridad: `P0`
- Depende de: `RV-023`, `RV-016`, `RV-034`, `RV-035`, `RV-036`, `RV-037`, `RV-038`
- Alcance: formularios por tipo de nodo y guardado en `graph_json`
- Definition of Done: el usuario puede configurar nodos de preparacion desde UI

### RV-040 - Implementar vista tabular de outputs intermedios

- Tipo: `frontend`
- Prioridad: `P0`
- Depende de: `RV-032`, `RV-029`
- Alcance: tabla paginada por output intermedio
- Definition of Done: los outputs intermedios pueden inspeccionarse en UI

### RV-041 - Modelar SelectionSnapshot y seleccion base

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-029`
- Alcance: persistencia de seleccion de filas y columnas
- Definition of Done: existe estructura persistida de seleccion

### RV-042 - Implementar seleccion basica en frontend

- Tipo: `frontend`
- Prioridad: `P1`
- Depende de: `RV-040`, `RV-041`
- Alcance: seleccion de filas y columnas sobre tabla
- Definition of Done: el usuario puede seleccionar subconjuntos basicos en la UI

### RV-042A - Implementar propagacion downstream de selecciones

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-041`, `RV-033`, `RV-028`
- Alcance: aplicar selecciones y filtros activos como contexto de ejecucion para nodos posteriores
- Definition of Done: las selecciones afectan el procesamiento downstream segun el contrato del pipeline

### RV-042B - Implementar resaltado y contexto visual de subconjuntos

- Tipo: `frontend`
- Prioridad: `P1`
- Depende de: `RV-042`, `RV-042A`, `RV-040`
- Alcance: mostrar subconjunto activo y su resaltado en vistas relevantes
- Definition of Done: la UI hace visible el subconjunto seleccionado y propagado

## Analitica

### RV-043 - Definir contrato analysis_result

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-030`, `RV-016`
- Alcance: tabla agregada, metricas, serie y narrativa corta
- Definition of Done: frontend, chat y exportacion tienen un contrato comun estable

### RV-044 - Validar configuracion analitica y mapping requerido

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-043`
- Alcance: validaciones previas para nodos de mora y default
- Definition of Done: el backend detecta configuraciones analiticas incompletas o incompatibles

### RV-045 - Implementar vintage_delinquency_analysis

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-044`
- Alcance: calculo de cosechas de mora alineado con `docs/METHODOLOGY.md`
- Definition of Done: el nodo produce resultados deterministas completos y trazables

### RV-046 - Implementar vintage_default_analysis

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-044`
- Alcance: calculo de cosechas de default alineado con `docs/METHODOLOGY.md`
- Definition of Done: el nodo produce resultados deterministas completos y trazables

### RV-047 - Implementar resultados analiticos en frontend

- Tipo: `frontend`
- Prioridad: `P0`
- Depende de: `RV-043`, `RV-045`, `RV-046`
- Alcance: panel de metricas, tabla principal y grafico
- Definition of Done: los resultados analiticos son visibles y legibles en UI

### RV-048 - Mostrar diferencias explicitas entre mora y default

- Tipo: `frontend`
- Prioridad: `P1`
- Depende de: `RV-047`
- Alcance: labels, titulos y mensajes diferenciados por analisis
- Definition of Done: la UI no confunde salidas de mora con default

### RV-048A - Implementar nodo table_output

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-043`, `RV-042A`
- Alcance: nodo de salida tabular compatible con `analysis_result`, `dataset` o `selection` cuando corresponda
- Definition of Done: el pipeline puede terminar en una salida tabular funcional

### RV-048B - Implementar nodo chart_output

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-043`, `RV-042A`
- Alcance: nodo de salida grafica compatible con entradas soportadas del MVP
- Definition of Done: el pipeline puede terminar en una salida grafica funcional

### RV-048C - Implementar nodo export_output

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-043`, `RV-042A`
- Alcance: nodo de salida para preparar artefactos exportables desde una ejecucion
- Definition of Done: el pipeline puede terminar en una salida utilizable por exportacion

### RV-048D - Integrar nodos de salida en el canvas y UI

- Tipo: `frontend`
- Prioridad: `P1`
- Depende de: `RV-023`, `RV-048A`, `RV-048B`, `RV-048C`
- Alcance: disponibilidad y comportamiento visible de nodos de salida en el canvas
- Definition of Done: el usuario puede agregar y usar nodos de salida desde la interfaz

## Chat

### RV-049 - Implementar persistencia de chat

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-005`, `RV-008`
- Alcance: `ChatSession`, `ChatMessage` y endpoints de sesiones
- Definition of Done: sesiones y mensajes pueden crearse, guardarse y leerse

### RV-050 - Implementar panel de chat en frontend

- Tipo: `frontend`
- Prioridad: `P0`
- Depende de: `RV-049`
- Alcance: panel persistente, historial y envio de mensajes
- Definition of Done: el usuario puede abrir una sesion y conversar desde la UI

### RV-051 - Implementar selector explicito de mode en frontend

- Tipo: `frontend`
- Prioridad: `P0`
- Depende de: `RV-050`
- Alcance: `product_help`, `result_interpretation`, `portfolio_query`
- Definition of Done: cada mensaje se envia con `mode` explicito

### RV-052 - Definir contexto estructurado para product_help

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-032`, `RV-039`
- Alcance: contexto de pantalla, pipeline, configuracion y errores
- Definition of Done: existe payload estructurado suficiente para ayuda contextual

### RV-053 - Implementar modo product_help

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-049`, `RV-052`
- Alcance: respuestas sobre nodos, configuracion y fallas
- Definition of Done: el modo responde con utilidad usando contexto estructurado del producto

### RV-054 - Analizar referencia de agents/text2sql

- Tipo: `docs`
- Prioridad: `P1`
- Depende de: ninguna
- Alcance: extraer comportamiento util y limitaciones para reimplementacion productiva
- Definition of Done: existe una nota tecnica de integracion y descarte de acoples no productivos

### RV-055 - Implementar introspeccion de esquema para NL2SQL

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-054`, `RV-006`
- Alcance: descubrimiento controlado de tablas y columnas permitidas
- Definition of Done: el backend expone internamente un esquema util para NL2SQL

### RV-056 - Implementar guardrails SQL del portfolio chat

- Tipo: `security`
- Prioridad: `P0`
- Depende de: `RV-055`
- Alcance: solo `SELECT`, whitelist, timeout, row limit y validacion previa
- Definition of Done: el backend bloquea consultas fuera de politica

### RV-057 - Implementar ejecucion portfolio_query

- Tipo: `backend`
- Prioridad: `P0`
- Depende de: `RV-056`, `RV-049`
- Alcance: generacion, validacion, ejecucion y resumen sin exponer SQL
- Definition of Done: `portfolio_query` responde resultados de negocio con trazabilidad interna

### RV-058 - Analizar referencia de agents/rag

- Tipo: `docs`
- Prioridad: `P1`
- Depende de: ninguna
- Alcance: extraer comportamiento util y limitaciones para reimplementacion productiva
- Definition of Done: existe una nota tecnica de integracion RAG para MVP

### RV-059 - Preparar indexacion local de conocimiento en Chroma

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-058`
- Alcance: flujo de indexacion y almacenamiento vectorial local
- Definition of Done: las fuentes documentales pueden indexarse localmente

### RV-060 - Implementar recuperacion documental para interpretacion

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-059`
- Alcance: retrieval para soporte a `result_interpretation`
- Definition of Done: el backend puede recuperar contexto documental relevante

### RV-061 - Implementar modo result_interpretation

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-049`, `RV-047`, `RV-060`
- Alcance: interpretar `execution.result_json` con apoyo RAG
- Definition of Done: el modo interpreta resultados existentes sin recalcularlos

## Exportacion

### RV-062 - Implementar exportacion PDF

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-047`, `RV-005`
- Alcance: `POST /api/executions/{execution_id}/exports/pdf`
- Definition of Done: se genera un PDF con resumen, tabla, visualizacion y metadata

### RV-063 - Implementar exportacion PPT

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-047`, `RV-005`
- Alcance: `POST /api/executions/{execution_id}/exports/pptx`
- Definition of Done: se genera un PPT de 3 a 5 slides con contenido analitico

### RV-064 - Persistir ExportJob y archivos generados

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-062`, `RV-063`
- Alcance: metadata del export, estado y ruta de archivo
- Definition of Done: cada export queda trazado y vinculado a su ejecucion

### RV-065 - Implementar consulta y descarga de exports

- Tipo: `backend`
- Prioridad: `P1`
- Depende de: `RV-064`
- Alcance: `GET /api/exports/{export_id}`
- Definition of Done: la UI puede consultar estado y acceder al archivo exportado

## Transversales

### RV-066 - Definir DTOs y schemas compartidos

- Tipo: `docs`
- Prioridad: `P0`
- Depende de: `RV-017`, `RV-030`, `RV-043`, `RV-049`
- Alcance: contratos de `graph_json`, `result_json`, `analysis_result` y chat
- Definition of Done: existe una referencia comun de contratos vigente para frontend y backend

### RV-067 - Definir estrategia minima de pruebas

- Tipo: `quality`
- Prioridad: `P1`
- Depende de: `RV-001`
- Alcance: enfoque minimo de pruebas backend y frontend para el MVP
- Definition of Done: el repositorio tiene una estrategia clara de verificacion automatizada

### RV-068 - Cubrir validaciones de pipelines y guardrails SQL con pruebas

- Tipo: `quality`
- Prioridad: `P1`
- Depende de: `RV-024`, `RV-056`, `RV-067`
- Alcance: pruebas de reglas estructurales y restricciones SQL
- Definition of Done: existen pruebas automatizadas para validaciones criticas

### RV-069 - Cubrir calculos analiticos con fixtures controlados

- Tipo: `quality`
- Prioridad: `P1`
- Depende de: `RV-045`, `RV-046`, `RV-067`
- Alcance: fixtures y pruebas de mora/default
- Definition of Done: los calculos criticos tienen regresion automatizada

### RV-070 - Cubrir casos de error y regresion de exportacion

- Tipo: `quality`
- Prioridad: `P2`
- Depende de: `RV-062`, `RV-063`, `RV-067`
- Alcance: errores de exportacion y consistencia de artefactos
- Definition of Done: los fallos comunes de export quedan cubiertos por pruebas o checks automatizados

### RV-071 - Documentar setup local del MVP

- Tipo: `docs`
- Prioridad: `P1`
- Depende de: `RV-003`
- Alcance: arranque local de web, api y stores locales
- Definition of Done: un desarrollador puede levantar el MVP solo con la documentacion

### RV-072 - Documentar modelo de datos y contratos principales

- Tipo: `docs`
- Prioridad: `P1`
- Depende de: `RV-066`
- Alcance: entidades, contratos de nodos y resultados
- Definition of Done: existe referencia tecnica vigente para datos y contratos

### RV-073 - Revisar politica de secretos y auditoria minima

- Tipo: `security`
- Prioridad: `P1`
- Depende de: `RV-009`, `RV-049`, `RV-056`
- Alcance: secretos, no exposicion de SQL/prompts y vinculacion a identidad
- Definition of Done: se validan los puntos minimos de seguridad y auditoria del MVP

### RV-074 - Documentar limites operativos y backup minimo del host unico

- Tipo: `docs`
- Prioridad: `P2`
- Depende de: `RV-062`, `RV-063`, `RV-073`
- Alcance: backup de bases, uploads, exports y limites del despliegue MVP
- Definition of Done: existe guia operativa minima para piloto interno

## 4. Orden Recomendado de Ejecucion

1. `RV-001` a `RV-010`
2. `RV-011` a `RV-023`
3. `RV-024` a `RV-032` y `RV-031A`
4. `RV-033` a `RV-042B`
5. `RV-043` a `RV-048D`
6. `RV-049` a `RV-061`
7. `RV-062` a `RV-065`
8. `RV-066` a `RV-074` en paralelo segun dependencia

## 5. Primer Subconjunto Recomendado

Si se necesita crear primero un conjunto inicial de tickets para arrancar implementacion, el subconjunto recomendado es:

- `RV-001` a `RV-010`
- `RV-011` a `RV-018`
- `RV-016A`, `RV-019A`, `RV-020` a `RV-024`
- `RV-025` a `RV-035`, `RV-031A`
- `RV-041` a `RV-042B`
- `RV-043` a `RV-045`, `RV-047`, `RV-048A`, `RV-048B`

Ese conjunto cubre el primer corte util definido en `BACKLOG.md`.
