from text2sql.services.config import ENGINE, GEMINI_MODEL, OPENAI_MODEL, OLLAMA_MODEL
from text2sql.services.config import DEFAULT_TEMP, MAX_CRITIC_ATTEMPTS
from text2sql.models.schema_linking import Schema
from text2sql.models.subproblems import Subproblems
from text2sql.models.query_plan import QueryPlan
from text2sql.models.sql_query import SQLQuery
from text2sql.models.correction_plan import CorrectionPlan
from text2sql.prompts.prompts import *
from text2sql.services.utils import *

from langchain_ollama import ChatOllama
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import json

load_dotenv()

# ────────────────────────────────────────────────────────────────────────────────
# Agent
# ────────────────────────────────────────────────────────────────────────────────

def evaluate(llm, question, session):

    #0. Parameters
    params = {}

    json_schema = get_db_schema_json(ENGINE)
    db_schema = build_schema(json_schema)
    params['schema'] = db_schema

    #1. Schema linking
    chain = generate_chain_prompt(SCHEMA_LINKING_PROMPT, params)
    response_schema = call_agent(llm, chain, question, structure=Schema)
    params['pruned_schema'] = response_schema
    print('Schema linking completed.')

    #2. Subproblems
    chain = generate_chain_prompt(SUBPROBLEMS_PROMPT, params)
    response_subproblems = call_agent(llm, chain, question, structure=Subproblems)
    params['subproblems'] = response_subproblems
    print('Subproblems identified.')

    #3. Query plan
    chain = generate_chain_prompt(QUERY_PLAN_PROMPT, params)
    response_query_plan = call_agent(llm, chain, question, structure=QueryPlan)
    params['query_plan'] = response_query_plan
    print('Query plan generated.')

    #4. SQL query generation
    chain = generate_chain_prompt(SQL_AGENT_PROMPT, params)
    response_sql_query = call_agent(llm, chain, question, structure=SQLQuery)
    params['sql_query'] = response_sql_query.query
    print('SQL query generated.')

    #5. Query execution
    _, error = exec_query(session, params['sql_query'])
    params['wrong_sql'] = params['sql_query'] if error else None
    params['error'] = error.split('\n')[0] if error else None

    #6. Correction loop
    attempts = 0
    store = {}

    while error is not None and attempts < MAX_CRITIC_ATTEMPTS:
        print(f"[Execution Error {attempts}]\n", params['error'])
        
        #6.1. Correction plan
        chain = generate_chain_prompt(CORRECTION_PLAN_PROMPT, params, use_memory=True)
        response_correction_plan = call_agent(llm, chain, question, structure=CorrectionPlan, store=store, use_memory=True)
        params['correction_plan'] = json.loads(response_correction_plan)
        print('Correction plan generated.')

        #6.2. SQL correction
        chain = generate_chain_prompt(CORRECTION_SQL_PROMPT, params, use_memory=True)
        response_corrected_sql = call_agent(llm, chain, question, structure=SQLQuery, store=store, use_memory=True)
        params['corrected_sql'] = json.loads(response_corrected_sql)['query']
        print('Corrected SQL query generated.')

        #6.3. Query correction execution
        _, error = exec_query(session, params['corrected_sql'])
        params['wrong_sql'] = params['sql_query'] if error else None
        params['error'] = error.split('\n')[0] if error else None

        #6.4. Add messages to history
        if error is not None:
            message = f"IMPORTANTE: \nEnfócate en resolver el siguiente error: {params['error']}"
            add_message_to_history(store, role="IA", content=message) #IA/Human

        #6.5. Update SQL query
        params['sql_query'] = params['corrected_sql'] if error is None else params['sql_query']

        attempts += 1

    return params


# ────────────────────────────────────────────────────────────────────────────────
# Run
# ────────────────────────────────────────────────────────────────────────────────

# LLM
# llm = ChatOllama(model=OLLAMA_MODEL[1], temperature=DEFAULT_TEMP)
# llm = ChatGoogleGenerativeAI(model=GEMINI_MODEL, temperature=DEFAULT_TEMP)
llm = ChatOpenAI(model=OPENAI_MODEL, temperature=DEFAULT_TEMP)

# DB
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=ENGINE)
session = SessionLocal()

# Agent call
question = "¿Cuál es el artista con mayor número de canciones vendidas y cuántas fueron?"
result = evaluate(llm, question, session)

print("[SQL Agent Output]\n", result['sql_query'])
exec_result, _ = exec_query(session, result['sql_query'])
exec_result


result.get('query_plan', [])



if __name__ == '__main__':
    evaluate()
