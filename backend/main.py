
from pathlib import Path
import csv

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# Bancos de dados
from database import registrar_consulta, listar_consultas
from mongo_db import salvar_consulta
from duckdb_db import (
    salvar_previsao,
    obter_resumo,
    exportar_previsoes_csv
)


# ==========================================
# CONFIGURAÇÃO DO CLIMARURAL
# ==========================================

app = FastAPI(
    title="ClimaRural",
    description="Sistema inteligente de monitoramento climático para produtores rurais",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Localização dos dados tratados pelo KNIME
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ARQUIVO_KNIME = DATA_DIR / "previsoes_tratadas.csv"


# ==========================================
# ROTA INICIAL
# ==========================================

@app.get("/")
def inicio():
    return {
        "projeto": "ClimaRural",
        "status": "Funcionando!",
        "descricao": "Painel inteligente para produtores rurais"
    }


# ==========================================
# CONSULTA METEOROLÓGICA
# ==========================================

@app.get("/api/clima")
async def consultar_clima(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180)
):

    parametros = {
        "latitude": latitude,
        "longitude": longitude,
        "current": (
            "temperature_2m,"
            "relative_humidity_2m,"
            "precipitation,"
            "wind_speed_10m"
        ),
        "daily": (
            "weather_code,"
            "temperature_2m_max,"
            "temperature_2m_min,"
            "precipitation_sum"
        ),
        "forecast_days": 7,
        "timezone": "auto"
    }

    # Consulta à API Open-Meteo
    try:
        async with httpx.AsyncClient(timeout=30) as cliente:
            resposta = await cliente.get(
                "https://api.open-meteo.com/v1/forecast",
                params=parametros
            )
            resposta.raise_for_status()
            dados = resposta.json()

    except httpx.HTTPError:
        raise HTTPException(
            status_code=502,
            detail="Erro ao consultar a API meteorológica."
        )

    # Armazenamento nos três bancos
    try:
        # SQLite
        registrar_consulta(latitude, longitude, dados)

        # MongoDB
        mongo_id = salvar_consulta(
            latitude,
            longitude,
            dados
        )

        # DuckDB
        registros_duckdb = salvar_previsao(
            latitude,
            longitude,
            dados
        )

    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro no armazenamento dos dados: {erro}"
        )

    return {
        "fonte": "Open-Meteo",
        "localizacao": {
            "latitude": latitude,
            "longitude": longitude
        },
        "clima_atual": dados.get("current"),
        "previsao_7_dias": dados.get("daily"),
        "armazenamento": {
            "sqlite": "salvo",
            "mongodb": "salvo",
            "mongodb_id": mongo_id,
            "duckdb": "salvo",
            "registros_duckdb": registros_duckdb
        }
    }


# ==========================================
# HISTÓRICO SQLITE
# ==========================================

@app.get("/api/historico")
def consultar_historico():

    try:
        registros = listar_consultas()

        return {
            "banco": "SQLite",
            "total": len(registros),
            "consultas": registros
        }

    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar histórico: {erro}"
        )


# ==========================================
# ANÁLISE DUCKDB
# ==========================================

@app.get("/api/analise")
def consultar_analise():

    try:
        resumo = obter_resumo()

        return {
            "banco": "DuckDB",
            "descricao": "Resumo das previsões meteorológicas",
            "analise": resumo
        }

    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro na análise: {erro}"
        )


# ==========================================
# EXPORTAÇÃO PARA KNIME
# ==========================================

@app.get("/api/etl/exportar")
def exportar_dados_para_knime():

    try:
        resultado = exportar_previsoes_csv()

        return {
            "status": "Exportação realizada",
            "destino": "KNIME",
            "arquivo": resultado["arquivo"],
            "caminho": resultado["caminho"],
            "registros": resultado["registros"]
        }

    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro na exportação: {erro}"
        )


# ==========================================
# RESULTADO DO ETL DO KNIME
# ==========================================

@app.get("/api/etl/resultado")
def consultar_resultado_etl():

    if not ARQUIVO_KNIME.exists():
        raise HTTPException(
            status_code=404,
            detail="Arquivo previsoes_tratadas.csv não encontrado."
        )

    try:
        with ARQUIVO_KNIME.open(
            "r",
            encoding="utf-8-sig",
            newline=""
        ) as arquivo:

            leitor = csv.DictReader(arquivo)
            colunas = leitor.fieldnames or []
            registros = list(leitor)

        if "amplitude_termica" not in colunas:
            raise HTTPException(
                status_code=422,
                detail="A coluna amplitude_termica não foi encontrada."
            )

        return {
            "status": "Dados tratados pelo KNIME carregados",
            "ferramenta": "KNIME",
            "total_registros": len(registros),
            "colunas": colunas,
            "dados": registros
        }

    except HTTPException:
        raise

    except Exception as erro:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao ler os dados do KNIME: {erro}"
        )


# ==========================================
# STATUS DO SISTEMA
# ==========================================

@app.get("/api/status")
def verificar_sistema():

    return {
        "projeto": "ClimaRural",
        "backend": "online",
        "bancos_de_dados": {
            "sqlite": "configurado",
            "mongodb": "configurado",
            "duckdb": "configurado"
        },
        "api_externa": "Open-Meteo",
        "ferramenta_etl": "KNIME",
        "arquivo_knime": (
            "encontrado"
            if ARQUIVO_KNIME.exists()
            else "aguardando arquivo"
        )
    }
