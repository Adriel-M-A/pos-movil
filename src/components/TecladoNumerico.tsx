import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { theme } from '@/theme';
import { MaterialIcons } from '@expo/vector-icons';

export type TipoTecla = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '0' | ',' | 'backspace';

interface TecladoNumericoProps {
  /** Callback cuando se presiona una tecla */
  onPresionarTecla: (tecla: TipoTecla) => void;
  /** Callback opcional cuando se mantiene presionado el botón borrar (para borrar todo) */
  onLimpiarTodo?: () => void;
  /** Estilos opcionales para el contenedor del teclado */
  style?: StyleProp<ViewStyle>;
  /** Indica si la coma decimal está marcada en la entrada */
  comaActiva?: boolean;
}

export function TecladoNumerico({
  onPresionarTecla,
  onLimpiarTodo,
  style,
  comaActiva = false,
}: TecladoNumericoProps) {
  
  const teclas: TipoTecla[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [',', '0', 'backspace'],
  ];

  const renderTecla = (tecla: TipoTecla) => {
    const esBackspace = tecla === 'backspace';
    const esComa = tecla === ',';
    const esComaMarcada = esComa && comaActiva;

    return (
      <TouchableOpacity
        key={tecla}
        style={[
          styles.tecla,
          esBackspace && styles.teclaAccion,
          esComa && styles.teclaAccion,
          esComaMarcada && styles.teclaComaActiva,
        ]}
        onPress={() => onPresionarTecla(tecla)}
        onLongPress={esBackspace ? onLimpiarTodo : undefined}
        delayLongPress={500}
        activeOpacity={0.6}
      >
        {esBackspace ? (
          <MaterialIcons name="backspace" size={20} color={theme.colors.text.primary} />
        ) : (
          <Text style={[
            styles.teclaTexto,
            esComa && styles.teclaTextoEspecial,
            esComaMarcada && styles.teclaTextoComaActiva
          ]}>
            {tecla}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.contenedor, style]}>
      {teclas.map((fila, index) => (
        <View key={index} style={styles.fila}>
          {fila.map(renderTecla)}
        </View>
      ))}
    </View>
  );
}

/**
 * Función de utilidad recomendada para manejar la entrada de texto del teclado.
 * @param valorActual El estado actual del texto (ej. "120,50" o "")
 * @param tecla La tecla presionada
 * @returns El nuevo string procesado
 */
export function procesarEntradaTeclado(valorActual: string, tecla: TipoTecla): string {
  if (tecla === 'backspace') {
    return valorActual.slice(0, -1);
  }

  if (tecla === ',') {
    // Si ya tiene una coma, ignorar
    if (valorActual.includes(',')) {
      return valorActual;
    }
    // Si está vacío, agregar "0,"
    if (valorActual === '') {
      return '0,';
    }
    return valorActual + ',';
  }

  // Si es un número
  // Evitar múltiples ceros al inicio (ej. "00" -> "0")
  if (valorActual === '0' && tecla === '0') {
    return valorActual;
  }

  // Si el valor actual es solo "0", reemplazarlo (ej. "0" + "5" -> "5")
  if (valorActual === '0') {
    return tecla;
  }

  // Validar límites de decimales (máximo 2 decimales para pesos argentinos)
  if (valorActual.includes(',')) {
    const [, decimales] = valorActual.split(',');
    if (decimales && decimales.length >= 2) {
      return valorActual; // No permitir más de dos decimales
    }
  }

  // Evitar números absurdamente grandes (ej. máximo 8 dígitos enteros)
  const parteEntera = valorActual.split(',')[0];
  if (!valorActual.includes(',') && parteEntera.length >= 8) {
    return valorActual;
  }

  return valorActual + tecla;
}

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
    paddingVertical: theme.spacing.xs,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  tecla: {
    flex: 1,
    height: 52, // Botones un poco más chicos (antes era 72)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: theme.spacing.xs,
  },
  teclaAccion: {
    backgroundColor: 'transparent',
  },
  teclaComaActiva: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.sm,
  },
  teclaTexto: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xl, // Reducir tamaño de fuente proporcionalmente
    color: theme.colors.text.primary,
  },
  teclaTextoEspecial: {
    fontFamily: theme.fonts.extraBold,
    color: theme.colors.text.secondary,
  },
  teclaTextoComaActiva: {
    color: theme.colors.text.light,
    fontFamily: theme.fonts.bold,
  },
});
