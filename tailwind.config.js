/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'; // Importar colores base

export default {
  darkMode: 'class', // Habilitar modo oscuro por clase
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Redefinir primario a un azul estándar (ej: blue-600)
        // Eliminar el anterior #002B2E por ahora
        primary: colors.blue[600],
        'primary-hover': colors.blue[700],
        'primary-focus': colors.blue[700],
        // Podemos añadir colores para dark mode si es necesario
        'primary-dark': colors.blue[500],
        'primary-hover-dark': colors.blue[600],
        'primary-focus-dark': colors.blue[600],
      },
    },
  },
  plugins: [],
};
