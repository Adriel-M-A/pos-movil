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
  if (!isoString) return '';
  try {
    const normalizado = isoString.replace(' ', 'T');
    const [fechaPart, horaPart] = normalizado.split('T');
    
    const separador = fechaPart.includes('-') ? '-' : '/';
    const partesFecha = fechaPart.split(separador);
    
    let yyyy = partesFecha[0];
    let mm = partesFecha[1];
    let dd = partesFecha[2];
    
    if (yyyy.length === 2 && dd.length === 4) {
      const temp = yyyy;
      yyyy = dd;
      dd = temp;
    }
    
    const partesHora = horaPart.split(':');
    const hh = partesHora[0];
    const min = partesHora[1];
    
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const mesInt = parseInt(mm, 10) - 1;
    const nombreMes = meses[mesInt] || mm;
    
    return `${parseInt(dd, 10)} de ${nombreMes}, ${hh}:${min} hs`;
  } catch (err) {
    console.error('Error al formatear fecha de apertura:', err);
    return isoString;
  }
}

const nombresMetodosCorta: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transf.',
  qr: 'QR',
  credito: 'Tarjeta',
};

const obtenerIconoMetodoVenta = (metodo: string) => {
  switch (metodo) {
    case 'efectivo': return 'payments';
    case 'transferencia': return 'account-balance';
    case 'qr': return 'qr-code';
    case 'credito': return 'credit-card';
    default: return 'payment';
  }
};

const obtenerColorMetodoVenta = (metodo: string) => {
  switch (metodo) {
    case 'efectivo': return theme.colors.efectivo;
    case 'transferencia': return theme.colors.secondary;
    case 'qr': return theme.colors.digital;
    case 'credito': return '#673AB7';
    default: return theme.colors.text.secondary;
  }
};

export default function Inicio() {
  const router = useRouter();
  const { cajaActiva, ventas, cargando, eliminarVentaActiva } = useCaja();
  
  // Estado para borrado seguro de ventas
  const [ventaABorrar, setVentaABorrar] = useState<number | null>(null);
  const [borrando, setBorrando] = useState<boolean>(false);

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

  // --- VISTA 1: CAJA CERRADA ---
  if (!cajaActiva) {
    return (
      <SafeAreaView style={styles.contenedorCentrado}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <MaterialIcons name="lock" size={60} color={theme.colors.text.secondary} style={styles.iconoBloqueado} />
        <Text style={styles.tituloBloqueado}>Caja Cerrada</Text>
        <Text style={styles.mensajeBloqueado}>
          Para comenzar a registrar cobros y visualizar el dashboard de la jornada, debés abrir la caja.
        </Text>
        <Boton
          titulo="Ir a Abrir Caja"
          variant="primary"
          alto="large"
          onPress={() => router.push('/caja')}
          style={styles.botonRedireccion}
        />
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
        <Text style={styles.headerTituloBrandeado}>POS Kiosco</Text>
        <Text style={styles.headerSubtituloBrandeado}>
          Abierta: {formatearFechaApertura(cajaActiva.fechaApertura)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenidoDashboard} showsVerticalScrollIndicator={false}>
        
        {/* Panel de Contadores Rediseñado con Desglose */}
        <View style={styles.gridContadores}>
          
          <View style={styles.filaContadores}>
            <Tarjeta tinted={false} style={[styles.tarjetaContador, { marginRight: theme.spacing.sm }]}>
              <Text style={styles.contadorLabel}>Efectivo en Caja</Text>
              <Text style={styles.contadorValor}>
                ${efectivoEnCaja.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
            </Tarjeta>

            <Tarjeta tinted={false} style={styles.tarjetaContador}>
              <Text style={styles.contadorLabel}>Total Facturado</Text>
              <Text style={styles.contadorValor}>
                ${totalGeneralVentas.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
            </Tarjeta>
          </View>

          <Text style={styles.tituloDesglose}>Cobros por método de pago</Text>
          <View style={styles.contenedorGrillaMetodos}>
            <View style={styles.filaGrillaMetodos}>
              {/* Efectivo */}
              <Tarjeta tinted style={[styles.tarjetaDesglose, { marginRight: theme.spacing.sm }]}>
                <View style={styles.contenedorTituloDesglose}>
                  <MaterialIcons name="payments" size={14} color={theme.colors.efectivo} style={{ marginRight: 4 }} />
                  <Text style={styles.desgloseLabel}>Efectivo</Text>
                </View>
                <Text style={styles.desgloseValor}>
                  ${totalEfectivoVentas.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </Text>
              </Tarjeta>

              {/* Transferencia */}
              <Tarjeta tinted style={styles.tarjetaDesglose}>
                <View style={styles.contenedorTituloDesglose}>
                  <MaterialIcons name="account-balance" size={14} color={theme.colors.digital} style={{ marginRight: 4 }} />
                  <Text style={styles.desgloseLabel}>Transf.</Text>
                </View>
                <Text style={styles.desgloseValor}>
                  ${totalTransferenciaVentas.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </Text>
              </Tarjeta>
            </View>

            <View style={[styles.filaGrillaMetodos, { marginTop: theme.spacing.sm }]}>
              {/* QR */}
              <Tarjeta tinted style={[styles.tarjetaDesglose, { marginRight: theme.spacing.sm }]}>
                <View style={styles.contenedorTituloDesglose}>
                  <MaterialIcons name="qr-code" size={14} color={theme.colors.digital} style={{ marginRight: 4 }} />
                  <Text style={styles.desgloseLabel}>QR</Text>
                </View>
                <Text style={styles.desgloseValor}>
                  ${totalQrVentas.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </Text>
              </Tarjeta>

              {/* Crédito */}
              <Tarjeta tinted style={styles.tarjetaDesglose}>
                <View style={styles.contenedorTituloDesglose}>
                  <MaterialIcons name="credit-card" size={14} color="#673AB7" style={{ marginRight: 4 }} />
                  <Text style={styles.desgloseLabel}>Tarjetas</Text>
                </View>
                <Text style={styles.desgloseValor}>
                  ${totalCreditoVentas.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </Text>
              </Tarjeta>
            </View>
          </View>

        </View>



        {/* Historial de Ventas */}
        <View style={styles.seccionHistorial}>
          <View style={styles.contenedorTituloSeccionConBadge}>
            <Text style={styles.tituloSeccion}>Ventas de la Jornada</Text>
            <View style={styles.badgeVentas}>
              <Text style={styles.badgeVentasTexto}>
                {ventas.length} {ventas.length === 1 ? 'Operación' : 'Operaciones'}
              </Text>
            </View>
          </View>
          
          {ventas.length === 0 ? (
            <Tarjeta tinted style={styles.tarjetaHistorialVacio}>
              <Text style={styles.tituloHistorialVacio}>Sin ventas cargadas</Text>
              <Text style={styles.descripcionHistorialVacio}>
                Las ventas que registres durante esta jornada aparecerán listadas acá en tiempo real.
              </Text>
            </Tarjeta>
          ) : (
            ventas.slice().reverse().map((venta) => {
              const primerPago = venta.pagos[0];
              const metodoPrimerPago = primerPago ? primerPago.metodo : 'efectivo';
              const metodosLista = venta.pagos.map(p => nombresMetodosCorta[p.metodo] || p.metodo).join(' / ');
              
              return (
                <Tarjeta key={venta.id} tinted style={styles.tarjetaVentaItem}>
                  <View style={styles.filaVentaItem}>
                    {/* Columna 1: Hora */}
                    <View style={styles.colVentaHora}>
                      <Text style={styles.ventaItemHora}>
                        {venta.timestamp.split('T')[1]?.slice(0, 5) || '00:00'}
                      </Text>
                    </View>
                    
                    {/* Columna 2: Icono */}
                    <View style={styles.colVentaIcono}>
                      <View style={styles.contenedorIconoMetodo}>
                        <MaterialIcons 
                          name={obtenerIconoMetodoVenta(metodoPrimerPago)} 
                          size={20} 
                          color={obtenerColorMetodoVenta(metodoPrimerPago)} 
                        />
                      </View>
                    </View>
                    
                    {/* Columna 3: Monto y Medios de Pago */}
                    <View style={styles.colVentaDetalles}>
                      <Text style={styles.ventaItemMontoTabla}>
                        ${venta.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </Text>
                      <Text 
                        style={styles.ventaItemMetodosTabla}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {metodosLista}
                      </Text>
                    </View>
                    
                    {/* Columna 4: Botón de Borrar (Icono X tenue) */}
                    <View style={styles.colVentaAccion}>
                      <TouchableOpacity
                        style={styles.botonBorrarIcono}
                        onPress={() => setVentaABorrar(venta.id)}
                        activeOpacity={0.6}
                      >
                        <MaterialIcons name="close" size={20} color={theme.colors.text.muted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Tarjeta>
              );
            })
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
    marginBottom: theme.spacing.xl,
  },
  filaContadores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  tarjetaContador: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
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
    fontSize: theme.sizes.xxl,
    color: theme.colors.text.primary,
  },
  tituloDesglose: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  contenedorGrillaMetodos: {
    flexDirection: 'column',
  },
  filaGrillaMetodos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tarjetaDesglose: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  contenedorTituloDesglose: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  desgloseLabel: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  desgloseValor: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.md,
    color: theme.colors.text.primary,
  },
  seccionAcciones: {
    marginBottom: theme.spacing.lg,
  },
  seccionHistorial: {
    marginTop: theme.spacing.xxl,
  },
  contenedorTituloSeccionConBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tituloSeccion: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeVentas: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.round,
  },
  badgeVentasTexto: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    color: theme.colors.text.light,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colVentaHora: {
    width: 60,
    justifyContent: 'center',
  },
  colVentaIcono: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenedorIconoMetodo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F0F3F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colVentaDetalles: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'center',
  },
  colVentaAccion: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  ventaItemHora: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
  },
  ventaItemMontoTabla: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.md,
    color: theme.colors.text.primary,
  },
  ventaItemMetodosTabla: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  botonBorrarIcono: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  contenedorCentrado: {
    flex: 1,
    backgroundColor: '#ECEFF1',
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
    marginBottom: theme.spacing.lg,
  },
  botonRedireccion: {
    width: '100%',
    maxWidth: 240,
  },
});
