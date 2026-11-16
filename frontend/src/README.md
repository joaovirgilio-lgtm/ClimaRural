
# 🌱 ClimaRural

Sistema inteligente de monitoramento climático para pequenos produtores rurais.

## Sobre o projeto

O ClimaRural integra dados meteorológicos de uma API externa, armazena informações em diferentes bancos de dados e utiliza processos ETL para transformar dados em informações úteis para o planejamento agrícola.

## Funcionalidades

- Consulta de condições meteorológicas.
- Previsão do tempo para 7 dias.
- Histórico de consultas climáticas.
- Indicadores de temperatura, umidade e precipitação.
- Armazenamento em três bancos de dados.
- Integração e transformação de dados com KNIME.
- Cálculo de amplitude térmica.
- Painel visual com React.

## Tecnologias utilizadas

### Backend
- Python
- FastAPI
- HTTPX

### Frontend
- React
- Vite
- JavaScript
- CSS

### Bancos de dados
- SQLite
- MongoDB Atlas
- DuckDB

### Integração de dados
- KNIME Analytics Platform
- Apache não utilizado

### API externa
- Open-Meteo

## Estrutura do projeto

```text
ClimaRural/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── mongo_db.py
│   ├── duckdb_db.py
│   └── .env
├── frontend/
│   ├── src/
│   └── package.json
├── etl/
├── data/
│   ├── previsoes_para_knime.csv
│   └── previsoes_tratadas.csv
├── .venv/
├── README.md
├── requirements.txt
└── .gitignore
```

## Como executar

### Backend

Ative o ambiente virtual e instale as dependências:

```powershell
pip install -r requirements.txt
```

Entre na pasta backend:

```powershell
cd backend
```

Execute:

```powershell
python -m uvicorn main:app --reload
```

Documentação da API:

http://127.0.0.1:8000/docs

### Frontend

Abra outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Aplicação:

http://localhost:5173

## Rotas principais

| Rota | Descrição |
|---|---|
| GET / | Status do sistema |
| GET /api/clima | Consulta meteorológica |
| GET /api/historico | Histórico SQLite |
| GET /api/analise | Análise DuckDB |
| GET /api/etl/exportar | Exportação para KNIME |
| GET /api/etl/resultado | Dados tratados pelo KNIME |
| GET /api/status | Status da aplicação |

## Processo ETL

1. Extração dos dados meteorológicos.
2. Armazenamento nos bancos de dados.
3. Exportação dos dados do DuckDB.
4. Leitura e tratamento pelo KNIME.
5. Cálculo da amplitude térmica.
6. Exportação dos dados tratados.
7. Exibição dos resultados no React.

## Fonte dos dados

Open-Meteo: https://open-meteo.com/

## Projeto acadêmico

Desenvolvido para a disciplina de Integração de Dados.

