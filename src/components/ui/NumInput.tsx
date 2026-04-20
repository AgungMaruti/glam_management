'use client'

interface NumInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  value: string
  onChange: (raw: string) => void
}

export default function NumInput({ value, onChange, className = 'field', ...props }: NumInputProps) {
  const display = value ? new Intl.NumberFormat('id-ID').format(Number(value)) : ''

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      className={className}
      value={display}
      onChange={e => {
        const raw = e.target.value.replace(/[^0-9]/g, '')
        onChange(raw)
      }}
    />
  )
}
