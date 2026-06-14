import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '@/theme';

interface BotonProps {
  /** Texto que se muestra dentro del botón */
  titulo: string;
  /** Función que se ejecuta al presionar */
  onPress: () => void;
  /** Variante visual que define el color de fondo y de texto */
  variant?: 'primary' | 'secondary' | 'success' | 'info' | 'danger' | 'outline' | 'ghost';
  /** Tamaño del botón (min: 48px, large: 56px) */
  alto?: 'min' | 'large';
  /** Indica si está deshabilitado */
  disabled?: boolean;
  /** Muestra un indicador de carga en lugar de texto */
  loading?: boolean;
  /** Estilos adicionales para el contenedor */
  style?: StyleProp<ViewStyle>;
  /** Estilos adicionales para el texto */
  textStyle?: StyleProp<TextStyle>;
}

export function Boton({
  titulo,
  onPress,
  variant = 'primary',
  alto = 'large',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: BotonProps) {
  const getStyles = () => {
    const botonStyles: ViewStyle[] = [
      styles.base,
      alto === 'large' ? styles.altoLarge : styles.altoMin,
    ];
    const textStyles: TextStyle[] = [styles.textoBase];

    // Aplicar estilos según variante
    switch (variant) {
      case 'primary':
        botonStyles.push({
          backgroundColor: theme.colors.primary,
          borderWidth: 0,
        });
        textStyles.push({ color: theme.colors.text.light });
        break;
      case 'secondary':
        botonStyles.push({
          backgroundColor: theme.colors.secondary,
          borderWidth: 0,
        });
        textStyles.push({ color: theme.colors.text.primary });
        break;
      case 'success':
        botonStyles.push({
          backgroundColor: theme.colors.efectivo,
          borderWidth: 0,
        });
        textStyles.push({ color: theme.colors.text.light });
        break;
      case 'info':
        botonStyles.push({
          backgroundColor: theme.colors.digital,
          borderWidth: 0,
        });
        textStyles.push({ color: theme.colors.text.light });
        break;
      case 'danger':
        botonStyles.push({
          backgroundColor: theme.colors.danger,
          borderWidth: 0,
        });
        textStyles.push({ color: theme.colors.text.light });
        break;
      case 'outline':
        botonStyles.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.border,
        });
        textStyles.push({ color: theme.colors.text.primary });
        break;
      case 'ghost':
        botonStyles.push({
          backgroundColor: 'transparent',
          borderWidth: 0,
        });
        textStyles.push({ color: theme.colors.text.secondary });
        break;
    }

    if (disabled) {
      botonStyles.push(styles.deshabilitado);
      textStyles.push(styles.textoDeshabilitado);
    }

    return { botonStyles, textStyles };
  };

  const { botonStyles, textStyles } = getStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[botonStyles, style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'ghost'
              ? theme.colors.primary
              : variant === 'secondary'
              ? theme.colors.text.primary
              : theme.colors.text.light
          }
        />
      ) : (
        <Text style={[textStyles, textStyle]}>{titulo}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
  },
  altoMin: {
    height: theme.touchTargets.min,
  },
  altoLarge: {
    height: theme.touchTargets.large,
  },
  textoBase: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.md,
    textAlign: 'center',
  },
  deshabilitado: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  textoDeshabilitado: {
    color: theme.colors.text.muted,
  },
});
