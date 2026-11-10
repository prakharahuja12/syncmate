/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        card: 'var(--card)',
        border: 'var(--border)',
        foreground: 'var(--text)',
        muted: 'var(--muted)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-fg)',
        },
        priority: {
          high: '#E5484D',
          medium: '#F5A524',
          low: '#30A46C',
        },
        category: {
          hackathon: '#8E4EC6',
          college: '#3E63DD',
          personal: '#30A46C',
          meeting: '#F5A524',
          competition: '#D6409F',
          other: '#8B8D98',
        },
      },
      borderRadius: {
        xl: '16px',
        lg: '12px',
        md: '8px',
      },
    },
  },
  plugins: [],
};

