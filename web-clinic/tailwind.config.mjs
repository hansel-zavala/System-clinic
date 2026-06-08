/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Nuevos tokens de diseño del Santuario Editorial
        "primary": "#143d26", // Verde Bosque Profundo
        "background": "#fafaf6", // Fondo Hueso Claro
        "surface": "#ffffff", // Superficie Blanca
        "on-background": "#111612", // Carbón Orgánico (Texto principal)
        "on-surface": "#111612",
        "on-surface-variant": "#5c645e", // Verde Liquen (Texto secundario)
        "secondary": "#5c645e",
        "outline": "#dcdfdc", // Borde Musgo Claro
        "outline-variant": "#dcdfdc",
        
        // Contenedores estructurados con sutiles variaciones cromáticas en base al verde liquen/hueso
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f6f7f4",
        "surface-container": "#f1f3f0",
        "surface-container-high": "#e8ebe6",
        "surface-container-highest": "#dfdfdb",
        
        // Elementos interactivos heredados remapeados
        "primary-container": "#e2ebd5", // Fondo verde claro para burbujas/chips
        "on-primary-container": "#0b2516",
        "secondary-container": "#e2e6e1",
        "on-secondary-container": "#323833",
        "primary-fixed": "#e2ebd5",
        "primary-fixed-dim": "#cbd7bd",
        "on-primary-fixed": "#0b2516",
        "on-primary-fixed-variant": "#143d26",
        
        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        "sm": "4px",
        "DEFAULT": "4px",
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
        "full": "9999px"
      },
      spacing: {
        "xs": "4px",
        "sm": "8px",
        "base": "12px",
        "md": "16px",
        "lg": "24px",
        "gutter": "24px",
        "xl": "48px",
        "2xl": "80px",
        "max-width": "1200px",
        "margin-desktop": "auto",
        "margin-mobile": "16px"
      },
      fontFamily: {
        "display": ["Cormorant Garamond", "Georgia", "serif"],
        "body": ["Inter", "sans-serif"],
        "label-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Cormorant Garamond", "Georgia", "serif"],
        "headline-xl": ["Cormorant Garamond", "Georgia", "serif"],
        "headline-lg": ["Cormorant Garamond", "Georgia", "serif"],
        "headline-md": ["Cormorant Garamond", "Georgia", "serif"],
        "caption": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"]
      },
      fontSize: {
        "label-md": ["14px", { "lineHeight": "20px", "letterSpacing": "0.05em", "fontWeight": "500" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "headline-lg-mobile": ["28px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "400" }],
        "headline-xl": ["clamp(2.5rem, 5.5vw, 4.25rem)", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "400" }],
        "headline-lg": ["32px", { "lineHeight": "36px", "letterSpacing": "-0.01em", "fontWeight": "400" }],
        "headline-md": ["24px", { "lineHeight": "28px", "letterSpacing": "-0.01em", "fontWeight": "400" }],
        "caption": ["12px", { "lineHeight": "16px", "fontWeight": "400" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }]
      }
    },
  },
  plugins: [
    forms,
    containerQueries,
  ],
}
