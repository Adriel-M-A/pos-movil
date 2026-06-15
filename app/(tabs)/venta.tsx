import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCaja } from '@/context/CajaContext';
import { theme } from '@/theme';
import { TipoTecla, procesarEntradaTeclado } from '@/components/TecladoNumerico';
import { TecladoAccion } from '@/components/TecladoAccion';
import { ChipMetodoPago } from '@/components/ChipMetodoPago';
import { MaterialIcons } from '@expo/vector-icons';

type MetodoPago = 'efectivo' | 'transferencia' | 'qr' | 'credito';

interface PagoLocal {
  metodo: MetodoPago;
  montoStr: string;
}

export default function Venta() {
  const { cajaActiva, guardarNuevaVenta } = useCaja();

  // Mantenemos el estado de entrada como string por separado para cada método de pago
  const [pagos, setPagos] = useState<PagoLocal[]>([
    { metodo: 'efectivo', montoStr: '' },
    { metodo: 'transferencia', montoStr: '' },
    { metodo: 'qr', montoStr: '' },
    { metodo: 'credito', montoStr: '' },
  ]);

  // Qué método estamos editando con el teclado numérico
  const [metodoActivo, setMetodoActivo] = useState<MetodoPago>('efectivo');
  const [guardando, setGuardando] = useState(false);

  // Derivamos el total al vuelo
  const totalCalculado = useMemo(() => {
    return pagos.reduce((sum, p) => sum + (parseFloat(p.montoStr.replace(',', '.')) || 0), 0);
  }, [pagos]);

  // Derivar si la coma está activa para el método seleccionado
  const comaActiva = useMemo(() => {
    const pagoActivo = pagos.find((p) => p.metodo === metodoActivo);
    return pagoActivo ? pagoActivo.montoStr.includes(',') : false;
  }, [pagos, metodoActivo]);

  // Procesar toques del teclado
  const handleTecla = useCallback((tecla: TipoTecla) => {
    setPagos((prev) =>
      prev.map((p) => {
        if (p.metodo === metodoActivo) {
          return { ...p, montoStr: procesarEntradaTeclado(p.montoStr, tecla) };
        }
        return p;
      })
    );
  }, [metodoActivo]);

  const handleLimpiarTodo = useCallback(() => {
    setPagos((prev) =>
      prev.map((p) => ({ ...p, montoStr: '' }))
    );
  }, []);

  // Acción principal: cobrar
  const handleCobrar = useCallback(async () => {
    if (totalCalculado <= 0) return;
    setGuardando(true);
    try {
      // Formatear array final solo con los métodos que tengan un monto ingresado > 0
      const pagosValidos = pagos
        .map((p) => ({
          metodo: p.metodo,
          monto: parseFloat(p.montoStr.replace(',', '.')) || 0,
        }))
        .filter((p) => p.monto > 0);
      
      await guardarNuevaVenta(totalCalculado, pagosValidos);
      
      // Limpiar los montos de la UI
      handleLimpiarTodo();
      setMetodoActivo('efectivo');

      // Feedback amigable
      Alert.alert(
        'Cobro Exitoso ✓', 
        `Se registró la venta de $${totalCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}.`
      );
    } catch (err) {
      console.error('Error al registrar la venta:', err);
      Alert.alert('Error', 'No se pudo registrar la venta en la base de datos.');
    } finally {
      setGuardando(false);
    }
  }, [totalCalculado, pagos, guardarNuevaVenta, handleLimpiarTodo]);

  // --- CONTROL DE SEGURIDAD: CAJA CERRADA ---
  if (!cajaActiva) {
    return (
      <SafeAreaView style={styles.contenedorCentrado}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <MaterialIcons name="lock" size={50} color={theme.colors.text.secondary} style={styles.iconoBloqueado} />
        <Text style={styles.tituloBloqueado}>Caja Cerrada</Text>
        <Text style={styles.mensajeBloqueado}>
          Para comenzar a registrar cobros, tenés que iniciar la jornada abriendo la caja en la pestaña **Caja**.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      {/* Cabecera compacta con Total Acumulado (Sin cuerpo de tarjeta) */}
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>Registrar Cobro</Text>

        <View style={styles.contenedorTotal}>
          <Text style={styles.etiquetaTotal}>TOTAL A COBRAR</Text>
          <Text style={styles.montoTotal}>
            ${totalCalculado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        
        {/* Selector de Métodos de Pago */}
        <View style={styles.seccionPagos}>
          <View style={styles.filaTituloPagos}>
            <Text style={styles.etiquetaSeccion}>Métodos de Pago</Text>
          </View>
          <View style={styles.contenedorChips}>
            {pagos.map((p) => {
              const montoNum = parseFloat(p.montoStr.replace(',', '.')) || 0;
              return (
                <ChipMetodoPago
                  key={p.metodo}
                  metodo={p.metodo}
                  monto={montoNum > 0 ? montoNum : undefined}
                  seleccionado={metodoActivo === p.metodo}
                  onPress={() => setMetodoActivo(p.metodo)}
                  style={styles.chip}
                />
              );
            })}
          </View>
        </View>

      </ScrollView>

      {/* Footer Fijo con Teclado y Botón Cobrar */}
      <View style={styles.footer}>
        <TecladoAccion
          onPresionarTecla={handleTecla}
          onLimpiarTodo={handleLimpiarTodo}
          comaActiva={comaActiva}
          tituloBoton={guardando ? 'Guardando...' : 'Confirmar Venta'}
          variantBoton="primary"
          loadingBoton={guardando}
          disabledBoton={totalCalculado <= 0}
          onPressBoton={handleCobrar}
          styleTeclado={styles.teclado}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  iconoBloqueado: {
    marginBottom: theme.spacing.md,
  },
  tituloBloqueado: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  mensajeBloqueado: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tituloHeader: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.lg,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  contenedorTotal: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  etiquetaTotal: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  montoTotal: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.giant,
    color: theme.colors.primary,
  },
  contenido: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  seccionPagos: {
    marginBottom: theme.spacing.md,
  },
  filaTituloPagos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },

  etiquetaSeccion: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contenedorChips: {
    flexDirection: 'column',
  },
  chip: {
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  teclado: {
    marginBottom: theme.spacing.md,
  },
});
