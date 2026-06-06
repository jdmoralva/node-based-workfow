# ADR-003: Usar `SQLite` separado para portafolio y metadatos de aplicacion

## Status
Accepted

## Context
El MVP necesita dos tipos de persistencia con usos distintos:

- una base de portafolio para consultas de negocio en modo solo lectura
- una base de aplicacion para datasets registrados, pipelines, ejecuciones, chat y exportaciones

Separar estos datos reduce el acoplamiento entre el dominio del producto y la informacion consultable del portafolio, y simplifica la operacion en un host unico.

## Decision
Se utilizara `SQLite` como motor relacional ligero para ambos casos, pero en dos bases fisicamente separadas:

- `SQLite` de portafolio
- `SQLite` de aplicacion

## Consequences

### Positive
- Separacion clara entre datos de negocio y metadatos operativos.
- Permite tratar la base de portafolio como fuente de solo lectura para NL2SQL.
- Reduce riesgo de mezclar trazabilidad de producto con datos consultables del negocio.
- Simplifica backup y restauracion por dominio.
- Mantiene bajo costo operativo para el MVP.

### Negative
- Introduce dos artefactos de persistencia a administrar.
- Requiere disciplina para no duplicar responsabilidades entre ambas bases.
- `SQLite` sigue teniendo limites de concurrencia y escalado.
- La base de portafolio no resuelve por si sola necesidades futuras de volumen o multiusuario intensivo.

### Neutral
- El catalogo de tablas permitidas para NL2SQL se gestionara sobre la base de portafolio.
- La evolucion futura podria reemplazar una o ambas bases sin cambiar el contrato funcional del MVP.

## Alternatives Considered

**Una sola base SQLite para todo**
- Rechazado: mezcla dominio de negocio y metadatos operativos, dificulta trazabilidad y aumenta riesgo de acoplamiento indeseado.

**PostgreSQL desde el MVP**
- Rechazado: aporta mas capacidad tecnica, pero introduce mayor costo operativo y complejidad sin una necesidad clara para el piloto.

**Base documental para metadatos de aplicacion**
- Rechazado: el modelo de datos del MVP es suficientemente estructurado y relacional para justificar `SQLite`.

## References
- `docs/DDR.md`
- `docs/SPEC.md`
- `docs/PRD.md`
