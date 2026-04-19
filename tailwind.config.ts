import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#F2F0EB',
        'ivory-dark': '#E8E5DF',
        ink: '#1C1C2E',
        'ink-light': '#2D2D42',
        primary: '#6366F1',
        'primary-light': '#EEF2FF',
        accent: '#F59E0B',
        'accent-light': '#FFFBEB',
        success: '#059669',
        'success-light': '#ECFDF5',
        danger: '#DC2626',
        'danger-light': '#FEF2F2',
        warning: '#D97706',
        'warning-light': '#FFFBEB',
        muted: '#6B7280',
        border: '#EBEBEB',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.06)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}

export default config
