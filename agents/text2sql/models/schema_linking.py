from pydantic import BaseModel, Field, model_validator
from text2sql.services.config import SCHEMA
from typing import List, Dict, Optional

class Foreign(BaseModel):
    """Modelo de datos para el análisis de foreign keys."""
    local_column: str = Field(description="Nombre de la columna local con foreign keys.")
    ref_table: str = Field(description="Nombre de la tabla con la que se relaciona la columna con foreign keys.")
    ref_column: str = Field(description="Nombre de la columna en la tabla relacionada por foreign keys.")

class Entity(BaseModel):
    """Modelo de datos para al análsis de tablas relevantes dentro de la base de datos."""
    table: str = Field(description="Nombre de la tabla en la base de datos.")
    columns: List[str] = Field(description="Lista de columnas relevantes para la consulta del usuario.")
    primary_key: Optional[List[str]] = Field(default_factory=list, description="Primary key de la tabla.")
    foreign_keys: Optional[List[Foreign]] = Field(default_factory=list, description="Foreign keys de la tabla.")

class Schema(BaseModel):
    """Modelo de datos para el esquema de la base de datos acotado a tablas relevantes."""
    entities: List[Entity] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_all(self):
        cleaned_entities = []
        for e in self.entities:
            # Skip invalid tables
            if e.table not in SCHEMA:
                continue
            # Keep only valid columns
            table_info = SCHEMA[e.table]
            valid_columns = {col for col in table_info.get("columns", [])}
            e.columns = list(set(e.columns) & valid_columns)
            # Validate Pk
            pk_columns = {col for col in table_info.get("primary_key", [])}
            e.primary_key = list(set(e.primary_key) & pk_columns)
            # Validate Fk
            fk_schema = table_info.get("foreign_keys", [])
            fk_sets = {(fk["local_column"], fk["ref_table"], fk["ref_column"]) for fk in fk_schema}
            valid_fks = []
            if e.foreign_keys:
                for fk in e.foreign_keys:
                    fk_signature = (fk.local_column, fk.ref_table, fk.ref_column)
                    if fk_signature in fk_sets:
                        valid_fks.append(fk)
            e.foreign_keys = valid_fks
            # Enrichment
            e.columns = list(set(e.columns) | set(e.primary_key))
            e.columns = list(set(e.columns) | {fk.local_column for fk in e.foreign_keys})
            # keep only non-empty entities
            if e.columns:
                cleaned_entities.append(e)
        # Update
        self.entities = cleaned_entities
        return self
 
    @model_validator(mode="after")
    def merge_entities(self):
        merged: Dict[str, Dict[str, object]] = {}
        for e in self.entities:
            if e.table not in merged:
                merged[e.table] = {"columns": set(), "primary_key": None, "foreign_keys": set()}
            entry = merged[e.table]
            entry["columns"].update(e.columns)
            if e.primary_key:
                entry["primary_key"] = tuple(e.primary_key)
            if e.foreign_keys:
                for fk in e.foreign_keys:
                    entry["foreign_keys"].add((fk.local_column, fk.ref_table, fk.ref_column))
        # Rebuild
        self.entities = [
            Entity(
                table=table,
                columns=sorted(data["columns"]),
                primary_key=list(data["primary_key"]) if data["primary_key"] else [],
                foreign_keys=[
                    Foreign(local_column=lc, ref_table=rt, ref_column=rc)
                    for lc, rt, rc in data["foreign_keys"]
                ]
            )
            for table, data in merged.items()
        ]
        return self
    
    def get_entity(self, table: str) -> Optional[Entity]:
        return next((e for e in self.entities if e.table == table), None)


# # Test
# Schema(entities=[Entity(table="Album", columns=["ArtistId", "Title"])])
# Schema(entities=[Entity(table="Album", columns=["AlbumId", "Title"], primary_key=["AlbumId"])])
# Schema(entities=[Entity(table="Album", columns=["AlbumId", "Title"], primary_key=["AlbumId"], foreign_keys=[Foreign(local_column="ArtistId", ref_table="Artist", ref_column="ArtistId")])])
# Schema(entities=[Entity(table="Album", columns=["AlbumId", "Title"]), Entity(table="Album", columns=["ArtistId"])])


