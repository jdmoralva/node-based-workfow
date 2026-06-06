from pydantic import BaseModel, Field, model_validator

class SQLQuery(BaseModel):
    query: str = Field(description="Consulta SQL final generada")

    @model_validator(mode="after")
    def clean_query(self):
        if not isinstance(self.query, str):
            self.query = ""
        if "SELECT" not in self.query.upper() or "FROM" not in self.query.upper():
            self.query = ""
        # limpiar espacios y remover backticks
        self.query = self.query.strip()
        if self.query.startswith("```"):
            self.query = self.query.strip("`")
            self.query = self.query.replace("sql", "").strip()
        return self

# # Test
# SQLQuery(query="select * from table")

