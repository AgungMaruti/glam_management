/**
 * Export array of objects to CSV file
 * @param data Array of objects to export
 * @param columns Array of { key: objectKey, label: columnHeader }
 * @param filename Filename without extension
 */
export function exportCSV(
  data: Record<string, any>[],
  columns: { key: string; label: string }[],
  filename: string
) {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk di-export')
    return
  }

  // Build CSV header
  const headers = columns.map(c => `"${c.label}"`).join(',')

  // Build CSV rows
  const rows = data.map(row => {
    return columns
      .map(col => {
        const val = row[col.key]
        if (val === null || val === undefined) return '""'
        // Escape quotes and wrap in quotes
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      })
      .join(',')
  })

  const csvContent = '\uFEFF' + [headers, ...rows].join('\n')

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
