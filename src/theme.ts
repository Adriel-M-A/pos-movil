/**
 * Sistema de diseño "DirectPOS Kiosk"
 * Define la paleta de colores, tipografía, espacios y bordes de la aplicación.
 */

export const theme = {
  colors: {
    // Marca e Identidad
    primary: '#0D3A35',      // Deep Bluish (Marca y textos principales)
    secondary: '#276152',    // Moderate Green (Acciones primarias / CTAs)
    
    // Estados / Métodos de Pago
    efectivo: '#2E7D32',     // Verde oscuro (Efectivo / Éxito)
    transferencia: '#00ACC1', // Cyan/Teal (Transferencia)
    digital: '#0288D1',      // Azul (QR)
    credito: '#8E24AA',      // Púrpura (Crédito)
    danger: '#D32F2F',       // Rojo (Error / Alerta / Eliminar)
    
    // Superficies y Fondos
    background: '#F8F9FA',   // Off-white (Blanco no puro para fondos de pantalla)
    surface: '#FFFFFF',      // Blanco puro para tarjetas/superficies
    border: '#B1B7AB',       // Laurel Green (Borde sutil)
    backdrop: 'rgba(13, 58, 53, 0.60)', // Deep Bluish translúcido para modales
    
    // Textos
    text: {
      primary: '#0D3A35',    // Deep Bluish para máxima legibilidad
      brand: '#0D3A35',      // Deep Bluish para destacar títulos de marca
      secondary: '#276152',  // Moderate Green para textos secundarios
      muted: '#B1B7AB',      // Laurel Green para placeholders e inactivos
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
