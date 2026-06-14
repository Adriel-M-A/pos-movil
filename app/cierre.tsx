import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useCaja } from '@/context/CajaContext';
import { theme } from '@/theme';
import { Boton } from '@/components/Boton';
import { Tarjeta } from '@/components/Tarjeta';
import { TecladoNumerico, TipoTecla, procesarEntradaTeclado } from '@/components/TecladoNumerico';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';

export default function CierreCaja() {
  const router = useRouter();
  const { cajaActiva, ventas, cerrarCajaActiva } = useCaja();
  
  // Estado para el dinero contado físicamente
  const [montoContado, setMontoContado] = useState<string>('');
  const [modalConfirmarVisible, setModalConfirmarVisible] = useState<boolean>(false);
  const [cerrando, setCerrando] = useState<boolean>(false);

  // Redirigir de seguridad si no hay caja abierta
  if (!cajaActiva) {
    router.replace('/');
    return null;
  }

  // Desglose de cálculos financieros
  const fondoInicial = cajaActiva.fondoInicial;
  
  // Calcular cobros por método
  let totalEfectivoVentas = 0;
  let totalQrVentas = 0;
  let totalTransferenciaVentas = 0;
  let totalCreditoVentas = 0;

  ventas.forEach((venta) => {
    venta.pagos.forEach((pago) => {
      switch (pago.metodo) {
        case 'efectivo':
          totalEfectivoVentas += pago.monto;
          break;
        case 'qr':
          totalQrVentas += pago.monto;
          break;
        case 'transferencia':
          totalTransferenciaVentas += pago.monto;
          break;
        case 'credito':
          totalCreditoVentas += pago.monto;
          break;
      }
    });
  });

  const efectivoEsperado = fondoInicial + totalEfectivoVentas;
  const totalDigital = totalQrVentas + totalTransferenciaVentas + totalCreditoVentas;
  const totalGeneralVentas = totalEfectivoVentas + totalDigital;

  // Procesar entrada de teclado
  const handleTecla = (tecla: TipoTecla) => {
    setMontoContado((prev) => procesarEntradaTeclado(prev, tecla));
  };

  const handleLimpiar = () => {
    setMontoContado('');
  };

  // Calcular diferencia
  const contadoFisico = parseFloat(montoContado.replace(',', '.')) || 0;
  const diferencia = contadoFisico - efectivoEsperado;

  // Definir estilo y texto de diferencia
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

  const handleConfirmarCierre = async () => {
    setModalConfirmarVisible(false);
    setCerrando(true);
    try {
      await cerrarCajaActiva(contadoFisico);
      router.replace('/');
    } catch (error) {
      console.error('Error al cerrar la caja:', error);
      setCerrando(false);
    }
  };

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>Arqueo y Cierre de Caja</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContenido} showsVerticalScrollIndicator={false}>
        
        {/* Desglose de Totales del Sistema */}
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
              ${totalEfectivoVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.filaFinanciera, styles.filaDestacada]}>
            <Text style={styles.labelDestacado}>Efectivo Esperado en Caja:</Text>
            <Text style={styles.valorDestacado}>
              ${efectivoEsperado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.lineaDivisora} />

          {/* Información Digital Adicional */}
          <Text style={styles.subtituloSeccion}>Dinero Digital (Fuera de Caja Física)</Text>
          
          <View style={styles.filaFinanciera}>
            <Text style={styles.labelFinancieroSub}>Pago QR (MercadoPago / Modo):</Text>
            <Text style={styles.valorFinancieroSub}>
              ${totalQrVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.filaFinanciera}>
            <Text style={styles.labelFinancieroSub}>Transferencias Bancarias:</Text>
            <Text style={styles.valorFinancieroSub}>
              ${totalTransferenciaVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.filaFinanciera}>
            <Text style={styles.labelFinancieroSub}>Tarjeta de Crédito / Débito:</Text>
            <Text style={styles.valorFinancieroSub}>
              ${totalCreditoVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={[styles.filaFinanciera, { marginTop: theme.spacing.xs }]}>
            <Text style={styles.labelFinanciero}>Total Ventas (Todos los Medios):</Text>
            <Text style={styles.valorFinanciero}>
              ${totalGeneralVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </Tarjeta>

        {/* Ingreso de Arqueo Físico */}
        <Tarjeta tinted={false} style={styles.seccionTarjeta}>
          <Text style={styles.tituloSeccion}>Efectivo Contado Físicamente</Text>
          
          <View style={styles.contenedorInputMonto}>
            <Text style={styles.simboloMoneda}>$</Text>
            <Text style={styles.montoTexto} numberOfLines={1}>
              {montoContado || '0'}
            </Text>
          </View>

          {/* Diferencia Dinámica */}
          <View style={[styles.contenedorDiferencia, { borderColor: estadoDiferencia.color }]}>
            <Text style={[styles.textoDiferencia, { color: estadoDiferencia.color }]}>
              {estadoDiferencia.texto}
            </Text>
            <Text style={styles.descripcionDiferencia}>
              {estadoDiferencia.descripcion}
            </Text>
          </View>
        </Tarjeta>

        {/* Teclado en pantalla */}
        <TecladoNumerico
          onPresionarTecla={handleTecla}
          onLimpiarTodo={handleLimpiar}
          style={styles.teclado}
        />

        {/* Botonera de Cierre */}
        <View style={styles.contenedorAcciones}>
          <Boton
            titulo="Volver al Dashboard"
            variant="outline"
            alto="large"
            onPress={() => router.back()}
            style={styles.botonEspaciado}
          />
          <Boton
            titulo="Confirmar y Cerrar Caja"
            variant="danger"
            alto="large"
            loading={cerrando}
            onPress={() => setModalConfirmarVisible(true)}
          />
        </View>

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
  contenedor: {
    flex: 1,
    backgroundColor: '#ECEFF1',
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
  },
  tituloSeccion: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
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
    borderRadius: theme.borderRadius.sm,
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
  contenedorInputMonto: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
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
  teclado: {
    marginBottom: theme.spacing.md,
  },
  contenedorAcciones: {
    marginTop: theme.spacing.sm,
  },
  botonEspaciado: {
    marginBottom: theme.spacing.md,
  },
});
