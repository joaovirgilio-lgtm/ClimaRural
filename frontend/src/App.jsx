
import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API = 'http://127.0.0.1:8000'

const WEATHER_URL =
  `${API}/api/clima?latitude=-23.5505&longitude=-46.6333`

function getWeather(code) {
  if (code === 0) return { icon: '☀️', label: 'Céu limpo' }
  if ([1, 2, 3].includes(code)) return { icon: '⛅', label: 'Parcialmente nublado' }
  if ([45, 48].includes(code)) return { icon: '🌫️', label: 'Neblina' }
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: '🌦️', label: 'Garoa' }
  if ([61, 63, 65, 66, 67].includes(code)) return { icon: '🌧️', label: 'Chuva' }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: '❄️', label: 'Neve' }
  if ([80, 81, 82].includes(code)) return { icon: '🌧️', label: 'Pancadas de chuva' }
  if ([95, 96, 99].includes(code)) return { icon: '⛈️', label: 'Tempestade' }

  return { icon: '🌤️', label: 'Condição variável' }
}

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const number = Number(value)

  return Number.isFinite(number)
    ? number.toFixed(digits)
    : '—'
}

function formatDay(date, index) {
  if (index === 0) return 'Hoje'

  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    timeZone: 'UTC'
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace('.', '')
}

function App() {
  const [weather, setWeather] = useState(null)
  const [etlData, setEtlData] = useState(null)

  const [weatherLoading, setWeatherLoading] = useState(true)
  const [etlLoading, setEtlLoading] = useState(true)

  const [weatherError, setWeatherError] = useState('')
  const [etlError, setEtlError] = useState('')

  // Consulta a previsão meteorológica
  const loadWeather = useCallback(async () => {
    setWeatherLoading(true)
    setWeatherError('')

    try {
      const response = await fetch(WEATHER_URL)

      if (!response.ok) {
        throw new Error('Erro ao consultar a previsão.')
      }

      const data = await response.json()
      setWeather(data)

    } catch (error) {
      setWeatherError(
        'Não foi possível carregar o clima. Verifique se o backend está funcionando.'
      )
    } finally {
      setWeatherLoading(false)
    }
  }, [])

  // Consulta os dados tratados pelo KNIME
  const loadETL = useCallback(async () => {
    setEtlLoading(true)
    setEtlError('')

    try {
      const response = await fetch(
        `${API}/api/etl/resultado`
      )

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do KNIME.')
      }

      const data = await response.json()

      setEtlData(data)

    } catch (error) {
      setEtlError(
        'Não foi possível carregar os dados tratados pelo KNIME.'
      )
    } finally {
      setEtlLoading(false)
    }
  }, [])

  // Carrega os dados ao abrir a aplicação
  useEffect(() => {
    loadWeather()
    loadETL()
  }, [loadWeather, loadETL])

  // Atualiza as duas fontes
  function atualizarDados() {
    loadWeather()
    loadETL()
  }

  const current = weather?.clima_atual
  const daily = weather?.previsao_7_dias

  const days = daily?.time ?? []
  const etlRows = etlData?.dados ?? []

  const maxTemperatures = daily?.temperature_2m_max ?? []
  const minTemperatures = daily?.temperature_2m_min ?? []
  const rainValues = daily?.precipitation_sum ?? []

  const validMax = maxTemperatures
    .map(Number)
    .filter(Number.isFinite)

  const validMin = minTemperatures
    .map(Number)
    .filter(Number.isFinite)

  const maxWeek = validMax.length
    ? Math.max(...validMax)
    : null

  const minWeek = validMin.length
    ? Math.min(...validMin)
    : null

  const totalRain = rainValues
    .map(Number)
    .filter(Number.isFinite)
    .reduce((sum, value) => sum + value, 0)

  const todayRain = rainValues[0]
  const todayWeather = getWeather(daily?.weather_code?.[0])

  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }).format(new Date())

  return (
    <div className="app-shell">

      {/* MENU LATERAL */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">🌱</div>

          <span>
            Clima<span className="brand-light">Rural</span>
          </span>
        </div>

        <p className="menu-label">MENU PRINCIPAL</p>

        <div className="nav-link active">
          <span>▦</span>
          Painel geral
        </div>

        <div className="nav-link">
          <span>☁</span>
          Monitoramento
        </div>

        <div className="nav-link">
          <span>▤</span>
          Previsão semanal
        </div>

        <div className="nav-link">
          <span>⚑</span>
          Dados integrados
        </div>

        <div className="sidebar-bottom">

          <div className="sidebar-status">
            <span className="status-dot"></span>
            Sistema operacional
          </div>

          <p>ClimaRural · Versão 1.0</p>
        </div>

      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="main-content">

        {/* CABEÇALHO */}
        <header className="topbar">

          <div>
            <span className="topbar-label">
              PLATAFORMA DE INTELIGÊNCIA AGRÍCOLA
            </span>

            <h1>Painel climático</h1>
          </div>

          <div className="date-box">
            <span>📅</span>
            <span>{today}</span>
          </div>

        </header>

        {/* APRESENTAÇÃO */}
        <section className="welcome-row">

          <div>
            <h2>Visão geral do clima</h2>

            <p>
              Acompanhe as condições meteorológicas
              e planeje suas atividades agrícolas.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={atualizarDados}
            disabled={weatherLoading || etlLoading}
          >
            ↻ Atualizar dados
          </button>

        </section>

        {/* ERROS */}
        {weatherError && (
          <div className="error-box">
            {weatherError}
            <button onClick={loadWeather}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* CARREGAMENTO */}
        {weatherLoading && !weather && (
          <div className="loading-box">
            Carregando informações meteorológicas...
          </div>
        )}

        {/* INFORMAÇÕES DO CLIMA */}
        {weather && current && (
          <>

            {/* DESTAQUE CLIMÁTICO */}
            <section className="weather-hero">

              <div className="hero-info">

                <span className="hero-location">
                  📍 SÃO PAULO · SP · LOCAL DE TESTE
                </span>

                <h2>Condições atuais</h2>

                <p>
                  Dados meteorológicos fornecidos pela Open-Meteo.
                </p>

                <div className="hero-temperature">
                  {formatNumber(current.temperature_2m)}
                  <span>°C</span>
                </div>

                <span className="hero-description">
                  {todayWeather.label}
                </span>

              </div>

              <div className="hero-weather-icon">
                {todayWeather.icon}
              </div>

              <div className="hero-source">
                API OPEN-METEO
              </div>

            </section>

            {/* INDICADORES */}
            <section className="metrics-grid">

              <div className="metric-card">

                <div className="metric-top">
                  <span>Umidade do ar</span>
                  <span className="metric-icon blue">💧</span>
                </div>

                <strong>
                  {formatNumber(current.relative_humidity_2m, 0)}%
                </strong>

                <small>Umidade relativa</small>

              </div>

              <div className="metric-card">

                <div className="metric-top">
                  <span>Vento</span>
                  <span className="metric-icon green">🍃</span>
                </div>

                <strong>
                  {formatNumber(current.wind_speed_10m)}
                  <small> km/h</small>
                </strong>

                <small>Velocidade do vento</small>

              </div>

              <div className="metric-card">

                <div className="metric-top">
                  <span>Chuva atual</span>
                  <span className="metric-icon blue">🌧️</span>
                </div>

                <strong>
                  {formatNumber(current.precipitation)}
                  <small> mm</small>
                </strong>

                <small>Precipitação registrada</small>

              </div>

              <div className="metric-card">

                <div className="metric-top">
                  <span>Chuva prevista hoje</span>
                  <span className="metric-icon orange">☔</span>
                </div>

                <strong>
                  {formatNumber(todayRain)}
                  <small> mm</small>
                </strong>

                <small>Volume previsto no dia</small>

              </div>

            </section>

            {/* PREVISÃO E RESUMO */}
            <section className="content-grid">

              <div className="panel forecast-panel">

                <div className="panel-header">

                  <div>
                    <h3>Previsão para 7 dias</h3>

                    <p>
                      Acompanhe a evolução do clima durante a semana.
                    </p>
                  </div>

                  <span className="panel-icon">📆</span>

                </div>

                <div className="forecast-list">

                  {days.map((date, index) => {

                    const condition = getWeather(
                      daily.weather_code[index]
                    )

                    const max = daily.temperature_2m_max[index]
                    const min = daily.temperature_2m_min[index]
                    const rain = daily.precipitation_sum[index]

                    return (
                      <div className="forecast-row" key={date}>

                        <div className="forecast-day">
                          {formatDay(date, index)}
                        </div>

                        <div className="forecast-icon">
                          {condition.icon}
                        </div>

                        <div className="forecast-condition">
                          {condition.label}
                        </div>

                        <div className="forecast-temperatures">
                          <strong>{formatNumber(max, 0)}°</strong>
                          <span>{formatNumber(min, 0)}°</span>
                        </div>

                        <div className="forecast-rain">
                          💧 {formatNumber(rain)} mm
                        </div>

                      </div>
                    )
                  })}

                </div>

              </div>

              {/* RESUMO DA SEMANA */}
              <div className="panel summary-panel">

                <div className="panel-header">

                  <div>
                    <h3>Resumo da semana</h3>

                    <p>
                      Indicadores dos próximos sete dias.
                    </p>
                  </div>

                  <span className="panel-icon">📊</span>

                </div>

                <div className="summary-item">
                  <span>🌡️ Maior temperatura</span>
                  <strong>
                    {formatNumber(maxWeek)} °C
                  </strong>
                </div>

                <div className="summary-item">
                  <span>❄️ Menor temperatura</span>
                  <strong>
                    {formatNumber(minWeek)} °C
                  </strong>
                </div>

                <div className="summary-item">
                  <span>🌧️ Chuva acumulada</span>
                  <strong>
                    {formatNumber(totalRain)} mm
                  </strong>
                </div>

                <div className="insight-box">

                  <span>💡</span>

                  <div>
                    <strong>Informação importante</strong>

                    <p>
                      Consulte a previsão antes de planejar
                      atividades agrícolas ao ar livre.
                    </p>
                  </div>

                </div>

              </div>

            </section>

          </>
        )}

        {/* RESULTADO DO KNIME */}
        <section className="panel etl-panel">

          <div className="panel-header">

            <div>
              <h3>Dados tratados pelo KNIME</h3>

              <p>
                Informações processadas pelo fluxo de integração ETL.
              </p>
            </div>

            <span className="panel-icon">📊</span>

          </div>

          {etlLoading && (
            <div className="loading-box">
              Carregando dados tratados...
            </div>
          )}

          {etlError && (
            <div className="error-box">
              {etlError}

              <button onClick={loadETL}>
                Tentar novamente
              </button>
            </div>
          )}

          {etlData && !etlLoading && (

            <>

              <div className="etl-summary">

                <strong>{etlData.total_registros}</strong>

                <span>
                  Previsões processadas pelo KNIME
                </span>

              </div>

              <div className="etl-table-wrap">

                <table className="etl-table">

                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Máxima</th>
                      <th>Mínima</th>
                      <th>Chuva</th>
                      <th>Amplitude térmica</th>
                    </tr>
                  </thead>

                  <tbody>

                    {etlRows.map((item, index) => (

                      <tr
                        key={`${item.data_previsao}-${index}`}
                      >

                        <td>{item.data_previsao}</td>

                        <td>
                          {formatNumber(item.temperatura_maxima)} °C
                        </td>

                        <td>
                          {formatNumber(item.temperatura_minima)} °C
                        </td>

                        <td>
                          {formatNumber(item.precipitacao_mm)} mm
                        </td>

                        <td>
                          <strong>
                            {formatNumber(item.amplitude_termica)} °C
                          </strong>
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

              {etlRows.length === 0 && (
                <div className="loading-box">
                  Nenhum registro tratado foi encontrado.
                </div>
              )}

              <div className="etl-footer">
                Fonte: DuckDB → KNIME → ClimaRural
              </div>

            </>

          )}

        </section>

        {/* RODAPÉ */}
        <footer className="footer">

          <span>
            ClimaRural · Dados meteorológicos fornecidos pela Open-Meteo.
          </span>

          <span>
            Projeto acadêmico de Integração de Dados.
          </span>

        </footer>

      </main>

    </div>
  )
}

export default App
