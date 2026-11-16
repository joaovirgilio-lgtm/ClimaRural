# ClimaRural 🌱

Sistema de monitoramento climático que integra dados meteorológicos e apresenta informações para apoiar o planejamento de pequenos produtores rurais.

## Objetivo

O ClimaRural consulta previsões meteorológicas por meio da API Open-Meteo, armazena os dados em diferentes tecnologias, aplica um processo ETL no KNIME e disponibiliza indicadores em uma interface web.

## Funcionalidades

- Consulta de condições meteorológicas por coordenadas geográficas.
- Previsão diária para até sete dias.
- Indicadores de temperatura, umidade, vento e precipitação.
- Histórico de consultas armazenado no SQLite.
- Armazenamento dos dados meteorológicos originais no MongoDB Atlas.
- Consolidação e análise de previsões no DuckDB.
- Exportação de dados do DuckDB para CSV.
- Tratamento dos dados no KNIME, incluindo cálculo da amplitude térmica.
- Exibição dos dados tratados em um painel React.

## Tecnologias

| Camada | Tecnologia | Finalidade |
|---|---|---|
| API externa | Open-Meteo | Fornecer dados meteorológicos |
| Backend | Python, FastAPI, HTTPX | Consultar, integrar e disponibilizar dados |
| Banco relacional | SQLite | Guardar o histórico de consultas |
| Banco NoSQL | MongoDB Atlas | Guardar documentos meteorológicos originais |
| Banco analítico | DuckDB | Consolidar e analisar previsões diárias |
| ETL | KNIME Analytics Platform | Ler, filtrar, tratar e transformar os dados |
| Frontend | React, Vite, CSS | Apresentar indicadores e previsões |

## Arquitetura e fluxo de dados

1. O backend Python consulta a API Open-Meteo.
2. A resposta é armazenada no SQLite, MongoDB Atlas e DuckDB.
3. O DuckDB exporta os registros diários para `data/previsoes_para_knime.csv`.
4. O KNIME lê o CSV, seleciona colunas, trata valores ausentes e calcula `amplitude_termica` (temperatura máxima menos temperatura mínima).
5. O KNIME grava `data/previsoes_tratadas.csv`.
6. O backend disponibiliza o resultado tratado pela rota `/api/etl/resultado`.
7. O frontend React consulta o backend e apresenta o clima e a tabela de dados tratados.

## Estrutura do projeto

```text
ClimaRural/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── mongo_db.py
│   ├── duckdb_db.py
│   ├── .env.example
│   └── .env                 # criar localmente; não publicar
├── data/
│   ├── previsoes_para_knime.csv
│   └── previsoes_tratadas.csv
├── etl/
│   └── ETL_ClimaRural.knwf  # exportar do KNIME e adicionar ao repositório
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── .gitignore
├── README.md
└── requirements.txt
```

> O arquivo `backend/.env` contém credenciais e deve ser criado localmente. Ele não deve ser enviado ao GitHub. A pasta `.venv`, `node_modules` e os bancos locais também não devem ser versionados.

## Pré-requisitos

- Python instalado.
- Node.js e npm instalados.
- KNIME Analytics Platform para abrir e executar o workflow ETL.
- Acesso à internet para consultar a Open-Meteo e conectar ao MongoDB Atlas.
- Usuário de banco no MongoDB Atlas e endereço IP do computador autorizado no Atlas.

## Configuração do backend

Abra um terminal na pasta raiz do projeto (`ClimaRural`). Crie e ative o ambiente virtual:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Instale as dependências:

```powershell
pip install -r requirements.txt
```

Crie o arquivo `backend/.env` a partir de `backend/.env.example` e preencha as credenciais do seu usuário de banco MongoDB Atlas:

```env
MONGODB_USER=seu_usuario_do_banco
MONGODB_PASSWORD="sua_senha_do_banco"
MONGODB_HOST=seu_cluster.mongodb.net
MONGODB_DATABASE=climarural
```

Não compartilhe esse arquivo nem publique suas credenciais. Se a senha contiver caracteres especiais, o backend deve codificá-los para uso na URI.

Inicie o backend em um terminal, a partir da raiz do projeto:

```powershell
cd backend
python -m uvicorn main:app --reload
```

Documentação interativa da API: <http://127.0.0.1:8000/docs>

## Configuração do frontend

Abra um segundo terminal na raiz do projeto (`ClimaRural`). Entre na pasta do frontend, instale as dependências e inicie o servidor de desenvolvimento:

```powershell
cd frontend
npm install
npm run dev
```

Abra a aplicação em <http://localhost:5173>.

## Principais rotas da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Informações iniciais do sistema |
| GET | `/api/clima` | Consulta o clima e grava nos três bancos; requer `latitude` e `longitude` |
| GET | `/api/historico` | Consulta o histórico no SQLite |
| GET | `/api/analise` | Retorna resumo analítico do DuckDB |
| GET | `/api/etl/exportar` | Exporta dados do DuckDB para CSV de entrada do KNIME |
| GET | `/api/etl/resultado` | Lê o CSV tratado pelo KNIME |
| GET | `/api/status` | Retorna informações de configuração do sistema |

Exemplo de consulta meteorológica:

```text
http://127.0.0.1:8000/api/clima?latitude=-23.5505&longitude=-46.6333
```

## Executar o processo ETL no KNIME

1. Inicie o backend e execute `/api/etl/exportar` na documentação da API para gerar `data/previsoes_para_knime.csv`.
2. Abra o workflow `etl/ETL_ClimaRural.knwf` no KNIME Analytics Platform. Se o arquivo ainda não estiver na pasta `etl`, exporte o workflow pelo KNIME e adicione o arquivo ao repositório.
3. Confira o caminho do arquivo no nó CSV Reader. Em outro computador, ajuste o caminho para a pasta `data` daquele computador, se necessário.
4. Execute o fluxo: CSV Reader → Column Filter → Missing Value → Math Formula → CSV Writer.
5. No Math Formula, calcule a amplitude térmica por `temperatura_maxima - temperatura_minima` e grave o resultado na coluna `amplitude_termica`.
6. Configure o CSV Writer para gravar `data/previsoes_tratadas.csv`.
7. Execute `/api/etl/resultado` para conferir se o backend consegue ler o resultado tratado.

## Repositório

Código-fonte: <https://github.com/joaovirgilio-lgtm/ClimaRural>

## Fonte dos dados

Open-Meteo: <https://open-meteo.com/>

## Projeto acadêmico

Desenvolvido para a disciplina de Integração de Dados.
