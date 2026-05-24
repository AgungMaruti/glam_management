const BASE_URL = 'https://GLfinance.marserver.my.id'

export async function getProfit(month?: string, year?: string) {
  const params = new URLSearchParams()
  if (month) params.append('month', month)
  if (year) params.append('year', year)
  const res = await fetch(`${BASE_URL}/api/analysis/profit?${params}`)
  return res.json()
}

export async function getCashflowReport() {
  const res = await fetch(`${BASE_URL}/api/report/cashflow`)
  return res.json()
}

export async function getInventory() {
  const res = await fetch(`${BASE_URL}/api/inventory`)
  return res.json()
}

export async function getForecast() {
  const res = await fetch(`${BASE_URL}/api/forecast/advanced`)
  return res.json()
}

export async function getAnomalies() {
  const res = await fetch(`${BASE_URL}/api/anomaly/ml`)
  return res.json()
}

export async function chat(query: string, sessionId = 'web') {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sessionId }),
  })
  return res.json()
}

export async function inputData(query: string) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, autoInput: true }),
  })
  return res.json()
}
