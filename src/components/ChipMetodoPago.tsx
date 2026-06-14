import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  View,
} from 'react-native';
import { theme } from '@/theme';
import { MetodoPago } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

interface ChipMetodoPagoProps {
  /** Método de pago que representa el chip */
  metodo: MetodoPago;
  /** Indica si está seleccionado */
  seleccionado: boolean;
  /** Función ejecutada al presionar el chip */
  onPress: () => void;
  /** Monto asignado opcional (para pagos mixtos) */
  monto?: number;
  /** Estilos opcionales para el contenedor */
  style?: StyleProp<ViewStyle>;
}

export function ChipMetodoPago({
  metodo,
  seleccionado,
  onPress,
  monto,
  style,
}: ChipMetodoPagoProps) {
  // Mapeo de nombres legibles para la UI
  const nombresMetodos: Record<MetodoPago, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    qr: 'Pago QR',
    credito: 'Tarjeta Crédito',
  };

  // Obtener color característico según el método de pago
  const getColorMetodo = (): string => {
    switch (metodo) {
      case 'efectivo':
        return theme.colors.efectivo;
      case 'transferencia':
      case 'qr':
        return theme.colors.digital;
      case 'credito':
        return '#673AB7'; // Color violeta sutil para tarjetas de crédito
    }
  };

  const colorMetodo = getColorMetodo();

  const chipStyles: ViewStyle[] = [
    styles.base,
    seleccionado
      ? { backgroundColor: colorMetodo, borderColor: colorMetodo }
      : { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  ];

  const textoEstilo = seleccionado
    ? [styles.texto, { color: theme.colors.text.light, fontFamily: theme.fonts.bold }]
    : [styles.texto, { color: theme.colors.text.secondary, fontFamily: theme.fonts.medium }];

  const montoEstilo = seleccionado
    ? [styles.montoTexto, { color: theme.colors.text.light, fontFamily: theme.fonts.monoBold }]
    : [styles.montoTexto, { color: colorMetodo, fontFamily: theme.fonts.monoRegular }];

  // Obtener el icono correspondiente
  const obtenerIconoMetodo = () => {
    switch (metodo) {
      case 'efectivo':
        return 'payments';
      case 'transferencia':
        return 'account-balance';
      case 'qr':
        return 'qr-code';
      case 'credito':
        return 'credit-card';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[chipStyles, style]}
    >
      <View style={styles.contenedorTextoIcono}>
        <MaterialIcons
          name={obtenerIconoMetodo()}
          size={16}
          color={seleccionado ? theme.colors.text.light : theme.colors.text.secondary}
          style={{ marginRight: 6 }}
        />
        <Text style={textoEstilo}>{nombresMetodos[metodo]}</Text>
      </View>
      {monto !== undefined && monto > 0 && (
        <Text style={montoEstilo}>
          ${monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    height: theme.touchTargets.min, // Garantiza tamaño mínimo de toque 48px
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    marginVertical: theme.spacing.xs,
    width: '100%',
  },
  contenedorTextoIcono: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  texto: {
    fontSize: theme.sizes.md,
  },
  montoTexto: {
    fontSize: theme.sizes.sm,
    marginLeft: theme.spacing.sm,
  },
});
