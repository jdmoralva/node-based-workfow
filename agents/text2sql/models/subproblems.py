from pydantic import BaseModel, Field, model_validator
from typing import List
import re

ALLOWED_CLAUSES = {
    "SELECT", "FROM", "JOIN", "WHERE", "GROUP BY", "ORDER BY", "HAVING",
    "DISTINCT", "LIMIT", "UNION", "EXCEPT", "WITH"
}

class Clause(BaseModel):
    clause: str = Field(description="Cláusulas SQL (por ejemplo: WHERE, GROUP BY, JOIN, DISTINCT, ORDER BY, HAVING, EXCEPT, LIMIT, UNION)")
    expression: str = Field(description="Expresión SQL específica para la cláusula (por ejemplo: 'WHERE age > 30' o 'JOIN orders ON customers.id = orders.customer_id')")

class Subproblems(BaseModel):
    subproblems: List[Clause] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_all(self):
        cleaned_subproblems = []
        for e in self.subproblems:
            if not isinstance(e.clause, str):
                continue
            # exact match
            clause_clean = e.clause.upper().strip()
            if clause_clean in ALLOWED_CLAUSES:
                e.clause = clause_clean
            # fuzzy recovery
            for allowed in ALLOWED_CLAUSES:
                if allowed in clause_clean:
                    e.clause = allowed
            # keep only non-empty clauses
            if e.clause:
                cleaned_subproblems.append(e)
        self.subproblems = cleaned_subproblems
        return self
    
    @model_validator(mode="after")
    def split_from_clause(self):
        new_subproblems = []
        for e in self.subproblems:
            if e.clause == 'FROM' and  'JOIN' in e.expression.upper():
                parts = re.split(r'\bJOIN\b', e.expression, flags=re.IGNORECASE)
                # first part → FROM
                from_parts = parts[0].strip()
                new_subproblems.append(e.__class__(clause='FROM', expression=from_parts))
                # remaining → JOINs
                for join_part in parts[1:]:
                    new_subproblems.append(e.__class__(clause='JOIN', expression=join_part.strip()))
            else:
                new_subproblems.append(e)
        self.subproblems = new_subproblems
        return self



# # Test
# Subproblems(subproblems=[Clause(clause="WHERE table", expression="age > 30")])

# from text2sql.models.schema import Foreign, Entity, Schema

# sch = Schema(
#     entities=[
#         Entity(
#             table="Album", 
#             columns=["AlbumId", "Title"], 
#             primary_key=["AlbumId"], 
#             foreign_keys=[
#                 Foreign(
#                     local_column="ArtistId", 
#                     ref_table="Artist", 
#                     ref_column="ArtistId"
#                 )
#             ]
#         )
#     ]
# )

# sch.model_dump_json(indent=2)


