import { memo } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { TecladoNumerico, TipoTecla } from './TecladoNumerico';
import { Boton } from './Boton';
import { theme } from '@/theme';

interface TecladoAccionProps {
  /** Callback cuando se presiona una tecla */
  onPresionarTecla: (tecla: TipoTecla) => void;
  /** Callback opcional cuando se mantiene presionado el botón borrar (para borrar todo) */
  onLimpiarTodo?: () => void;
  /** Indica si la coma decimal está marcada en la entrada */
  comaActiva?: boolean;
  /** Título del botón de acción */
  tituloBoton: string;
  /** Callback al presionar el botón de acción */
  onPressBoton: () => void;
  /** Indica si el botón de acción está cargando */
  loadingBoton?: boolean;
  /** Indica si el botón de acción está deshabilitado */
  disabledBoton?: boolean;
  /** Variante de estilo del botón */
  variantBoton?: 'primary' | 'secondary' | 'success' | 'info' | 'danger' | 'outline' | 'ghost';
  /** Estilos opcionales para el contenedor externo */
  style?: StyleProp<ViewStyle>;
  /** Estilos opcionales para el teclado numérico */
  styleTeclado?: StyleProp<ViewStyle>;
}

export const TecladoAccion = memo(function TecladoAccion({
  onPresionarTecla,
  onLimpiarTodo,
  comaActiva = false,
  tituloBoton,
  onPressBoton,
  loadingBoton = false,
  disabledBoton = false,
  variantBoton = 'primary',
  style,
  styleTeclado,
}: TecladoAccionProps) {
  return (
    <View style={[styles.contenedor, style]}>
      <TecladoNumerico
        onPresionarTecla={onPresionarTecla}
        onLimpiarTodo={onLimpiarTodo}
        comaActiva={comaActiva}
        style={[styles.teclado, styleTeclado]}
      />
      <Boton
        titulo={tituloBoton}
        variant={variantBoton}
        alto="large"
        loading={loadingBoton}
        disabled={disabledBoton}
        onPress={onPressBoton}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
  },
  teclado: {
    marginBottom: theme.spacing.md,
  },
});
