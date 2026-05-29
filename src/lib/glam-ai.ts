const BASE_URL = 'https://GLfinance.marserver.my.id'

async function $fetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export async function getProfit(month?: string, year?: string) {
  const params = new URLSearchParams()
  if (month) params.append('month', month)
  if (year) params.append('year', year)
  return $fetch(`${BASE_URL}/api/analysis/profit?${params}`)
}

export async function getCashflowReport() {
  return $fetch(`${BASE_URL}/api/report/cashflow`)
}

export async function getInventory() {
  return $fetch(`${BASE_URL}/api/inventory`)
}

export async function getForecast() {
  return $fetch(`${BASE_URL}/api/forecast/advanced`)
}

export async function getAnomalies() {
  return $fetch(`${BASE_URL}/api/anomaly/ml`)
}

export async function chat(query: string, sessionId = 'web') {
  return $fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sessionId }),
  })
}

export async function inputData(query: string) {
  return $fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, autoInput: true }),
  })
}
