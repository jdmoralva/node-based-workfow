# PRD Operativo

## Plataforma No-Code de Analitica de Riesgo Crediticio

## 1. Resumen Ejecutivo

Desarrollar una plataforma web no-code para analitica de riesgo crediticio en portafolios de consumo, que permita a usuarios de negocio disenar, ejecutar y reutilizar pipelines analiticos mediante una interfaz visual basada en nodos.

El MVP combinara tres capacidades principales:

1. Construccion visual de pipelines simples en canvas.
2. Ejecucion de dos nodos analiticos iniciales: analisis de cosechas de mora y analisis de cosechas de default.
3. Interaccion con un chat IA para asistencia contextual y consultas del portafolio sobre base de datos en lenguaje natural.

## 2. Problema a Resolver

Los analisis de riesgo y portafolio suelen depender de equipos tecnicos o analiticos especializados, lo que genera:

- tiempos altos de preparacion y ejecucion
- baja estandarizacion de analisis
- dificultad para reutilizar logica analitica
- barreras para usuarios sin programacion
- baja agilidad para consultar el estado del portafolio

## 3. Objetivo del Producto

Permitir que usuarios de riesgo y negocio construyan analisis, ejecuten flujos y consulten informacion del portafolio sin programar, reduciendo tiempos operativos y aumentando la autonomia del usuario.

## 4. Objetivo del MVP

El MVP debe validar que un usuario puede:

- cargar y preparar datos
- configurar un pipeline visual basico
- ejecutar un analisis de cosechas de mora
- ejecutar un analisis de cosechas de default
- visualizar y exportar resultados
- consultar una base de datos del portafolio mediante chat IA
- recibir ayuda contextual del chat durante el uso del producto

## 5. Alcance del MVP

### 5.1 Incluido

- canvas visual basico
- nodos de ingesta, preparacion basica, analisis y salida
- ejecucion secuencial de pipelines
- validacion basica de flujo
- manejo de errores por nodo
- logging basico
- nodo de analisis de cosechas de mora
- nodo de analisis de cosechas de default
- visualizacion basica de resultados
- exportacion a PDF o PPT
- guardado del pipeline para reutilizacion
- chat IA asistente del canvas
- chat IA para consultas a base de datos del portafolio

### 5.2 Fuera de Alcance

- multiples analisis de riesgo avanzados con profundidad equivalente
- automatizacion programada de pipelines
- versionamiento avanzado
- dashboards avanzados
- conectores empresariales amplios
- exposicion de SQL o logica interna al usuario final

## 6. Usuarios Objetivo

### 6.1 Usuario Primario

- analista de riesgo crediticio con conocimiento funcional del negocio

### 6.2 Usuarios Secundarios

- equipos de estrategia y modelamiento
- areas de negocio como productos, marketing y cobranza

## 7. Propuesta de Valor

La plataforma permitira:

- construir analisis sin programar
- reducir tiempos de desarrollo analitico
- estandarizar procesos de riesgo
- reutilizar pipelines
- consultar el portafolio con lenguaje natural
- mejorar la trazabilidad de ejecucion y resultados

## 8. Casos de Uso del MVP

### 8.1 Analisis de Cosechas de Mora

Flujo esperado:

1. El usuario carga o selecciona un dataset historico precargado.
2. El usuario aplica limpieza y segmentacion basica.
3. El usuario selecciona el nodo de analisis de cosechas de mora.
4. El usuario configura los parametros del nodo, incluyendo al menos `vintage threshold` y `performing window`.
5. El sistema ejecuta el pipeline.
6. El sistema genera tabla y visualizacion basica.
7. El usuario exporta resultados en PDF o PPT.

Este analisis debe tomar como referencia funcional los materiales en `agents/rag/data/knowledge/`. Los pasos indicados deben realizarse de manera visual a traves de la construccion de un pipeline basado en nodos y conexiones (canvas).

### 8.2 Analisis de Cosechas de Default

Flujo esperado:

1. El usuario carga o selecciona un dataset historico precargado.
2. El usuario aplica limpieza y segmentacion basica.
3. El usuario selecciona el nodo de analisis de cosechas de default.
4. El usuario configura los parametros del nodo, incluyendo al menos `vintage threshold` y `performing window`.
5. El sistema ejecuta el pipeline.
6. El sistema genera tabla y visualizacion basica.
7. El usuario exporta resultados en PDF o PPT.

Este analisis debe tomar como referencia funcional los materiales en `agents/rag/data/knowledge/`. Los pasos indicados deben realizarse de manera visual a traves de la construccion de un pipeline basado en nodos y conexiones (canvas).

### 8.3 Consulta Conversacional del Portafolio

Flujo esperado:

1. El usuario formula una pregunta en lenguaje natural.
2. El sistema interpreta la intencion.
3. El sistema traduce internamente la consulta a una operacion estructurada sobre base de datos.
4. El sistema obtiene el resultado.
5. El sistema responde al usuario mostrando solo el resultado final.

La referencia funcional para esta capacidad es el enfoque observado en `agents/text2sql` y `agents/rag`.

## 9. Funcionalidades del MVP

### 9.1 Canvas Visual

Debe permitir:

- crear pipelines simples
- agregar nodos desde una libreria lateral
- conectar nodos compatibles
- configurar parametros
- ejecutar el pipeline
- visualizar estado por nodo

### 9.2 Nodos Iniciales

#### Ingesta

- carga de CSV
- carga de Excel
- selección de datasets precargados

#### Preparacion

- seleccion de columnas
- filtrado
- tratamiento basico de nulos
- segmentacion simple
- tipificacion de campos

#### Analisis

- nodo de analisis de cosechas de mora
- nodo de analisis de cosechas de default

#### Salida

- tabla de resultados
- visualizacion basica
- exportacion en PDF o PPT

### 9.3 Chat IA

#### Rol 1: Asistente del Canvas

Debe poder:

- explicar nodos
- ayudar a configurar parametros
- orientar ante errores
- resumir resultados

#### Rol 2: Interpretacion de resultados

- explicar el resultado del analisis de cosechas
- sugerir acciones de gestion de riesgos empleando el conocimiento del LLM y el programa `agents/rag`
- mantener contexto basico de conversacion
- sugerir proximos pasos

#### Rol 3: Consulta del Portafolio

Debe poder:

- recibir preguntas en lenguaje natural
- consultar la base de datos de forma interna
- responder con resultado final
- mantener contexto basico de conversacion

No debe mostrar:

- SQL generado
- razonamiento interno
- pasos intermedios tecnicos

## 10. Requisitos Funcionales

- RF-01: crear, editar, guardar y ejecutar pipelines visuales simples
- RF-02: validar conexiones y dependencias entre nodos
- RF-03: ejecutar pipelines secuencialmente
- RF-04: mostrar errores por nodo de forma entendible
- RF-05: registrar ejecuciones y resultados
- RF-06: ejecutar el nodo de analisis de cosechas de mora
- RF-07: ejecutar el nodo de analisis de cosechas de default
- RF-08: mostrar resultados en tabla y grafico basico
- RF-09: exportar resultados a PDF o PPT
- RF-10: responder consultas del portafolio via chat sobre base de datos
- RF-11: dar asistencia contextual sobre el uso del canvas

## 11. Requisitos No Funcionales

- interfaz usable por usuarios no programadores
- trazabilidad de ejecuciones y consultas
- seguridad de acceso a datos por autenticacion y permisos
- desempeno suficiente para flujos de analisis del piloto
- respuestas del chat consistentes con la base consultada

## 12. Integraciones del MVP

### 12.1 Incluidas

- archivos CSV
- archivos Excel
- datasets precargados en la base de datos
- base de datos del portafolio para consultas por chat

### 12.2 Referencias Funcionales

- `agents/text2sql`
- `agents/rag`

## 13. Arquitectura Funcional

### 13.1 Frontend

- canvas visual
- panel de nodos
- panel de configuracion
- panel de ejecucion y resultados
- panel de chat IA

### 13.2 Backend

- orquestador de pipelines
- motor de validacion
- API de ejecucion
- servicio de chat IA
- servicio de consultas estructuradas
- servicio de logging

### 13.3 Motor Analitico

- transformaciones de datos
- analisis de cosechas de mora
- analisis de cosechas de default
- generacion de outputs

### 13.4 Capa de Datos

- datasets cargados
- resultados de ejecucion
- logs
- metadatos de pipelines
- memoria de sesion del chat

## 14. Historias de Usuario Prioritarias

- HU-01: Como analista de riesgo, quiero cargar un archivo con datos historicos o seleccionar un dataset precargado para comenzar un analisis sin depender de un desarrollador.
- HU-02: Como analista de riesgo, quiero construir un flujo visual simple para preparar datos y ejecutar un analisis de cosechas de mora mediante un nodo dedicado.
- HU-03: Como analista de riesgo, quiero construir un flujo visual simple para preparar datos y ejecutar un analisis de cosechas de default mediante un nodo dedicado.
- HU-04: Como analista de riesgo, quiero visualizar resultados del analisis en tabla y grafico para interpretar rapidamente el comportamiento del portafolio.
- HU-05: Como analista de riesgo, quiero exportar resultados para compartirlos con negocio.
- HU-06: Como usuario de negocio, quiero hacer preguntas del portafolio en lenguaje natural para obtener respuestas sin escribir SQL.
- HU-07: Como usuario del sistema, quiero que el chat me ayude a entender errores y resultados para completar tareas con menos friccion.

## 15. Criterios de Aceptacion del MVP

### 15.1 Pipeline Visual

- el usuario puede construir un flujo simple completo
- el sistema impide conexiones invalidas
- el sistema muestra estado de ejecucion por nodo

### 15.2 Analisis de Cosechas de Mora

- el usuario puede parametrizar y ejecutar el nodo de analisis de cosechas de mora
- el sistema genera una salida visual y tabular valida para la logica de mora
- el resultado puede exportarse a PDF o PPT

### 15.3 Analisis de Cosechas de Default

- el usuario puede parametrizar y ejecutar el nodo de analisis de cosechas de default
- el sistema genera una salida visual y tabular valida para la logica de default
- el resultado puede exportarse a PDF o PPT

### 15.4 Chat IA

- el usuario puede hacer preguntas del portafolio en lenguaje natural
- el sistema devuelve una respuesta final basada en datos
- el sistema no expone SQL ni logica interna
- el usuario puede pedir ayuda contextual sobre el uso del producto

## 16. Metricas de Exito

### 16.1 Adopcion

- numero de usuarios activos del piloto
- frecuencia de uso semanal
- numero de pipelines creados

### 16.2 Eficiencia

- tiempo promedio para completar un analisis de cosechas de mora
- tiempo promedio para completar un analisis de cosechas de default
- porcentaje de reduccion frente al proceso actual
- porcentaje de ejecuciones exitosas

### 16.3 Valor

- numero de consultas de portafolio resueltas por chat
- porcentaje de usuarios que completan tareas sin apoyo tecnico
- reutilizacion de pipelines

## 17. Riesgos del MVP

- sobrealcance del MVP
- complejidad del chat consultando base de datos real
- calidad insuficiente de datos de entrada
- ambiguedad metodologica del nodo de cosechas de mora
- ambiguedad metodologica del nodo de cosechas de default
- riesgo de duplicacion innecesaria si ambos nodos comparten demasiado comportamiento sin una abstraccion clara
- friccion de uso para perfiles no tecnicos

## 18. Roadmap

### 18.1 Fase 1: MVP

- canvas visual basico
- ingesta CSV/Excel
- ingesta de datasets precargados
- preparacion basica
- nodo de analisis de cosechas de mora
- nodo de analisis de cosechas de default
- visualizacion basica
- exportacion PDF/PPT
- chat IA asistente + consulta de portafolio

### 18.2 Fase 2

- early delinquency (FPD/SPD)
- matriz de transicion (roll rates)
- perdida esperada (PD, LGD, EAD)
- recobery and cure analysis
- reporting de portafolio mas robusto
- dashboards mejorados
- conectores adicionales
- historial y reutilizacion mejorada

### 18.3 Fase 3

- versionamiento avanzado
- automatizacion de pipelines
- integraciones empresariales
- catalogo ampliado de analisis de riesgo
