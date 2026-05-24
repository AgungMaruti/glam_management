const BASE_URL = 'https://GLfinance.marserver.my.id'

export async function getProfit(month?: string, year?: string) {
  const params = new URLSearchParams()
  if (month) params.append('month', month)
  if (year) params.append('year', year)
  const res = await fetch(`${BASE_URL}/api/analysis/profit?${params}`)
  return res.json()
}

export async function getCashflow() {
  const res = await fetch(`${BASE_URL}/api/analysis/cashflow`)
  return res.json()
}

export async function getInventory() {
  const res = await fetch(`${BASE_URL}/api/inventory`)
  return res.json()
}

export async function getRatios() {
  const res = await fetch(`${BASE_URL}/api/analysis/ratios`)
  return res.json()
}

export async function getInsights() {
  const res = await fetch(`${BASE_URL}/api/insights`)
  return res.json()
}

export async function getForecast() {
  const res = await fetch(`${BASE_URL}/api/forecast/revenue`)
  return res.json()
}

export async function getAnomalies() {
  const res = await fetch(`${BASE_URL}/api/anomaly`)
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
