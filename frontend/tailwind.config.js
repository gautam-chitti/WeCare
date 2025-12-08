/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Semantic colors mapped to CSS variables
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        tertiary: 'var(--bg-tertiary)',
        
        'text-main': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        
        accent: 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        
        'card-bg': 'var(--card-bg)',
        'card-border': 'var(--border-color)',
        'card-border-hover': 'var(--border-hover)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideInBottom 0.8s ease-out',
        'float': 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
