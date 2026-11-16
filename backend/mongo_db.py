
from pathlib import Path
from os import getenv
from datetime import datetime, timezone
from urllib.parse import quote_plus

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi

load_dotenv(Path(__file__).with_name(".env"))

usuario = getenv("MONGODB_USER")
senha = getenv("MONGODB_PASSWORD")
host = getenv("MONGODB_HOST")
NOME_BANCO = getenv("MONGODB_DATABASE", "climarural")

if not all([usuario, senha, host]):
    raise RuntimeError("Verifique as configurações do MongoDB no .env")

# Codifica corretamente usuário e senha
URI = (
    f"mongodb+srv://{quote_plus(usuario)}:"
    f"{quote_plus(senha)}@{host}/"
    "?retryWrites=true&w=majority&appName=Cluster0"
)

cliente = MongoClient(
    URI,
    server_api=ServerApi("1"),
    serverSelectionTimeoutMS=10000
)

banco = cliente[NOME_BANCO]
colecao_clima = banco["consultas_clima"]


def testar_conexao():
    cliente.admin.command("ping")
    return "Conexão com MongoDB Atlas funcionando!"


def salvar_consulta(latitude, longitude, dados):
    documento = {
        "latitude": latitude,
        "longitude": longitude,
        "fonte": "Open-Meteo",
        "clima_atual": dados.get("current"),
        "previsao_diaria": dados.get("daily"),
        "registrado_em": datetime.now(timezone.utc)
    }

    resultado = colecao_clima.insert_one(documento)
    return str(resultado.inserted_id)
