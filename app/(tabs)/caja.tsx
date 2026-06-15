import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCaja } from '@/context/CajaContext';
import { theme } from '@/theme';
import { Boton } from '@/components/Boton';
import { Tarjeta } from '@/components/Tarjeta';
import { TipoTecla, procesarEntradaTeclado } from '@/components/TecladoNumerico';
import { TecladoAccion } from '@/components/TecladoAccion';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { obtenerConfiguracion, guardarConfiguracion } from '@/db/repositorio';
import { MaterialIcons } from '@expo/vector-icons';

export default function CajaJornada() {
  const {
    cajaActiva,
    ventas,
    cargando,
    iniciarNuevaCaja,
    cerrarCajaActiva,
    totalesPorMetodo,
    totalVendido,
    efectivoEnCaja,
  } = useCaja();
  const router = useRouter();

  // --- Estados de Apertura ---
  const [montoApertura, setMontoApertura] = useState<string>('');
  const [abriendoCaja, setAbriendoCaja] = useState<boolean>(false);
  const [guardarDefecto, setGuardarDefecto] = useState<boolean>(false);

  // --- Estados de Cierre ---
  const [montoContado, setMontoContado] = useState<string>('');
  const [modalConfirmarVisible, setModalConfirmarVisible] = useState<boolean>(false);
  const [cerrando, setCerrando] = useState<boolean>(false);

  // Cargar el fondo inicial por defecto al montar o al cerrar la caja
  useEffect(() => {
    if (!cajaActiva) {
      async function cargarDefault() {
        try {
          const checkVal = await obtenerConfiguracion('guardar_fondo_defecto_check');
          const esChequeado = checkVal === 'true';
          setGuardarDefecto(esChequeado);

          if (esChequeado) {
            const val = await obtenerConfiguracion('fondo_inicial_default');
            if (val) {
              setMontoApertura(val.replace('.', ','));
            } else {
              setMontoApertura('10000'); // Valor fallback inicial
            }
          } else {
            setMontoApertura('0'); // Comienza en 0 si está desactivado
          }
        } catch (err) {
          console.error(err);
        }
      }
      cargarDefault();
    } else {
      // Limpiar estados de cierre al detectar caja activa
      setMontoContado('');
      setModalConfirmarVisible(false);
      setCerrando(false);
    }
  }, [cajaActiva]);

  // --- Teclado para Apertura ---
  const handleTeclaApertura = (tecla: TipoTecla) => {
    setMontoApertura((prev) => procesarEntradaTeclado(prev, tecla));
  };

  const handleLimpiarApertura = () => {
    setMontoApertura('');
  };

  const handleAbrirCaja = async () => {
    const valorGuardar = montoApertura.replace(',', '.');
    const valorNumerico = parseFloat(valorGuardar);

    if (isNaN(valorNumerico) || valorNumerico < 0) {
      return;
    }

    setAbriendoCaja(true);
    try {
      if (guardarDefecto) {
        await guardarConfiguracion('guardar_fondo_defecto_check', 'true');
        await guardarConfiguracion('fondo_inicial_default', valorGuardar);
      } else {
        await guardarConfiguracion('guardar_fondo_defecto_check', 'false');
        await guardarConfiguracion('fondo_inicial_default', '0');
      }
      await iniciarNuevaCaja(valorNumerico);
      router.push('/venta');
    } catch (err) {
      console.error('Error al abrir la caja:', err);
    } finally {
      setAbriendoCaja(false);
    }
  };

  // --- Teclado para Cierre ---
  const handleTeclaCierre = (tecla: TipoTecla) => {
    setMontoContado((prev) => procesarEntradaTeclado(prev, tecla));
  };

  const handleLimpiarCierre = () => {
    setMontoContado('');
  };

  // --- Lógica del Cierre ---
  const handleConfirmarCierre = async () => {
    if (!cajaActiva) return;
    setModalConfirmarVisible(false);
    setCerrando(true);
    try {
      const contadoFisico = parseFloat(montoContado.replace(',', '.')) || 0;
      await cerrarCajaActiva(contadoFisico);
    } catch (error) {
      console.error('Error al cerrar la caja:', error);
    } finally {
      setCerrando(false);
    }
  };

  if (cargando) {
    return (
      <SafeAreaView style={styles.centrado}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  // --- VISTA 1: FORMULARIO DE APERTURA ---
  if (!cajaActiva) {
    return (
      <SafeAreaView style={styles.contenedorPantalla}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        <View style={styles.header}>
          <Text style={styles.tituloHeader}>Apertura de Caja</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContenido} showsVerticalScrollIndicator={false}>
          <Tarjeta tinted={false} style={styles.seccionTarjeta}>
            <Text style={styles.tituloSeccionCentrado}>Iniciar Jornada</Text>
            <Text style={styles.etiquetaCampo}>Monto inicial en caja</Text>
            
            <View style={styles.contenedorMontoInput}>
              <Text style={styles.simboloMoneda}>$</Text>
              <Text style={styles.montoTexto} numberOfLines={1}>
                {montoApertura || '0'}
              </Text>
            </View>

            <Text style={styles.ayudaTexto}>
              Ingresá el efectivo físico disponible en la caja registradora para el vuelto.
            </Text>
          </Tarjeta>

          <TouchableOpacity
            style={styles.contenedorCheckbox}
            onPress={() => setGuardarDefecto(!guardarDefecto)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={guardarDefecto ? "check-box" : "check-box-outline-blank"}
              size={22}
              color={guardarDefecto ? theme.colors.primary : theme.colors.text.secondary}
            />
            <Text style={styles.textoCheckbox}>Guardar como fondo por defecto</Text>
          </TouchableOpacity>

          <TecladoAccion
            onPresionarTecla={handleTeclaApertura}
            onLimpiarTodo={handleLimpiarApertura}
            comaActiva={montoApertura.includes(',')}
            tituloBoton="Iniciar Caja"
            variantBoton="primary"
            loadingBoton={abriendoCaja}
            onPressBoton={handleAbrirCaja}
            style={styles.teclado}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- VISTA 2: FORMULARIO DE CIERRE ---
  const fondoInicial = cajaActiva.fondoInicial;
  const contadoFisico = parseFloat(montoContado.replace(',', '.')) || 0;
  const diferencia = contadoFisico - efectivoEnCaja;

  const obtenerEstadoDiferencia = () => {
    const absDiferencia = Math.abs(diferencia);
    const formatoMoneda = `$${absDiferencia.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    if (absDiferencia < 0.01) {
      return {
        texto: 'Caja Cuadrada ✓',
        color: theme.colors.efectivo,
        descripcion: 'El dinero contado coincide con el esperado en el sistema.',
      };
    } else if (diferencia > 0) {
      return {
        texto: `Sobrante de ${formatoMoneda}`,
        color: theme.colors.digital,
        descripcion: 'Hay más dinero físico en caja del que se registró en ventas.',
      };
    } else {
      return {
        texto: `Faltante de ${formatoMoneda}`,
        color: theme.colors.danger,
        descripcion: 'Hay menos dinero físico en caja del esperado.',
      };
    }
  };

  const estadoDiferencia = obtenerEstadoDiferencia();

  return (
    <SafeAreaView style={styles.contenedorPantalla}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>Arqueo y Cierre de Caja</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContenido} showsVerticalScrollIndicator={false}>
        
        {/* Desglose del Sistema */}
        <Tarjeta tinted style={styles.seccionTarjeta}>
          <Text style={styles.tituloSeccion}>Desglose del Kiosco</Text>
          
          <View style={styles.filaFinanciera}>
            <Text style={styles.labelFinanciero}>Fondo de Apertura:</Text>
            <Text style={styles.valorFinanciero}>
              ${fondoInicial.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View style={styles.filaFinanciera}>
            <Text style={styles.labelFinanciero}>Ventas Efectivo (+):</Text>
            <Text style={styles.valorFinanciero}>
              ${totalesPorMetodo.efectivo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.filaFinanciera, styles.filaDestacada]}>
            <Text style={styles.labelDestacado}>Efectivo en Caja:</Text>
            <Text style={styles.valorDestacado}>
              ${efectivoEnCaja.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.lineaDivisora} />

          <Text style={styles.subtituloSeccion}>Dinero Digital (Fuera de Caja Física)</Text>
          
          <View style={styles.filaFinanciera}>
            <Text style={styles.labelFinancieroSub}>Pago QR:</Text>
            <Text style={styles.valorFinancieroSub}>
              ${totalesPorMetodo.qr.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.filaFinanciera}>
            <Text style={styles.labelFinancieroSub}>Transferencias:</Text>
            <Text style={styles.valorFinancieroSub}>
              ${totalesPorMetodo.transferencia.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.filaFinanciera}>
            <Text style={styles.labelFinancieroSub}>Crédito:</Text>
            <Text style={styles.valorFinancieroSub}>
              ${totalesPorMetodo.credito.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.filaFinanciera, styles.filaDestacada]}>
            <Text style={styles.labelDestacado}>Total Ventas:</Text>
            <Text style={styles.valorDestacado}>
              ${totalVendido.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </Tarjeta>

        {/* Ingreso de Arqueo Físico */}
        <Tarjeta tinted={false} style={styles.seccionTarjeta}>
          <Text style={styles.tituloSeccion}>Efectivo Contado Físicamente</Text>
          
          <View style={styles.contenedorMontoInput}>
            <Text style={styles.simboloMoneda}>$</Text>
            <Text style={styles.montoTexto} numberOfLines={1}>
              {montoContado || '0'}
            </Text>
          </View>

          <View style={[styles.contenedorDiferencia, { borderColor: estadoDiferencia.color }]}>
            <Text style={[styles.textoDiferencia, { color: estadoDiferencia.color }]}>
              {estadoDiferencia.texto}
            </Text>
            <Text style={styles.descripcionDiferencia}>
              {estadoDiferencia.descripcion}
            </Text>
          </View>
        </Tarjeta>

        <TecladoAccion
          onPresionarTecla={handleTeclaCierre}
          onLimpiarTodo={handleLimpiarCierre}
          comaActiva={montoContado.includes(',')}
          tituloBoton="Confirmar y Cerrar Caja"
          variantBoton="primary"
          loadingBoton={cerrando}
          onPressBoton={() => setModalConfirmarVisible(true)}
          style={styles.teclado}
        />

      </ScrollView>

      {/* Modal de Confirmación */}
      <ModalConfirmacion
        visible={modalConfirmarVisible}
        titulo="¿Cerrar caja definitivamente?"
        mensaje={`Al cerrar la caja se registrará un monto de efectivo de $${contadoFisico.toLocaleString('es-AR', { minimumFractionDigits: 2 })}.\n\nEsta acción dará por terminada la sesión actual y no se podrán agregar más ventas ni modificar datos.`}
        textoConfirmar="Cerrar Caja"
        textoCancelar="Cancelar"
        esPeligroso
        onConfirmar={handleConfirmarCierre}
        onCancelar={() => setModalConfirmarVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedorPantalla: {
    flex: 1,
    backgroundColor: '#ECEFF1',
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tituloHeader: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.lg,
    color: theme.colors.text.primary,
  },
  scrollContenido: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  seccionTarjeta: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  tituloSeccion: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  tituloSeccionCentrado: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtituloSeccion: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  lineaDivisora: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  filaFinanciera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  labelFinanciero: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.sizes.md,
    color: theme.colors.text.secondary,
  },
  valorFinanciero: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.md,
    color: theme.colors.text.primary,
  },
  labelFinancieroSub: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
  },
  valorFinancieroSub: {
    fontFamily: theme.fonts.monoRegular,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.primary,
  },
  filaDestacada: {
    backgroundColor: '#ECEFF1',
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    borderRadius: 0,
  },
  labelDestacado: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.md,
    color: theme.colors.primary,
  },
  valorDestacado: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.lg,
    color: theme.colors.primary,
  },
  etiquetaCampo: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  contenedorMontoInput: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  simboloMoneda: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xxl,
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  montoTexto: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.huge,
    color: theme.colors.primary,
  },
  ayudaTexto: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  teclado: {
    marginVertical: theme.spacing.md,
  },
  contenedorDiferencia: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  textoDiferencia: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.lg,
    marginBottom: 4,
  },
  descripcionDiferencia: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  contenedorCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  textoCheckbox: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
  },
});
