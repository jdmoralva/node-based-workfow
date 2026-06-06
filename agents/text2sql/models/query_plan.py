from pydantic import BaseModel, Field
from typing import List

class PlanStep(BaseModel):
    step: int = Field(description="Número de paso en el plan de ejecución SQL.")
    expression: str = Field(description="Expresión SQL del paso (ej: '1. FROM tableA', '2. JOIN tableB ON tableA.colX = tableB.colY')")

class QueryPlan(BaseModel):
    steps: List[PlanStep] = Field(default_factory=list, description="Lista ordenada de pasos del plan de ejecución SQL.")

