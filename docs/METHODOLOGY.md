# METHODOLOGY

## 1. Objetivo

Este anexo define las reglas metodologicas obligatorias para los nodos de cosechas del MVP.

## 2. Convenciones Generales

- La unidad primaria de analisis es la cuenta y su cohorte de originacion; en un esquema fisico esto puede representarse, por ejemplo, como `cod_account` + `orig_period`.
- La granularidad temporal es mensual.
- Las cohortes se construyen por mes de originacion.
- El usuario puede aplicar filtros; el resultado del MVP se agrega por cohorte, periodo de observacion y segmentacion configurada o ambos.

## 3. Definicion de Vintage

- Un vintage agrupa cuentas originadas en el mismo mes calendario.
- Cada observacion del vintage se compara contra el periodo de observacion correspondiente.
- `vintage_threshold` representa el numero de dias de atraso a partir del cual se considera una operacion como vencida.
- `performing_window` representa la ventana inicial de meses posteriores a la originacion usada para clasificar el comportamiento como vigente/performing.

## 4. Metodologia de Cosechas de Mora

- La mora se calcula a partir de la columna logica `days_past_due_column`; en un esquema fisico puede mapearse, por ejemplo, desde `days_past_due`.
- Una observacion se considera morosa cuando `days_past_due_column` >= `vintage_threshold`.
- El numerador de la tasa de mora es `past_due_balance_column` del periodo de observacion; en un esquema fisico puede mapearse, por ejemplo, desde `past_due_balance`.
- El denominador es `original_balance_column` de origen del vintage; en un esquema fisico puede mapearse, por ejemplo, desde `original_balance`.
- El resultado se agrega por cohorte, periodo de observacion, segmentacion configurada o ambos.
- El analisis debe conservar la narrativa del ultimo quiebre de mora por cohorte (mora over).

## 5. Metodologia de Cosechas de Default

- El default se calcula a partir de la columna logica `days_past_due_column`; en un esquema fisico puede mapearse, por ejemplo, desde `days_past_due`.
- Una observacion se considera como default cuando `days_past_due_column` >= `vintage_threshold`.
- El numerador de la tasa de default es el numero de cuentas en default del periodo de observacion.
- El denominador es el numero de cuentas de origen del vintage.
- El resultado se agrega por cohorte, periodo de observacion, segmentacion configurada o ambos.
- El analisis debe conservar la narrativa del primer evento de default por cohorte (default ever).
- Los eventos posteriores a un default no deben reiniciar la cohorte original.

## 6. Reglas de Calidad y Casos Especiales

- Columnas requeridas a nivel logico: `account_id_column`, `origination_date_column`, `observation_date_column`, `days_past_due_column`; para mora, tambien `past_due_balance_column` y `original_balance_column`. Estas columnas pueden mapearse desde nombres fisicos del dataset, por ejemplo `cod_account`, `orig_period`, `obs_period`, `days_past_due`, `past_due_balance`, `original_balance`.
- Si faltan columnas requeridas, el nodo falla antes de ejecutar.
- Si un periodo no cumple el parametro `performing_window`, debe excluirse del analisis.
- Las selecciones o filtros aplicados antes del nodo deben preservarse como contexto del resultado.

## 7. Outputs Esperados

- Tabla agregada por cohorte, periodo de observacion, segmentacion configurada o ambos.
- Metricas resumen por cohorte.
- Serie lista para grafico.
- Narrativa corta para interpretacion en chat.
