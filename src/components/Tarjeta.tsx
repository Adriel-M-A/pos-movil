import { ReactNode } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { theme } from '@/theme';

interface TarjetaProps {
  /** Contenido interno de la tarjeta */
  children: ReactNode;
  /** Estilos adicionales para la tarjeta */
  style?: StyleProp<ViewStyle>;
  /** Si es true, usa un fondo gris tenue (surface) en lugar de blanco */
  tinted?: boolean;
  /** Si es true, dibuja un borde sutil alrededor de la tarjeta */
  border?: boolean;
  /** Si se provee, la tarjeta es presionable y ejecuta esta función */
  onPress?: () => void;
}

export function Tarjeta({
  children,
  style,
  tinted = false,
  border = true,
  onPress,
}: TarjetaProps) {
  const cardStyles: ViewStyle[] = [
    styles.base,
    tinted ? styles.tinted : styles.plain,
    border ? styles.border : {},
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[cardStyles, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyles, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: '100%',
  },
  plain: {
    backgroundColor: theme.colors.background,
  },
  tinted: {
    backgroundColor: theme.colors.surface,
  },
  border: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
