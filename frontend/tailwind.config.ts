import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontSize: {
        '2xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'xs': ['0.8125rem', { lineHeight: '1.125rem' }], // 13px (was 12px)
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }], // 15px (was 14px)
        'base': ['1.0625rem', { lineHeight: '1.625rem' }], // 17px (was 16px)
        'lg': ['1.1875rem', { lineHeight: '1.75rem' }],  // 19px (was 18px)
        'xl': ['1.3125rem', { lineHeight: '1.875rem' }], // 21px (was 20px)
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }], // 26px (was 24px)
        '3xl': ['2rem', { lineHeight: '2.5rem' }],       // 32px (was 30px)
        '4xl': ['2.5rem', { lineHeight: '2.875rem' }],    // 40px (was 36px)
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
