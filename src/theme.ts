/**
 * Sistema de diseño "DirectPOS Kiosk"
 * Define la paleta de colores, tipografía, espacios y bordes de la aplicación.
 */

export const theme = {
  colors: {
    // Marca e Identidad
    primary: '#004D40',      // Deep Emerald (Marca y textos principales)
    secondary: '#00BFA5',    // Teal Vibrante (Acciones primarias / CTAs)
    
    // Estados / Métodos de Pago
    efectivo: '#2E7D32',     // Verde oscuro (Efectivo / Éxito)
    digital: '#0288D1',      // Azul (QR / Transferencia)
    danger: '#D32F2F',       // Rojo (Error / Alerta / Eliminar)
    
    // Superficies y Fondos
    background: '#FFFFFF',   // Fondo principal de la app
    surface: '#F5F7F7',      // Gris tenue para listas, tarjetas secundarias
    border: '#E2E8F0',       // Borde sutil para separar elementos (1px)
    backdrop: 'rgba(0, 0, 0, 0.60)', // Opacidad de 60% para modales
    
    // Textos
    text: {
      primary: '#1A252C',    // Slate oscuro para textos generales y máxima legibilidad
      brand: '#004D40',      // Deep Emerald para destacar títulos de marca
      secondary: '#455A64',  // Gris intermedio para textos secundarios
      muted: '#90A4AE',      // Gris claro para placeholders
      light: '#FFFFFF',      // Blanco para textos sobre fondos oscuros
    },
  },
  
  fonts: {
    // Nombres de fuentes cargadas desde Google Fonts
    regular: 'HankenGrotesk_400Regular',
    medium: 'HankenGrotesk_500Medium',
    bold: 'HankenGrotesk_700Bold',
    extraBold: 'HankenGrotesk_800ExtraBold',
    monoRegular: 'JetBrainsMono_400Regular',
    monoBold: 'JetBrainsMono_700Bold',
  },
  
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    giant: 32,
    huge: 40,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  
  borderRadius: {
    sm: 4,      // Estándar para inputs, chips y botones chicos
    md: 8,      // Para tarjetas (cards) grandes y modales
    lg: 12,     // Para modales especiales u contenedores grandes
    round: 9999, // Para botones circulares o avatares
  },
  
  touchTargets: {
    min: 48,    // Altura mínima recomendada por accesibilidad
    large: 56,  // Altura ideal para botones y acciones principales de POS
  },
};
