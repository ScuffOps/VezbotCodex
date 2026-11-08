import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark glass theme
        background: '#0f0f10',
        surface: '#18181b',
        'surface-elevated': '#1f1f23',
        border: 'rgba(255, 255, 255, 0.08)',
        // Brand colors
        primary: {
          DEFAULT: '#5865f2',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#9b5de5',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#22c55e',
          foreground: '#ffffff',
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#000000',
        },
        error: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#71717a',
          foreground: '#a1a1aa',
        },
      },
      borderRadius: {
        'panel': '35px',
        'control': '25px',
      },
      backdropBlur: {
        'glass': '15px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
