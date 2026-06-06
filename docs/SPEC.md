# SPEC

## 1. Objetivo

Este documento traduce `docs/PRD.md` a una especificacion tecnica implementable para el MVP de la plataforma no-code de analitica de riesgo crediticio.

El MVP debe entregar tres capacidades integradas:

1. Canvas visual para construir pipelines simples.
2. Dos nodos analiticos dedicados:
   - cosechas de mora
   - cosechas de default
3. Chat IA con tres funciones:
   - asistencia contextual del producto
   - interpretacion de resultados
   - consulta del portafolio sobre base de datos

## 2. Decisiones Tecnicas Cerradas

- Frontend principal: `Next.js`
- Backend principal: `FastAPI`
- Lenguaje backend: `Python`
- Fuente principal del portafolio en MVP: `SQLite`
- Exportacion MVP: `PDF` y `PPT`
- Referencias funcionales existentes:
  - `agents/text2sql`
  - `agents/rag`

## 3. Principios de Implementacion

- Reutilizar la logica prototipo de `agents/text2sql` y `agents/rag` como referencia de comportamiento, no como API lista para produccion.
- Separar claramente el dominio de producto de los experimentos actuales en `agents/`.
- Mantener el MVP determinista en sus flujos criticos: ejecucion de pipeline, calculo analitico y exportacion.
- El chat no debe exponer SQL, prompts internos ni razonamiento intermedio.
- El canvas debe modelar explicitamente dos nodos analiticos distintos, no un unico nodo ambiguo.

## 4. Arquitectura de Alto Nivel

## 4.1 Componentes

### Frontend `apps/web` o equivalente

- `Next.js` App Router
- Canvas visual de nodos
- Panel lateral de nodos
- Panel derecho de configuracion
- Vista de ejecucion y resultados
- Panel de chat
- Pantallas de datasets y pipelines guardados

### Backend `apps/api` o equivalente

- `FastAPI`
- API REST para datasets, pipelines, ejecuciones, chat y exportaciones
- Servicio de ejecucion de pipelines
- Servicio analitico de cosechas
- Servicio NL2SQL para consultas del portafolio
- Servicio RAG para interpretacion y ayuda contextual
- Servicio de exportacion PDF/PPT

### Datos

- `SQLite` para portafolio MVP
- `SQLite` separado para metadatos de aplicacion
- Chroma local para RAG, siguiendo `agents/rag`
- Archivos cargados en almacenamiento local del proyecto durante MVP

### LLM Layer

- Integracion centralizada desde backend
- Ruta de consulta SQL inspirada en `agents/text2sql`
- Ruta de recuperacion documental inspirada en `agents/rag`
- Memoria conversacional acotada por sesion

## 4.2 Diagrama Logico

1. Usuario interactua con canvas o chat en `Next.js`.
2. `Next.js` consume API HTTP en `FastAPI`.
3. `FastAPI` persiste datasets, pipelines, ejecuciones y sesiones en la base de metadatos.
4. Para consultas de portafolio, `FastAPI` usa servicio NL2SQL y ejecuta SQL en `SQLite`.
5. Para interpretacion de resultados y ayuda, `FastAPI` usa servicio RAG contra Chroma construido desde `agents/rag/data/knowledge/`.
6. Para analisis de cosechas, `FastAPI` ejecuta calculos deterministas en Python y devuelve tablas, metricas y datos de grafico.
7. Para exportacion, `FastAPI` genera PDF/PPT desde una representacion estructurada del resultado.

## 5. Alcance Tecnico del MVP

## 5.1 Incluido

- Carga de CSV y Excel
- Seleccion de datasets precargados
- Perfilado basico de dataset
- Canvas de pipelines con persistencia
- Nodos de preparacion basica
- Nodo de cosechas de mora
- Nodo de cosechas de default
- Ejecucion secuencial con validacion previa apoyada por job runner liviano
- Resultados tabulares y graficos
- Exportacion PDF/PPT
- Chat de asistencia contextual
- Chat de consulta de portafolio sobre `SQLite`

## 5.2 Fuera de Alcance

- Versionamiento de pipelines
- Ejecucion programada
- Multiusuario en tiempo real sobre el mismo canvas
- Conectores empresariales adicionales
- Exposicion del SQL al usuario final
- Streaming de respuestas del chat como requisito inicial

## 6. Estructura de Proyecto Recomendada

```text
apps/
  web/
    app/
    components/
    features/
      canvas/
      chat/
      datasets/
      pipelines/
      execution/
  api/
    app/
      main.py
      api/
      core/
      models/
      schemas/
      services/
        datasets/
        pipelines/
        execution/
        analytics/
        chat/
        exports/
        rag/
        text2sql/
      repositories/
      workers/
data/
  uploads/
  exports/
  app/
  portfolio/
agents/
  text2sql/
  rag/
```

## 7. Modelo de Dominio

## 7.1 Entidades Principales

### Dataset

- `id`
- `name`
- `source_type`: `upload_csv | upload_xlsx | preloaded`
- `storage_path`
- `table_name`
- `schema_json`
- `row_count`
- `status`
- `created_at`

### Pipeline

- `id`
- `name`
- `description`
- `dataset_id`
- `graph_json`
- `status`
- `created_at`
- `updated_at`

### PipelineNode

- `id`
- `pipeline_id`
- `node_type`
- `label`
- `config_json`
- `position_x`
- `position_y`

### PipelineEdge

- `id`
- `pipeline_id`
- `source_node_id`
- `target_node_id`

### Execution

- `id`
- `pipeline_id`
- `dataset_id`
- `status`: `pending | running | succeeded | failed`
- `started_at`
- `finished_at`
- `error_summary`
- `result_json`

### NodeExecution

- `id`
- `execution_id`
- `node_id`
- `status`
- `started_at`
- `finished_at`
- `input_snapshot_json`
- `output_snapshot_json`
- `error_detail`

### ChatSession

- `id`
- `user_id`
- `context_type`: `product_help | result_interpretation | portfolio_query`
- `related_pipeline_id`
- `related_execution_id`
- `created_at`

### ChatMessage

- `id`
- `session_id`
- `role`: `user | assistant | system`
- `content`
- `metadata_json`
- `created_at`

### ExportJob

- `id`
- `execution_id`
- `format`: `pdf | pptx`
- `status`
- `file_path`
- `created_at`

## 7.2 Tipos de Nodo del MVP

### Ingesta

- `dataset_input_upload`
- `dataset_input_preloaded`

### Preparacion

- `select_columns`
- `filter_rows`
- `fill_nulls`
- `segment_dataset`
- `cast_types`

### Analisis

- `vintage_delinquency_analysis`
- `vintage_default_analysis`

### Salida

- `table_output`
- `chart_output`
- `export_output`

## 8. Contrato Funcional de Nodos

## 8.1 Forma Base

Cada nodo debe cumplir este contrato logico:

```json
{
  "id": "node_123",
  "type": "vintage_delinquency_analysis",
  "label": "Cosechas de Mora",
  "inputs": ["upstream_node_id"],
  "config": {},
  "output": {
    "kind": "dataset|report|chart",
    "payload_ref": "execution-scoped reference"
  }
}
```

## 8.2 Compatibilidad

- Nodos de ingesta no reciben entradas.
- Nodos de preparacion reciben un dataset tabular y retornan un dataset tabular.
- Nodos de analisis reciben un dataset tabular validado y retornan un `analysis_result`.
- Nodos de salida reciben un `analysis_result` o dataset tabular, segun el tipo.

## 8.3 Nodo `vintage_delinquency_analysis`

### Objetivo

Calcular curvas o tablas de cosecha orientadas a mora (saldo vencido), usando reglas configurables de vintage y ventana de observacion.

### Input esperado

- dataset tabular
- columnas minimas configuradas por el usuario

### Config minima

- `customer_id_column`
- `account_id_column`
- `origination_date_column`
- `observation_date_column`
- `days_past_due_column`
- `balance_column`
- `segment_columns`
- `vintage_threshold`
- `performing_window`

### Output

- tabla agregada por vintage y periodo
- metricas resumen
- serie lista para grafico
- narrativa corta para el chat de interpretacion

## 8.4 Nodo `vintage_default_analysis`

### Objetivo

Calcular curvas o tablas de cosecha orientadas a default, separadas del flujo de mora.

### Config minima

- `customer_id_column`
- `account_id_column`
- `origination_date_column`
- `observation_date_column`
- `default_flag_column`
- `balance_column`
- `segment_columns`
- `vintage_threshold`
- `performing_window`

### Output

- tabla agregada por vintage y periodo
- metricas resumen
- serie lista para grafico
- narrativa corta para el chat de interpretacion

## 8.5 Validaciones Previas

- pipeline con al menos un nodo de entrada y uno de salida
- grafo aciclico
- un solo dataset fuente por ejecucion MVP
- configuraciones requeridas presentes
- columnas requeridas existentes en dataset
- tipos compatibles con el nodo seleccionado

## 9. Flujo de Ejecucion del Pipeline

1. Frontend envia `graph_json` al backend.
2. Backend valida estructura y configuracion.
3. Backend ordena nodos topologicamente.
4. Backend ejecuta nodo por nodo.
5. Cada salida se guarda como referencia temporal dentro de la ejecucion.
6. Si un nodo falla, la ejecucion se detiene y se registra error por nodo.
7. Si el pipeline termina correctamente, se persiste `result_json` consolidado.

## 9.1 Estrategia de Ejecucion MVP

- Ejecucion con job runner liviano aceptable para datasets pequenos y medianos del piloto.
- Disenar la capa de servicio para poder escalar luego a jobs asincronicos mas robustos.
- Devolver al frontend identificador de ejecucion y estado actual.

## 10. Diseno del Chat

## 10.1 Modos de Chat

### Modo A: Asistencia de Producto

Usa contexto de pantalla, pipeline y errores para responder:

- que hace un nodo
- como configurarlo
- por que falla una ejecucion
- que siguiente paso tomar

### Modo B: Interpretacion de Resultados

Usa:

- `execution.result_json`
- referencias de dominio desde RAG

Debe poder:

- explicar el resultado del analisis
- resumir hallazgos
- sugerir acciones de gestion de riesgos

### Modo C: Consulta del Portafolio

Usa NL2SQL sobre `SQLite`.

Flujo:

1. Usuario envia pregunta.
2. Backend detecta intencion de consulta estructurada.
3. Servicio NL2SQL inspecciona esquema de la base.
4. LLM propone SQL estructurado.
5. Backend valida guardrails antes de ejecutar.
6. Se ejecuta SQL en modo lectura.
7. Se resume el resultado final para el usuario.
8. Se guarda trazabilidad interna sin exponer SQL.

## 10.2 Guardrails del Chat SQL

- solo consultas `SELECT`
- sin `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`
- limite de filas configurable
- timeout de ejecucion
- solo tablas permitidas
- sanitizacion y validacion del SQL antes de ejecutar

## 10.3 Integracion con Prototipos

### Inspirado en `agents/text2sql`

- introspeccion de esquema
- generacion estructurada de SQL
- correccion ante error
- memoria corta de conversacion

### Inspirado en `agents/rag`

- indexacion de PDFs de negocio
- recuperacion por similitud y multi-query
- soporte a explicaciones y recomendaciones

## 11. APIs del Backend

## 11.1 Datasets

- `POST /api/datasets/upload`
- `GET /api/datasets`
- `GET /api/datasets/{dataset_id}`
- `POST /api/datasets/preloaded/{dataset_key}/register`
- `GET /api/datasets/{dataset_id}/preview`

## 11.2 Pipelines

- `POST /api/pipelines`
- `GET /api/pipelines`
- `GET /api/pipelines/{pipeline_id}`
- `PUT /api/pipelines/{pipeline_id}`
- `POST /api/pipelines/{pipeline_id}/validate`

## 11.3 Ejecuciones

- `POST /api/pipelines/{pipeline_id}/execute`
- `GET /api/executions/{execution_id}`
- `GET /api/executions/{execution_id}/results`
- `GET /api/executions/{execution_id}/nodes`

## 11.4 Chat

- `POST /api/chat/sessions`
- `POST /api/chat/sessions/{session_id}/messages`
- `GET /api/chat/sessions/{session_id}`

## 11.5 Exportacion

- `POST /api/executions/{execution_id}/exports/pdf`
- `POST /api/executions/{execution_id}/exports/pptx`
- `GET /api/exports/{export_id}`

## 11.6 Ejemplos de Payload

### Crear pipeline

```json
{
  "name": "Cosechas mora retail",
  "dataset_id": "ds_001",
  "graph": {
    "nodes": [],
    "edges": []
  }
}
```

### Enviar mensaje al chat

```json
{
  "message": "Cual es la morosidad del segmento mayores de 60 anos?",
  "mode": "portfolio_query",
  "context": {
    "pipeline_id": null,
    "execution_id": null
  }
}
```

## 12. Persistencia y Almacenamiento

## 12.1 SQLite de Portafolio

- fuente principal para consultas de negocio del MVP
- debe incluir al menos uno o mas datasets precargados en tablas consultables
- debe existir un catalogo de tablas habilitadas para NL2SQL

## 12.2 Metadatos de App

Se recomienda persistir estos metadatos en una base `SQLite` separada de la base del portafolio:

- datasets registrados
- pipelines
- ejecuciones
- sesiones de chat
- exports

## 12.3 Almacenamiento de Archivos

- uploads: `data/uploads/`
- exports: `data/exports/`
- base del portafolio MVP: `data/portfolio/`
- base app: `data/app/`

## 13. Visualizacion y Frontend

## 13.1 Canvas

- usar una libreria de grafos tipo React Flow o equivalente
- guardado de layout y posiciones
- validaciones visuales de compatibilidad entre nodos
- estados por nodo: `idle`, `configured`, `running`, `success`, `error`

## 13.2 Resultados

- tabla paginada
- grafico de lineas o heatmap segun analisis
- panel de metricas resumen
- acciones rapidas: exportar, interpretar con IA, reutilizar pipeline

## 13.3 Chat

- panel lateral o inferior persistente
- selector de modo automatico o contextual
- historial por sesion
- respuestas con tono ejecutivo y centradas en resultado final

## 14. Exportacion PDF/PPT

## 14.1 Requisitos

- exportar resumen ejecutivo
- incluir filtros y parametros usados
- incluir tabla principal
- incluir visualizacion principal
- incluir fecha y nombre del pipeline

## 14.2 PDF

- formato de informe fijo
- generacion server-side desde HTML o template estructurado

## 14.3 PPT

- deck minimo de 3 a 5 slides
- portada
- resumen de hallazgos
- tabla o grafico principal
- metadatos del analisis
- generacion server-side con `python-pptx`

## 15. Seguridad y Permisos

## 15.1 MVP

- autenticacion basica si la app se expone a usuarios reales
- autorizacion simple por rol opcional en MVP
- consultas SQL en modo solo lectura
- no exponer secrets en frontend
- logs sin datos sensibles innecesarios

## 15.2 Guardrails de Datos

- limitar tablas consultables por chat
- limitar volumen de filas de respuesta
- registrar SQL internamente para auditoria tecnica, no para UI

## 16. Observabilidad y Logging

- log por request API
- log por ejecucion de pipeline
- log por nodo
- log por consulta de chat
- log de exportacion

Cada log critico debe incluir:

- `request_id`
- `pipeline_id` si aplica
- `execution_id` si aplica
- `chat_session_id` si aplica
- `status`
- `duration_ms`

## 17. Estrategia de Implementacion

## 17.1 Fase 1

- bootstrap de `Next.js` + `FastAPI`
- persistencia de datasets, pipelines y ejecuciones
- carga de CSV/Excel y datasets precargados
- canvas con grafo persistente

## 17.2 Fase 2

- nodos de preparacion
- validacion y ejecucion secuencial
- resultados tabulares

## 17.3 Fase 3

- nodo de cosechas de mora
- nodo de cosechas de default
- visualizaciones y metricas

## 17.4 Fase 4

- chat de consulta de portafolio con NL2SQL
- chat de interpretacion con RAG
- chat de ayuda contextual

## 17.5 Fase 5

- exportacion PDF
- exportacion PPT
- endurecimiento de logs, guardrails y validaciones

## 18. Criterios Tecnicos de Aceptacion

- un pipeline guardado puede abrirse y ejecutarse nuevamente
- ambos nodos analiticos producen resultados diferenciados y persistidos
- una consulta del chat al portafolio se resuelve via `SQLite` sin mostrar SQL al usuario
- el chat puede interpretar resultados de una ejecucion existente usando RAG
- PDF y PPT se generan a partir de una ejecucion completada
- si un nodo falla, el error queda registrado y visible en frontend

## 19. Riesgos Tecnicos

- los prototipos actuales no estan estructurados como servicios reutilizables y requeriran refactor
- `agents/rag/main.py` esta incompleto como flujo de aplicacion y su configuracion de modelo debe revisarse antes de integrarse
- `agents/text2sql/main.py` hoy ejecuta una pregunta hard-coded al importar; no puede integrarse tal cual
- `SQLite` simplifica el MVP, pero limita concurrencia y volumen para etapas posteriores
- exportacion dual PDF/PPT incrementa complejidad de templates desde MVP

## 20. Decisiones Pendientes No Bloqueantes

- usar dos archivos `SQLite` separados: uno para la base del portafolio y otro para metadata de la aplicacion
- ejecutar los pipelines con un job runner liviano en MVP
- detectar automaticamente el modo del chat por intencion del usuario
- usar `python-pptx` para la generacion de PPTX en backend
