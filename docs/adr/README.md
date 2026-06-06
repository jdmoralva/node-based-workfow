# ADR Index

## Status Summary

All ADRs below are currently `Accepted`.

## Index

1. `ADR-001` - [Adoptar arquitectura modular monolith para el backend MVP](0001-backend-modular-monolith-mvp.md)
2. `ADR-002` - [Separar `apps/web` y `apps/api` con despliegue conjunto en una sola maquina](0002-separar-web-api-un-host.md)
3. `ADR-003` - [Usar `SQLite` separado para portafolio y metadatos de aplicacion](0003-sqlite-separado-portfolio-y-app.md)
4. `ADR-004` - [Usar almacenamiento local para `uploads` y `exports` durante el MVP](0004-almacenamiento-local-uploads-exports-mvp.md)
5. `ADR-005` - [Ejecutar pipelines con runner secuencial liviano](0005-runner-secuencial-liviano-pipelines.md)
6. `ADR-006` - [Centralizar las integraciones LLM en el backend](0006-centralizar-integraciones-llm-backend.md)
7. `ADR-007` - [Separar funcionalmente `RAG` y `NL2SQL` como rutas distintas del chat](0007-rag-y-nl2sql-rutas-distintas-chat.md)
8. `ADR-008` - [Implementar autenticacion interna con usuario y contrasena](0008-autenticacion-interna-usuario-contrasena.md)
9. `ADR-009` - [Restringir el chat SQL a consultas de solo lectura con guardrails](0009-chat-sql-solo-lectura-guardrails.md)
10. `ADR-010` - [Persistir trazabilidad de datasets, ejecuciones, chat y exportaciones](0010-trazabilidad-datasets-ejecuciones-chat-exports.md)
11. `ADR-011` - [Mantener `mode` de chat explicito en el cliente para el MVP](0011-mode-chat-explicito-cliente-mvp.md)
12. `ADR-012` - [Disenar el backend para evolucion futura a ejecucion asincronica mas robusta](0012-backend-preparado-para-evolucion-asincrona.md)

## Notes

- The ADRs are ordered by implementation and architectural dependency.
- New ADRs should follow the same numbering convention with four digits.
