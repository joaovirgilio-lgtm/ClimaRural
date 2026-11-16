
import sqlite3
import json
from pathlib import Path
from datetime import datetime

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "climarural.db"


def conectar():
    return sqlite3.connect(DB_PATH)


def criar_tabela():
    with conectar() as conexao:
        conexao.execute("""
            CREATE TABLE IF NOT EXISTS consultas_clima (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                temperatura REAL,
                umidade REAL,
                precipitacao REAL,
                vento REAL,
                consultado_em TEXT NOT NULL,
                dados_json TEXT
            )
        """)


def registrar_consulta(latitude, longitude, dados):
    clima = dados.get("current", {})

    with conectar() as conexao:
        conexao.execute("""
            INSERT INTO consultas_clima (
                latitude,
                longitude,
                temperatura,
                umidade,
                precipitacao,
                vento,
                consultado_em,
                dados_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            latitude,
            longitude,
            clima.get("temperature_2m"),
            clima.get("relative_humidity_2m"),
            clima.get("precipitation"),
            clima.get("wind_speed_10m"),
            datetime.now().astimezone().isoformat(),
            json.dumps(dados, ensure_ascii=False)
        ))


def listar_consultas(limite=20):
    with conectar() as conexao:
        conexao.row_factory = sqlite3.Row

        registros = conexao.execute("""
            SELECT *
            FROM consultas_clima
            ORDER BY id DESC
            LIMIT ?
        """, (limite,)).fetchall()

        return [dict(registro) for registro in registros]


criar_tabela()
