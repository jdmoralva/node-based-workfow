from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_classic.schema import HumanMessage, AIMessage
from collections import defaultdict
from sqlalchemy import inspect, text
from sqlalchemy.orm import sessionmaker
from pydantic import BaseModel
from typing import Dict, Any
import pandas as pd

# from langchain_core.runnables.history import RunnableWithMessageHistory
# from langchain_core.chat_history import InMemoryChatMessageHistory
# from langchain_google_genai import ChatGoogleGenerativeAI
# from langchain_core.output_parsers import StrOutputParser
 
def comment_block(title: str):
    line = "─" * 80
    print(f"\n# {line}\n# {title}\n# {line}\n")
 
def get_db_schema(engine) -> str:
    inspector = inspect(engine)
    schema_lines = []
    for tbl in inspector.get_table_names():
        schema_lines.append(f"{tbl}:")
        # ----- Columns -----
        columns = inspector.get_columns(tbl)
        col_names = [col["name"] for col in columns]
        schema_lines.append(f"  Columns: {', '.join(col_names)}")
        # ----- Primary Key -----
        pk = inspector.get_pk_constraint(tbl)
        pk_cols = pk.get("constrained_columns", [])
        if pk_cols:
            schema_lines.append(f"  Primary Key: {', '.join(pk_cols)}")
        # ----- Foreign Keys -----
        fks = inspector.get_foreign_keys(tbl)
        if fks:
            schema_lines.append("  Foreign Keys:")
            for fk in fks:
                ref_table = fk["referred_table"]
                ref_columns = fk["referred_columns"]
                local_columns = fk["constrained_columns"]
                for local_col, ref_col in zip(local_columns, ref_columns):
                    schema_lines.append(f"    - {local_col} → {ref_table}.{ref_col}")
    return "\n".join(schema_lines)
 
def get_db_schema_json(engine) -> Dict[str, Any]:
    inspector = inspect(engine)
    schema = {}
    for tbl in inspector.get_table_names():
        table_info = {}
        # ----- Columns -----
        columns = inspector.get_columns(tbl)
        table_info["columns"] = [col["name"] for col in columns]
        # ----- Primary Key -----
        pk = inspector.get_pk_constraint(tbl)
        table_info["primary_key"] = pk.get("constrained_columns", [])
        # ----- Foreign Keys -----
        fks = inspector.get_foreign_keys(tbl)
        table_info["foreign_keys"] = []
        for fk in fks:
            local_cols = fk.get("constrained_columns", [])
            ref_table = fk.get("referred_table")
            ref_cols = fk.get("referred_columns", [])
            for local_col, ref_col in zip(local_cols, ref_cols):
                table_info["foreign_keys"].append({
                    "local_column": local_col,
                    "ref_table": ref_table,
                    "ref_column": ref_col
                })
        schema[tbl] = table_info
    return schema

def build_schema(json_schema: dict):
    from text2sql.models.schema_linking import Entity, Foreign, Schema
    entities = []
    for table_name, table_info in json_schema.items():
        foreign_keys = [Foreign(**fk) for fk in table_info.get("foreign_keys", [])]
        entity = Entity(
            table=table_name,
            columns=table_info.get("columns", []),
            primary_key=table_info.get("primary_key", []),
            foreign_keys=foreign_keys
        )
        entities.append(entity)
    return Schema(entities=entities)
 
def generate_chain_prompt(system_prompt, params: dict, use_memory=False):
    """System prompt with schema variable"""
    # Prompt
    messages = [("system", system_prompt)]
    if use_memory:
        messages.append(MessagesPlaceholder(variable_name="history"))
    messages.append(("human", "{question}"))
    prompt = ChatPromptTemplate.from_messages(messages)
    # Chain
    partials = {}
    for key, value in params.items():
        partials[key] = RunnableLambda(lambda _, v=value: v)
    if use_memory:
        partials.update({"history": RunnableLambda(lambda _: [])})
    partials.update({"question": RunnablePassthrough()})
    chain = partials | prompt
    return chain

def get_session_history(store, session_id):
    if session_id not in store:
        store[session_id] = InMemoryChatMessageHistory()
    hist = store[session_id]
    hist.messages = hist.messages[-10:]
    return hist

def add_message_to_history(store, role, content, session_id='user_session'):
    history = get_session_history(store, session_id)
    if role == "Human":
        history.add_message(HumanMessage(content=content))
    else:
        history.add_message(AIMessage(content=content))
 
def call_agent(llm, chain, question, structure: BaseModel, store=None, use_memory=False):
    llm_structured = llm.with_structured_output(structure)
    chain_with_llm = chain | llm_structured
    if not use_memory:
        response = chain_with_llm.invoke(question)
    else:
        session_id = 'user_session'
        chain_with_memory = RunnableWithMessageHistory(
            chain_with_llm | (lambda x: x.model_dump_json()),
            lambda sid: get_session_history(store, sid),
            input_messages_key="question",
            history_messages_key="history"
        )
        response = chain_with_memory.invoke(
            {"question": question},
            config={"configurable": {"session_id": session_id}}
        )
    return response

def exec_query(session: sessionmaker, sql: str):
    try:
        result = session.execute(text(sql))
        rows = result.fetchall()
        columns = result.keys()
        if rows:
            formatted_result = defaultdict(list)
            for item in [dict(zip(columns, row)) for row in rows]:
                for k, v in item.items():
                    formatted_result[k].append(v)
            df = pd.DataFrame(formatted_result)
        return df, None
    except Exception as e:
        return None, str(e)

