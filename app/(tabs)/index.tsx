import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCaja } from '@/context/CajaContext';
import { theme } from '@/theme';
import { Boton } from '@/components/Boton';
import { Tarjeta } from '@/components/Tarjeta';
import { TecladoNumerico, TipoTecla, procesarEntradaTeclado } from '@/components/TecladoNumerico';
import { ModalConfirmacion } from '@/components/ModalConfirmacion';
import { obtenerConfiguracion } from '@/db/repositorio';
import { MaterialIcons } from '@expo/vector-icons';

// Utilidad para formatear la fecha ISO 8601 en formato amigable
function formatearFechaApertura(isoString: string): string {
  try {
    const [fecha, hora] = isoString.split('T');
    const [, mm, dd] = fecha.split('-');
    const [hh, min] = hora.split(':');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mesInt = parseInt(mm) - 1;
    const nombreMes = meses[mesInt] || mm;
    return `${dd} ${nombreMes}, ${hh}:${min} hs`;
  } catch {
    return isoString;
  }
}

export default function Inicio() {
  const router = useRouter();
  const { cajaActiva, ventas, cargando, iniciarNuevaCaja, eliminarVentaActiva } = useCaja();
  
  // Estado para el fondo de apertura
  const [montoApertura, setMontoApertura] = useState<string>('');
  const [abriendoCaja, setAbriendoCaja] = useState<boolean>(false);

  // Estado para borrado seguro de ventas
  const [ventaABorrar, setVentaABorrar] = useState<number | null>(null);
  const [borrando, setBorrando] = useState<boolean>(false);

  // Cada vez que la caja pasa a estar cerrada (cajaActiva === null), recargamos el fondo por defecto
  useEffect(() => {
    if (!cajaActiva) {
      async function cargarDefault() {
        try {
          const val = await obtenerConfiguracion('fondo_inicial_default');
          if (val) {
            setMontoApertura(val.replace('.', ','));
          } else {
            setMontoApertura('10000'); // Valor por defecto
          }
        } catch (err) {
          console.error(err);
        }
      }
      cargarDefault();
    }
  }, [cajaActiva]);

  // Manejar teclado numérico para apertura
  const handleTeclaApertura = (tecla: TipoTecla) => {
    setMontoApertura((prev) => procesarEntradaTeclado(prev, tecla));
  };

  const handleLimpiarApertura = () => {
    setMontoApertura('');
  };

  // Enviar apertura de caja
  const handleAbrirCaja = async () => {
    const valorGuardar = montoApertura.replace(',', '.');
    const valorNumerico = parseFloat(valorGuardar);

    if (isNaN(valorNumerico) || valorNumerico < 0) {
      return;
    }

    setAbriendoCaja(true);
    try {
      await iniciarNuevaCaja(valorNumerico);
    } catch (err) {
      console.error('Error al abrir la caja:', err);
    } finally {
      setAbriendoCaja(false);
    }
  };

  const confirmarBorrado = async () => {
    if (ventaABorrar === null) return;
    setBorrando(true);
    try {
      await eliminarVentaActiva(ventaABorrar);
      setVentaABorrar(null);
    } catch (err) {
      console.error('Error al borrar la venta:', err);
    } finally {
      setBorrando(false);
    }
  };

  // Renderizador de estado de carga
  if (cargando) {
    return (
      <SafeAreaView style={styles.centrado}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  // --- VISTA 1: APERTURA DE CAJA ---
  if (!cajaActiva) {
    return (
      <SafeAreaView style={styles.contenedorPantalla}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Cabecera sin ajustes redundantes */}
        <View style={styles.header}>
          <Text style={styles.headerTitulo}>POS Kiosco</Text>
        </View>

        <ScrollView contentContainerStyle={styles.contenidoApertura} showsVerticalScrollIndicator={false}>
          <Tarjeta tinted={false} style={styles.seccionTarjeta}>
            <Text style={styles.tituloApertura}>Iniciar Jornada</Text>
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

          {/* Teclado en pantalla */}
          <TecladoNumerico
            onPresionarTecla={handleTeclaApertura}
            onLimpiarTodo={handleLimpiarApertura}
            style={styles.teclado}
          />

          <Boton
            titulo={`Iniciar Caja con $${parseFloat(montoApertura.replace(',', '.')) || 0}`}
            variant="secondary"
            alto="large"
            loading={abriendoCaja}
            onPress={handleAbrirCaja}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- VISTA 2: DASHBOARD (CAJA ABIERTA) ---
  const fondoInicial = cajaActiva.fondoInicial;
  
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

  const totalDigitalVentas = totalQrVentas + totalTransferenciaVentas + totalCreditoVentas;
  const efectivoEnCaja = fondoInicial + totalEfectivoVentas;
  const totalGeneralVentas = totalEfectivoVentas + totalDigitalVentas;

  return (
    <SafeAreaView style={styles.contenedorPantalla}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header Caja Abierta sin ajustes redundantes */}
      <View style={[styles.header, styles.headerBrandeado]}>
        <View>
          <Text style={styles.headerTituloBrandeado}>POS Kiosco</Text>
          <Text style={styles.headerSubtituloBrandeado}>
            Abierta: {formatearFechaApertura(cajaActiva.fechaApertura)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.contenidoDashboard} showsVerticalScrollIndicator={false}>
        
        {/* Panel de Contadores Rediseñado con Desglose */}
        <View style={styles.gridContadores}>
          
          <View style={styles.filaContadores}>
            <Tarjeta tinted={false} style={[styles.tarjetaContador, { marginRight: theme.spacing.sm }]}>
              <Text style={styles.contadorLabel}>Efectivo en Caja</Text>
              <Text style={[styles.contadorValor, { color: theme.colors.efectivo }]}>
                ${efectivoEnCaja.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.contadorInfo}>Fondo + Cobros</Text>
            </Tarjeta>

            <Tarjeta tinted={false} style={styles.tarjetaContador}>
              <Text style={styles.contadorLabel}>Total Facturado</Text>
              <Text style={[styles.contadorValor, { color: theme.colors.primary }]}>
                ${totalGeneralVentas.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
              <Text style={styles.contadorInfo}>Total de la jornada</Text>
            </Tarjeta>
          </View>

          <Text style={styles.tituloDesglose}>Cobros por Canal</Text>
          <View style={styles.filaDesgloseDigital}>
            <Tarjeta tinted style={[styles.tarjetaDesglose, { marginRight: 8 }]}>
              <View style={styles.contenedorTituloDesglose}>
                <MaterialIcons name="qr-code" size={12} color={theme.colors.text.secondary} style={{ marginRight: 4 }} />
                <Text style={styles.desgloseLabel}>QR</Text>
              </View>
              <Text style={[styles.desgloseValor, { color: theme.colors.digital }]}>
                ${totalQrVentas.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </Text>
            </Tarjeta>
            <Tarjeta tinted style={[styles.tarjetaDesglose, { marginRight: 8 }]}>
              <View style={styles.contenedorTituloDesglose}>
                <MaterialIcons name="account-balance" size={12} color={theme.colors.text.secondary} style={{ marginRight: 4 }} />
                <Text style={styles.desgloseLabel}>Transf.</Text>
              </View>
              <Text style={[styles.desgloseValor, { color: theme.colors.secondary }]}>
                ${totalTransferenciaVentas.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </Text>
            </Tarjeta>
            <Tarjeta tinted style={styles.tarjetaDesglose}>
              <View style={styles.contenedorTituloDesglose}>
                <MaterialIcons name="credit-card" size={12} color={theme.colors.text.secondary} style={{ marginRight: 4 }} />
                <Text style={styles.desgloseLabel}>Tarjetas</Text>
              </View>
              <Text style={[styles.desgloseValor, { color: '#8E24AA' }]}>
                ${totalCreditoVentas.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </Text>
            </Tarjeta>
          </View>

        </View>

        {/* Acciones Principales: Únicamente Arqueo/Cierre */}
        <View style={styles.seccionAcciones}>
          <Boton
            titulo="Arqueo / Cierre de Caja"
            variant="outline"
            alto="large"
            onPress={() => router.push('/cierre')}
          />
        </View>

        {/* Historial de Ventas */}
        <View style={styles.seccionHistorial}>
          <Text style={styles.tituloSeccion}>Ventas de la Jornada</Text>
          
          {ventas.length === 0 ? (
            <Tarjeta tinted style={styles.tarjetaHistorialVacio}>
              <Text style={styles.tituloHistorialVacio}>Sin ventas cargadas</Text>
              <Text style={styles.descripcionHistorialVacio}>
                Las ventas que registres durante esta jornada aparecerán listadas acá en tiempo real.
              </Text>
            </Tarjeta>
          ) : (
            ventas.slice().reverse().map((venta) => (
              <Tarjeta key={venta.id} tinted style={styles.tarjetaVentaItem}>
                <View style={styles.filaVentaItem}>
                  <View>
                    <Text style={styles.ventaItemHora}>
                      {venta.timestamp.split('T')[1]?.slice(0, 5) || '00:00'} hs
                    </Text>
                    <Text style={styles.ventaItemMetodo}>
                      {venta.pagos.map(p => p.metodo.toUpperCase()).join(' + ')}
                    </Text>
                  </View>
                  <Text style={styles.ventaItemMonto}>
                    ${venta.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </Text>
                  
                  {/* Botón Borrar */}
                  <TouchableOpacity
                    style={styles.botonBorrarVenta}
                    onPress={() => setVentaABorrar(venta.id)}
                  >
                    <Text style={styles.textoBotonBorrarVenta}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              </Tarjeta>
            ))
          )}
        </View>

      </ScrollView>

      {/* Modal de Confirmación para Borrado */}
      <ModalConfirmacion
        visible={ventaABorrar !== null}
        titulo="Eliminar Venta"
        mensaje="¿Estás seguro que querés borrar esta venta? Esto la eliminará definitivamente de la caja."
        textoConfirmar="Sí, Borrar"
        esPeligroso={true}
        onConfirmar={confirmarBorrado}
        onCancelar={() => setVentaABorrar(null)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitulo: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.lg,
    color: theme.colors.text.primary,
  },
  headerBrandeado: {
    backgroundColor: theme.colors.primary,
    height: 64,
    borderBottomWidth: 0,
  },
  headerTituloBrandeado: {
    fontFamily: theme.fonts.extraBold,
    fontSize: theme.sizes.lg,
    color: theme.colors.text.light,
  },
  headerSubtituloBrandeado: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.sizes.xs,
    color: theme.colors.secondary,
  },
  contenidoApertura: {
    padding: theme.spacing.md,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  tituloApertura: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
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
  seccionTarjeta: {
    paddingVertical: theme.spacing.md,
  },
  contenidoDashboard: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  gridContadores: {
    marginBottom: theme.spacing.md,
  },
  filaContadores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  tarjetaContador: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  contadorLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contadorValor: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.xl,
  },
  contadorInfo: {
    fontFamily: theme.fonts.regular,
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  tituloDesglose: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  filaDesgloseDigital: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tarjetaDesglose: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  contenedorTituloDesglose: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  desgloseLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 9,
    color: theme.colors.text.secondary,
  },
  desgloseValor: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.sm,
  },
  seccionAcciones: {
    marginBottom: theme.spacing.lg,
  },
  seccionHistorial: {
    marginTop: theme.spacing.xs,
  },
  tituloSeccion: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  tarjetaHistorialVacio: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  tituloHistorialVacio: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  descripcionHistorialVacio: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
  },
  tarjetaVentaItem: {
    marginBottom: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  filaVentaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ventaItemHora: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.md,
    color: theme.colors.text.primary,
  },
  ventaItemMetodo: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
  },
  ventaItemMonto: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.md,
    color: theme.colors.primary,
    flex: 1,
    textAlign: 'right',
    paddingRight: theme.spacing.sm,
  },
  botonBorrarVenta: {
    backgroundColor: theme.colors.danger,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
  },
  textoBotonBorrarVenta: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.light,
  },
});
