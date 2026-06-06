from pydantic import BaseModel, Field, model_validator
from typing import List

ALLOWED_ERROR_TYPES = [
    "schema.mismatch",
    "join.logic_error",
    "filter.condition_error",
    "aggregation.grouping_error",
    "select.output_error",
    "syntax.structural_error",
    "intent.semantic_error"
]

class CorrectionStep(BaseModel):
    step: int = Field(description="Número de paso en el plan de corrección del error")
    instruction: str = Field(description="Acción específica para corregir el error identificado")

class CorrectionError(BaseModel):
    error_type: str = Field(description="Tipo de error identificado según la taxonomía")
    root_cause: str = Field(description="Explicación breve de la causa raíz del error")
    steps: List[CorrectionStep] = Field(default_factory=list, description="Plan paso a paso para corregir este error")

class CorrectionPlan(BaseModel):
    corrections: List[CorrectionError] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_all(self):
        cleaned_error_type = []
        for e in self.corrections:
            if not isinstance(e.error_type, str):
                continue
            # exact match
            error_type_clean = e.error_type.lower().strip()
            if error_type_clean in ALLOWED_ERROR_TYPES:
                e.error_type = error_type_clean
            # fuzzy recovery
            for allowed in ALLOWED_ERROR_TYPES:
                if allowed in error_type_clean:
                    e.error_type = allowed
            # keep only non-empty error types
            if e.error_type:
                cleaned_error_type.append(e)
        self.corrections = cleaned_error_type
        return self


# # Test
# CorrectionPlan(
#     corrections=[
#         CorrectionError(
#         error_type="schema.mismatch",
#         root_cause="La consulta hace referencia a una columna 'name' que no existe en el esquema, debería ser 'song_name'.",
#         steps=[
#             CorrectionStep(step=1, instruction="Revisar el esquema de la base de datos para identificar los nombres correctos de las columnas."),
#             CorrectionStep(step=2, instruction="Identificar todas las referencias a la columna incorrecta 'name' en la consulta SQL."),
#             CorrectionStep(step=3, instruction="Reemplazar cada referencia a 'name' con 'song_name' para que coincida con el esquema."),
#             CorrectionStep(step=4, instruction="Verificar que no haya otras discrepancias de nombres en la consulta SQL.")
#         ]
# )])


