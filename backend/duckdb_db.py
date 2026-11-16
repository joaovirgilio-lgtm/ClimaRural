
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4
import duckdb
import csv

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "climarural.duckdb"


def conectar():
    return duckdb.connect(str(DB_PATH))


def criar_tabela():
    conexao = conectar()

    try:
        conexao.execute("""
            CREATE TABLE IF NOT EXISTS previsoes_diarias (
                registro_id VARCHAR,
                latitude DOUBLE,
                longitude DOUBLE,
                data_previsao DATE,
                codigo_tempo INTEGER,
                temperatura_maxima DOUBLE,
                temperatura_minima DOUBLE,
                precipitacao_mm DOUBLE,
                coletado_em_utc TIMESTAMP
            )
        """)
    finally:
        conexao.close()


def salvar_previsao(latitude, longitude, dados):
    diaria = dados.get("daily", {})
    datas = diaria.get("time", [])

    def valor(campo, indice):
        valores = diaria.get(campo, [])
        return valores[indice] if indice < len(valores) else None

    momento = datetime.now(timezone.utc).replace(tzinfo=None)
    registros = []

    for i, data in enumerate(datas):
        registros.append((
            str(uuid4()),
            latitude,
            longitude,
            data,
            valor("weather_code", i),
            valor("temperature_2m_max", i),
            valor("temperature_2m_min", i),
            valor("precipitation_sum", i),
            momento
        ))

    if not registros:
        return 0

    conexao = conectar()

    try:
        conexao.executemany("""
            INSERT INTO previsoes_diarias VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        """, registros)
    finally:
        conexao.close()

    return len(registros)


def obter_resumo():
    conexao = conectar()

    try:
        resultado = conexao.execute("""
            SELECT
                COUNT(*) AS total_registros,
                ROUND(AVG(temperatura_maxima), 1),
                ROUND(AVG(temperatura_minima), 1),
                ROUND(SUM(precipitacao_mm), 1)
            FROM previsoes_diarias
        """).fetchone()

        return {
            "total_registros": resultado[0],
            "media_temperatura_maxima": resultado[1],
            "media_temperatura_minima": resultado[2],
            "chuva_acumulada_mm": resultado[3]
        }
    finally:
        conexao.close()


def exportar_previsoes_csv():
    destino = DATA_DIR / "previsoes_para_knime.csv"
    conexao = conectar()

    try:
        resultado = conexao.execute("""
            SELECT
                latitude,
                longitude,
                CAST(data_previsao AS VARCHAR) AS data_previsao,
                codigo_tempo,
                temperatura_maxima,
                temperatura_minima,
                precipitacao_mm,
                CAST(coletado_em_utc AS VARCHAR) AS coletado_em_utc
            FROM previsoes_diarias
            ORDER BY latitude, longitude, data_previsao
        """)

        colunas = [item[0] for item in resultado.description]
        registros = resultado.fetchall()

    finally:
        conexao.close()

    with destino.open(
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as arquivo:
        escritor = csv.writer(arquivo)
        escritor.writerow(colunas)
        escritor.writerows(registros)

    return {
        "arquivo": destino.name,
        "caminho": str(destino),
        "registros": len(registros)
    }


criar_tabela()
