# BACKLOG MVP

## 1. Objetivo

Este backlog traduce `docs/SPEC.md` y `docs/DDR.md` a un plan operativo de implementacion para el MVP de Risk Viewer.

Su objetivo es ordenar el trabajo de construccion en una secuencia implementable, con dependencias claras, entregables verificables y criterios de cierre por fase.

## 2. Alcance del Backlog

Este backlog cubre la implementacion del MVP para:

- aplicacion web `Next.js`
- API `FastAPI`
- persistencia de datasets, pipelines, ejecuciones, chat y exportaciones
- canvas visual con pipelines simples
- nodos de preparacion basica
- nodos analiticos de cosechas de mora y default
- chat IA en modos `product_help`, `result_interpretation` y `portfolio_query`
- exportacion `PDF` y `PPT`
- autenticacion interna, trazabilidad y observabilidad minima

No cubre trabajo post-MVP como multi-tenant, colaboracion en tiempo real, jobs distribuidos ni conectores empresariales adicionales.

## 3. Principios de Priorizacion

- priorizar primero las fundaciones que desbloquean todo lo demas
- construir flujos deterministas antes de capacidades asistidas por LLM
- implementar primero el camino feliz end-to-end minimo y luego endurecer validaciones
- mantener separacion estricta entre codigo productivo y prototipos en `agents/`
- evitar dependencias operativas innecesarias: el MVP corre en una sola maquina
- preservar trazabilidad desde el inicio en datasets, ejecuciones, chat y exports

## 4. Dependencias Base

Las siguientes dependencias afectan multiples frentes y deben resolverse temprano:

- definicion del monorepo de aplicaciones `apps/web` y `apps/api`
- bootstrap de persistencia para `SQLite` de aplicacion y `SQLite` de portafolio
- decision de libreria de canvas tipo React Flow
- definicion del modelo de autenticacion con cookie segura `HTTP-only`
- definicion del contrato canonico `graph_json`
- definicion de formato estructurado de `execution.result_json`
- validacion metodologica final de calculos contra `docs/METHODOLOGY.md`

## 5. Fases de Implementacion

## Fase 0. Foundation y Arquitectura Ejecutable

### Objetivo

Crear la estructura productiva base del repositorio y dejar operativa la plataforma minima para desarrollar el MVP.

### Epics

#### EPIC F0.1 - Bootstrap del repositorio productivo

Tareas:

- crear `apps/web` con `Next.js` App Router
- crear `apps/api` con `FastAPI`
- definir estructura interna alineada con `docs/SPEC.md`
- crear carpetas `data/uploads`, `data/exports`, `data/app`, `data/portfolio`
- agregar configuracion base de entorno y carga de variables
- documentar comandos de arranque local para web y api

Entregables:

- estructura base de aplicaciones creada
- servicios web y api levantando localmente
- configuracion inicial de entorno documentada

Dependencias:

- ninguna

#### EPIC F0.2 - Base de datos y persistencia inicial

Tareas:

- crear esquema inicial de `SQLite` para metadatos de aplicacion
- crear mecanismo de inicializacion o migracion de base
- modelar entidades base: `User`, `Dataset`, `Pipeline`, `Execution`, `NodeExecution`, `ChatSession`, `ChatMessage`, `ExportJob`
- preparar estructura para `SelectionSnapshot`
- preparar acceso separado a `SQLite` de portafolio en modo solo lectura

Entregables:

- base de aplicacion inicializable desde cero
- acceso diferenciado a base app y base portfolio
- entidades base persistidas segun `SPEC`

Dependencias:

- `EPIC F0.1`

#### EPIC F0.3 - Autenticacion y sesion interna

Tareas:

- implementar modelo de usuario interno con password hash
- crear flujo de login y logout
- implementar sesion con cookie segura `HTTP-only`
- proteger endpoints autenticados del MVP
- registrar `user_id` en contextos auditables cuando aplique

Entregables:

- acceso autenticado funcional al sistema
- sesion persistente entre requests
- base de trazabilidad por identidad

Dependencias:

- `EPIC F0.2`

#### EPIC F0.4 - Observabilidad minima y manejo transversal de errores

Tareas:

- definir formato de logs estructurados
- generar `request_id` por request
- registrar logs de API, ejecucion, nodo, chat y exportacion
- definir respuestas controladas de error para frontend
- establecer politica basica de timeouts para operaciones sensibles

Entregables:

- trazabilidad tecnica minima activa
- correlacion por `request_id` y entidades relevantes
- respuestas de error consistentes

Dependencias:

- `EPIC F0.1`
- `EPIC F0.2`

### Criterio de cierre de fase

- `apps/web` y `apps/api` existen y levantan localmente
- existe base `SQLite` de aplicacion inicializable
- existe autenticacion interna funcional
- existe logging minimo con correlacion

## Fase 1. Datasets y Modelo de Pipeline

### Objetivo

Habilitar carga de datos, registro de datasets y persistencia del workflow canonico del canvas.

### Epics

#### EPIC F1.1 - Ingestion y registro de datasets

Tareas:

- implementar `POST /api/datasets/upload`
- soportar carga de `CSV` y `Excel`
- registrar datasets precargados con `POST /api/datasets/preloaded/{dataset_key}/register`
- persistir metadata del dataset: nombre, origen, schema, row count, storage path y table name cuando aplique
- materializar tabla consultable cuando el flujo lo requiera

Entregables:

- datasets cargados y registrados correctamente
- vista previa disponible para datasets registrados
- schema inferido y persistido

Dependencias:

- `EPIC F0.2`

#### EPIC F1.2 - Perfilado, preview y mapping de datasets

Tareas:

- implementar `GET /api/datasets`
- implementar `GET /api/datasets/{dataset_id}`
- implementar `GET /api/datasets/{dataset_id}/preview`
- implementar `GET /api/datasets/{dataset_id}/mapping`
- exponer tipos de columnas y perfilado basico
- preparar mapping entre columnas fisicas y logicas para nodos analiticos

Entregables:

- preview tabular funcional
- metadata util para configuracion de nodos
- contrato de mapping consumible por frontend

Dependencias:

- `EPIC F1.1`

#### EPIC F1.3 - CRUD de pipelines y contrato `graph_json`

Tareas:

- definir esquema canonico de `graph_json`
- implementar `POST /api/pipelines`
- implementar `GET /api/pipelines`
- implementar `GET /api/pipelines/{pipeline_id}`
- implementar `PUT /api/pipelines/{pipeline_id}`
- persistir nombre, descripcion, dataset, grafo y estado
- guardar layout y posiciones de nodos

Entregables:

- pipelines guardables y reabribles
- contrato estable de workflow para frontend y backend

Dependencias:

- `EPIC F0.2`

#### EPIC F1.4 - Canvas base en frontend

Tareas:

- montar pantalla base del canvas en `apps/web`
- integrar libreria visual de grafos
- renderizar nodos, edges y posiciones desde `graph_json`
- permitir crear, mover, conectar y eliminar nodos
- persistir cambios del grafo contra backend
- preparar panel lateral de nodos y panel derecho de configuracion

Entregables:

- canvas editable funcional
- persistencia del workflow desde frontend

Dependencias:

- `EPIC F1.3`
- `EPIC F0.3`

#### EPIC F1.5 - Pantallas de datasets y pipelines guardados

Tareas:

- construir pantalla de listado de datasets registrados
- construir pantalla de listado de pipelines guardados
- permitir abrir un pipeline existente desde el listado
- permitir navegar desde dataset a acciones relacionadas cuando aplique

Entregables:

- vistas frontend para explorar datasets y pipelines guardados

Dependencias:

- `EPIC F1.1`
- `EPIC F1.2`
- `EPIC F1.3`
- `EPIC F0.3`

### Criterio de cierre de fase

- un usuario autenticado puede cargar o registrar un dataset
- un pipeline puede crearse, guardarse, reabrirse y editarse
- el canvas persiste `graph_json` y layout

## Fase 2. Validacion y Ejecucion Secuencial

### Objetivo

Construir el motor determinista del MVP para validar y ejecutar pipelines de forma secuencial con trazabilidad por nodo.

### Epics

#### EPIC F2.1 - Validacion estructural de pipelines

Tareas:

- implementar `POST /api/pipelines/{pipeline_id}/validate`
- validar grafo aciclico
- validar presencia de nodos de entrada y salida
- validar un solo dataset fuente por ejecucion MVP
- validar compatibilidad de tipos entre nodos
- validar configuraciones requeridas por tipo de nodo

Entregables:

- validacion previa utilizable por frontend y ejecucion
- errores estructurados por nodo o por pipeline

Dependencias:

- `EPIC F1.3`

#### EPIC F2.2 - Runner local y ciclo de vida de `Execution`

Tareas:

- implementar `POST /api/pipelines/{pipeline_id}/execute`
- registrar `Execution` con estado inicial
- desacoplar la ejecucion del request HTTP con runner local liviano
- implementar polling con `GET /api/executions/{execution_id}`
- persistir transiciones `pending | running | succeeded | failed`
- definir manejo de interrupciones y fallos no recuperables del MVP

Entregables:

- ejecucion asincrona local disparada desde API
- seguimiento de estado por `execution_id`

Dependencias:

- `EPIC F2.1`
- `EPIC F0.4`

#### EPIC F2.3 - Ejecucion por nodo y snapshots

Tareas:

- implementar orden topologico de nodos
- registrar `NodeExecution` por cada nodo ejecutado
- persistir `input_snapshot_json` y `output_snapshot_json` cuando corresponda
- detener flujo en el primer error y persistir detalle
- construir referencias temporales de outputs por ejecucion
- consolidar `result_json` final

Entregables:

- trazabilidad completa por nodo
- salidas intermedias disponibles para inspeccion posterior

Dependencias:

- `EPIC F2.2`

#### EPIC F2.4 - Resultados de ejecucion en frontend

Tareas:

- mostrar estado general de ejecucion
- mostrar estado por nodo: `idle`, `configured`, `running`, `success`, `error`
- consumir `GET /api/executions/{execution_id}/nodes`
- consumir `GET /api/executions/{execution_id}/results`
- mostrar errores entendibles cuando una ejecucion falla

Entregables:

- flujo visible de ejecucion desde frontend
- error handling entendible para el usuario

Dependencias:

- `EPIC F2.2`
- `EPIC F2.3`

### Criterio de cierre de fase

- el sistema valida pipelines antes de ejecutar
- una ejecucion devuelve `execution_id` y puede seguirse por polling
- cada nodo deja trazabilidad persistida
- si un nodo falla, el error queda visible en frontend

## Fase 3. Nodos de Preparacion e Inspeccion de Datos

### Objetivo

Implementar transformaciones tabulares basicas y permitir inspeccion de datos intermedios dentro del flujo.

### Epics

#### EPIC F3.1 - Nodos de preparacion MVP

Tareas:

- implementar `select_columns`
- implementar `filter_rows`
- implementar `fill_nulls`
- implementar `segment_dataset`
- implementar `cast_types`
- definir contrato uniforme de input y output tipo `dataset`

Entregables:

- nodos de preparacion ejecutables en backend
- configuraciones minimas por nodo

Dependencias:

- `EPIC F2.3`
- `EPIC F1.2`

#### EPIC F3.2 - Configuracion visual de nodos de preparacion

Tareas:

- construir formularios de configuracion por tipo de nodo
- cargar columnas disponibles desde metadata del dataset
- mostrar validaciones inmediatas de configuracion
- guardar configuraciones en `graph_json`

Entregables:

- experiencia completa de configuracion para nodos basicos

Dependencias:

- `EPIC F3.1`
- `EPIC F1.4`

#### EPIC F3.3 - Inspeccion tabular y selecciones

Tareas:

- implementar vista tabular paginada para outputs intermedios
- permitir inspeccionar datasets intermedios por nodo
- modelar `SelectionSnapshot`
- soportar seleccion de filas y columnas en frontend
- persistir y propagar contexto de seleccion downstream cuando aplique

Entregables:

- tabla de inspeccion funcional
- base de propagacion de subconjuntos entre vistas

Dependencias:

- `EPIC F2.3`
- `EPIC F2.4`

#### EPIC F3.4 - Propagacion downstream de selecciones

Tareas:

- aplicar `SelectionSnapshot` como contexto de ejecucion downstream
- hacer que selecciones y filtros activos afecten nodos posteriores cuando aplique
- definir reglas de compatibilidad entre `dataset`, `selection` y nodos de salida
- exponer en frontend el subconjunto activo y su resaltado

Entregables:

- propagacion funcional de subconjuntos entre vistas y ejecucion

Dependencias:

- `EPIC F3.3`
- `EPIC F3.1`

### Criterio de cierre de fase

- los nodos de preparacion basica son configurables y ejecutables
- los datos intermedios pueden inspeccionarse en tabla
- existe soporte de seleccion y propagacion downstream

## Fase 4. Nodos Analiticos de Cosechas

### Objetivo

Implementar los dos nodos analiticos del MVP con reglas deterministas alineadas con `docs/METHODOLOGY.md`.

### Epics

#### EPIC F4.1 - Contrato analitico comun

Tareas:

- definir contrato `analysis_result`
- definir estructura comun de tabla agregada, metricas, serie de grafico y narrativa corta
- definir mapeo de columnas fisicas a logicas
- validar configuraciones minimas requeridas antes del calculo

Entregables:

- contrato estable para frontend, chat y exportacion

Dependencias:

- `EPIC F1.2`
- `EPIC F2.1`

#### EPIC F4.2 - Nodo `vintage_delinquency_analysis`

Tareas:

- implementar calculo de cosechas de mora
- aplicar `vintage_threshold` y `performing_window`
- soportar segmentacion por columnas configurables
- generar outputs tabulares, metricas y serie para grafico
- generar narrativa corta orientada a interpretacion posterior
- verificar consistencia contra `docs/METHODOLOGY.md`

Entregables:

- nodo de mora funcional y trazable

Dependencias:

- `EPIC F4.1`

#### EPIC F4.3 - Nodo `vintage_default_analysis`

Tareas:

- implementar calculo de cosechas de default
- aplicar reglas metodologicas del MVP
- soportar segmentacion por columnas configurables
- generar outputs tabulares, metricas y serie para grafico
- generar narrativa corta orientada a interpretacion posterior
- verificar consistencia contra `docs/METHODOLOGY.md`

Entregables:

- nodo de default funcional y trazable

Dependencias:

- `EPIC F4.1`

#### EPIC F4.4 - Visualizacion analitica en frontend

Tareas:

- construir panel de metricas resumen
- construir tabla principal de resultados
- construir grafico principal de lineas o heatmap segun analisis
- conectar acciones rapidas: exportar e interpretar con IA
- mostrar diferencias explicitas entre resultados de mora y default

Entregables:

- resultados analiticos legibles y accionables en UI

Dependencias:

- `EPIC F4.2`
- `EPIC F4.3`

#### EPIC F4.5 - Nodos de salida del MVP

Tareas:

- implementar nodo `table_output`
- implementar nodo `chart_output`
- implementar nodo `export_output`
- validar compatibilidad de cada nodo de salida con `analysis_result`, `dataset` y `selection` segun corresponda
- reflejar en frontend el comportamiento de los nodos de salida dentro del canvas

Entregables:

- nodos de salida del MVP implementados y ejecutables

Dependencias:

- `EPIC F2.1`
- `EPIC F3.4`
- `EPIC F4.4`

### Criterio de cierre de fase

- ambos nodos analiticos existen como nodos separados
- ambos producen resultados diferenciados y persistidos
- el frontend muestra tabla, metricas y grafico por ejecucion analitica
- existen nodos de salida funcionales para tabla, grafico y exportacion

## Fase 5. Chat IA por Modos

### Objetivo

Incorporar el subsistema de chat con modos explicitos y guardrails fuertes, sin comprometer los flujos deterministas del producto.

### Epics

#### EPIC F5.1 - Orquestador de chat y persistencia

Tareas:

- implementar `POST /api/chat/sessions`
- implementar `POST /api/chat/sessions/{session_id}/messages`
- implementar `GET /api/chat/sessions/{session_id}`
- persistir `ChatSession` y `ChatMessage`
- exigir `mode` explicito enviado por el cliente
- registrar contexto funcional asociado: `pipeline_id`, `execution_id`, pantalla o error cuando aplique

Entregables:

- infraestructura base de sesiones y mensajes

Dependencias:

- `EPIC F0.3`
- `EPIC F0.2`

#### EPIC F5.2 - Modo `product_help`

Tareas:

- definir contexto estructurado de producto consumible por el backend
- responder preguntas sobre nodos, configuracion y errores
- degradar de forma controlada si RAG no esta disponible
- asegurar que este modo no dependa exclusivamente de `Chroma`

Entregables:

- ayuda contextual funcional sobre el producto

Dependencias:

- `EPIC F5.1`
- `EPIC F2.4`
- `EPIC F3.2`

#### EPIC F5.3 - Modo `portfolio_query` con NL2SQL

Tareas:

- estudiar y extraer comportamiento util de `agents/text2sql`
- reimplementar servicio productivo de introspeccion de esquema
- generar SQL estructurado solo lectura
- aplicar guardrails: solo `SELECT`, whitelist de tablas, limite de filas, timeout y validacion previa
- ejecutar consultas contra `SQLite` de portafolio
- registrar SQL internamente sin exponerlo al frontend
- resumir resultados en lenguaje natural ejecutivo

Entregables:

- consulta de portafolio funcional con trazabilidad y guardrails

Dependencias:

- `EPIC F5.1`
- `EPIC F0.2`

#### EPIC F5.4 - Modo `result_interpretation` con RAG

Tareas:

- estudiar y extraer comportamiento util de `agents/rag`
- preparar indexacion local de conocimiento en `Chroma`
- implementar recuperacion documental para soporte de interpretacion
- combinar `execution.result_json` con contexto documental
- generar respuestas de interpretacion sin recalcular resultados

Entregables:

- interpretacion asistida de resultados de ejecuciones existentes

Dependencias:

- `EPIC F5.1`
- `EPIC F4.4`

#### EPIC F5.5 - UI de chat en frontend

Tareas:

- construir panel persistente lateral o inferior
- incorporar selector explicito de modo
- mostrar historial por sesion
- enviar contexto funcional correcto por modo
- mostrar respuestas centradas en resultado final

Entregables:

- experiencia completa de chat integrada al producto

Dependencias:

- `EPIC F5.1`
- `EPIC F5.2`
- `EPIC F5.3`
- `EPIC F5.4`

### Criterio de cierre de fase

- el chat opera con `mode` explicito
- `portfolio_query` consulta `SQLite` sin exponer SQL al usuario
- `result_interpretation` interpreta ejecuciones existentes con apoyo de RAG
- `product_help` responde con contexto estructurado del producto

## Fase 6. Exportacion y Endurecimiento MVP

### Objetivo

Cerrar el MVP con exportaciones trazables, endurecimiento de validaciones, seguridad y operabilidad minima.

### Epics

#### EPIC F6.1 - Exportacion PDF

Tareas:

- implementar `POST /api/executions/{execution_id}/exports/pdf`
- definir template fijo de informe
- incluir resumen ejecutivo, filtros, parametros, tabla principal, visualizacion y metadata
- persistir `ExportJob` y archivo generado

Entregables:

- exportacion PDF funcional a partir de una ejecucion completada

Dependencias:

- `EPIC F4.4`
- `EPIC F0.2`

#### EPIC F6.2 - Exportacion PPT

Tareas:

- implementar `POST /api/executions/{execution_id}/exports/pptx`
- generar deck de 3 a 5 slides con `python-pptx`
- incluir portada, hallazgos, tabla o grafico principal y metadata
- persistir `ExportJob` y archivo generado

Entregables:

- exportacion PPT funcional a partir de una ejecucion completada

Dependencias:

- `EPIC F4.4`
- `EPIC F0.2`

#### EPIC F6.3 - Consulta y descarga de exports

Tareas:

- implementar `GET /api/exports/{export_id}`
- mostrar estado del export y enlace de descarga
- vincular exportaciones a ejecucion y usuario cuando aplique

Entregables:

- trazabilidad completa de exportaciones

Dependencias:

- `EPIC F6.1`
- `EPIC F6.2`

#### EPIC F6.4 - Hardening final del MVP

Tareas:

- revisar guardrails de chat SQL
- revisar logs sin datos sensibles innecesarios
- revisar manejo de fallos de runner, `Chroma` y filesystem local
- validar comportamiento de errores de exportacion
- revisar backups minimos de `SQLite` y carpetas criticas
- documentar limites operativos del host unico

Entregables:

- MVP endurecido para piloto interno

Dependencias:

- todas las fases anteriores

### Criterio de cierre de fase

- PDF y PPT se generan desde ejecuciones completadas
- las exportaciones son trazables y descargables
- guardrails, logs y validaciones finales estan revisados

## 6. Backlog Transversal

Estos frentes deben ejecutarse en paralelo durante varias fases.

### BXT.1 - Contratos y esquemas compartidos

- definir DTOs y schemas compartidos entre frontend y backend
- versionar cambios de contrato de `graph_json`, `analysis_result` y payloads de chat
- mantener ejemplos de payload reales para debugging

### BXT.2 - Calidad y verificacion

- definir estrategia minima de pruebas para backend y frontend
- cubrir validaciones de pipelines y guardrails SQL
- cubrir calculos analiticos contra fixtures controlados
- cubrir casos de error y regresiones de exportacion

### BXT.3 - Documentacion tecnica

- documentar setup local del MVP
- documentar modelo de datos de aplicacion
- documentar contratos de nodos y resultados
- documentar operacion local de `Chroma`, `SQLite` y directorios de datos

### BXT.4 - Seguridad y auditoria

- revisar politicas de secretos y variables de entorno
- verificar no exposicion de SQL, prompts internos ni razonamiento intermedio
- asegurar que las acciones auditables queden vinculadas a identidad autenticada

## 7. Orden Recomendado de Construccion End-to-End

1. foundation tecnica y autenticacion
2. datasets y CRUD de pipelines
3. canvas persistente
4. validacion y runner secuencial
5. nodos de preparacion e inspeccion tabular
6. nodo de mora
7. nodo de default
8. visualizacion analitica
9. chat `product_help`
10. chat `portfolio_query`
11. chat `result_interpretation`
12. exportacion PDF
13. exportacion PPT
14. hardening final y documentacion operativa

## 8. Hitos de Aceptacion del MVP

El MVP puede considerarse implementado cuando se cumpla, como minimo, lo siguiente:

- un usuario autenticado puede entrar al sistema, cargar o registrar un dataset y crear un pipeline
- un pipeline guardado puede abrirse y ejecutarse nuevamente
- el backend valida y ejecuta secuencialmente el workflow con trazabilidad por nodo
- los nodos de preparacion basica operan sobre datasets tabulares
- existen dos nodos analiticos separados: mora y default
- ambos nodos producen resultados diferenciados, persistidos y visibles en frontend
- el chat opera en tres modos explicitos
- `portfolio_query` consulta la base `SQLite` sin mostrar SQL al usuario
- `result_interpretation` usa `execution.result_json` y soporte RAG
- PDF y PPT se generan a partir de una ejecucion completada
- los errores relevantes quedan registrados y visibles de manera controlada

## 9. Riesgos de Implementacion a Monitorear

- los prototipos en `agents/` no deben integrarse directamente como runtime productivo
- la definicion final de `execution.result_json` puede bloquear chat y exportacion si se posterga demasiado
- `SQLite` puede introducir limites de concurrencia si no se controla el patron de escrituras
- la propagacion de selecciones puede complejizar el motor de ejecucion si no se acota temprano
- PDF y PPT aumentan complejidad de plantillas y formato visual
- la calidad del chat depende de guardrails y del contexto estructurado, no solo del modelo LLM
- una caida del proceso o del host no reanuda ejecuciones en curso; la UX debe asumir reejecucion manual

## 10. Primer Corte Recomendado

Si se necesita un primer incremento util lo antes posible, el corte recomendado es:

- Fase 0 completa
- Fase 1 completa
- Fase 2 completa
- Fase 3 sin propagacion avanzada de selecciones
- Fase 4 con solo `vintage_delinquency_analysis`

Ese corte ya permitiria:

- cargar datos
- construir pipelines simples
- ejecutar validaciones y transformaciones
- obtener un primer analisis de cosechas de mora
- visualizar resultados basicos

Sirve como checkpoint de arquitectura antes de incorporar default, chat y exportaciones.
