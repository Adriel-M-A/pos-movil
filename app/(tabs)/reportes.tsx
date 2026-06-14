import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/theme';
import { Tarjeta } from '@/components/Tarjeta';
import { Boton } from '@/components/Boton';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { obtenerResumenHistorico, obtenerResumenPorMetodo } from '@/db/repositorio';
import { MaterialIcons } from '@expo/vector-icons';

interface CajaResumen {
  cajaId: number;
  fechaApertura: string;
  totalVendido: number;
}

interface MetodosResumen {
  efectivo: number;
  transferencia: number;
  qr: number;
  credito: number;
}

type Periodo = 'dia' | 'semana' | 'mes';

const obtenerIconoMetodo = (text: string) => {
  switch (text.toLowerCase()) {
    case 'efectivo':
      return 'payments';
    case 'transf.':
      return 'account-balance';
    case 'qr':
      return 'qr-code';
    case 'crédito':
      return 'credit-card';
    default:
      return 'payment';
  }
};

export default function Reportes() {
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [cargando, setCargando] = useState<boolean>(true);
  const [resumenHistorico, setResumenHistorico] = useState<CajaResumen[]>([]);
  const [resumenMetodos, setResumenMetodos] = useState<MetodosResumen>({
    efectivo: 0,
    transferencia: 0,
    qr: 0,
    credito: 0,
  });

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        const limite = periodo === 'dia' ? 3 : periodo === 'semana' ? 7 : 15;
        const hist = await obtenerResumenHistorico(limite);
        const met = await obtenerResumenPorMetodo(limite);
        setResumenHistorico(hist);
        setResumenMetodos(met);
      } catch (err) {
        console.error('Error al cargar datos del reporte:', err);
        Alert.alert('Error', 'No se pudieron cargar las estadísticas.');
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, [periodo]);

  // Ajustar ancho de barras según la cantidad para que se dibuje estéticamente
  const configuracionBarras = () => {
    switch (periodo) {
      case 'dia':
        return { barWidth: 44, spacing: 36 };
      case 'semana':
        return { barWidth: 28, spacing: 20 };
      case 'mes':
        return { barWidth: 14, spacing: 10 };
    }
  };

  const { barWidth, spacing } = configuracionBarras();

  // 1. Datos para el gráfico de barras (historial de cajas)
  const barData = resumenHistorico.map((item) => {
    let label = `Caja ${item.cajaId}`;
    try {
      const [fecha] = item.fechaApertura.split('T');
      const [, mm, dd] = fecha.split('-');
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const mesInt = parseInt(mm) - 1;
      label = `${dd} ${meses[mesInt] || mm}`;
    } catch {
      // Fallback
    }

    return {
      value: item.totalVendido,
      label: label,
      frontColor: theme.colors.primary,
      topLabelComponent: () => (
        <Text style={styles.etiquetaBarra}>
          ${Math.round(item.totalVendido)}
        </Text>
      ),
    };
  });

  // 2. Datos para el gráfico de torta (métodos de pago)
  const totalMetodos =
    resumenMetodos.efectivo +
    resumenMetodos.transferencia +
    resumenMetodos.qr +
    resumenMetodos.credito;

  const pieData = [
    {
      value: resumenMetodos.efectivo,
      color: theme.colors.efectivo,
      text: 'Efectivo',
      focused: true,
    },
    {
      value: resumenMetodos.transferencia,
      color: theme.colors.secondary,
      text: 'Transf.',
    },
    {
      value: resumenMetodos.qr,
      color: theme.colors.digital,
      text: 'QR',
    },
    {
      value: resumenMetodos.credito,
      color: '#8E24AA',
      text: 'Crédito',
    },
  ].filter((p) => p.value > 0);

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Cabecera minimalista sin botón volver */}
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>Reportes y Métricas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        
        {/* Selector de Período segmentado */}
        <View style={styles.contenedorPeriodos}>
          <TouchableOpacity
            style={[styles.botonPeriodo, periodo === 'dia' && styles.botonPeriodoActivo]}
            onPress={() => setPeriodo('dia')}
          >
            <Text style={[styles.textoPeriodo, periodo === 'dia' && styles.textoPeriodoActivo]}>Diario</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonPeriodo, periodo === 'semana' && styles.botonPeriodoActivo]}
            onPress={() => setPeriodo('semana')}
          >
            <Text style={[styles.textoPeriodo, periodo === 'semana' && styles.textoPeriodoActivo]}>Semanal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonPeriodo, periodo === 'mes' && styles.botonPeriodoActivo]}
            onPress={() => setPeriodo('mes')}
          >
            <Text style={[styles.textoPeriodo, periodo === 'mes' && styles.textoPeriodoActivo]}>Mensual</Text>
          </TouchableOpacity>
        </View>

        {cargando ? (
          <View style={styles.contenedorCargaReporte}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.textoCargando}>Procesando período...</Text>
          </View>
        ) : (
          <>
            {/* Sección: Resumen del Negocio */}
            <Tarjeta tinted={false} style={styles.tarjetaReporte}>
              <Text style={styles.tituloSeccion}>Resumen del Período</Text>
              <View style={styles.filaResumen}>
                <View style={styles.colResumen}>
                  <Text style={styles.labelResumen}>Sesiones de Caja</Text>
                  <Text style={styles.valorResumen}>{resumenHistorico.length}</Text>
                </View>
                <View style={[styles.colResumen, styles.bordeIzquierdo]}>
                  <Text style={styles.labelResumen}>Ventas Acumuladas</Text>
                  <Text style={[styles.valorResumen, { color: theme.colors.primary }]}>
                    ${totalMetodos.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            </Tarjeta>

            {/* Sección: Evolución de Cajas (Gráfico de Barras) */}
            <Tarjeta tinted={false} style={styles.tarjetaReporte}>
              <Text style={styles.tituloSeccion}>Evolución de Ingresos</Text>
              <Text style={styles.subtituloSeccion}>Total facturado por jornada cerrada</Text>
              
              {resumenHistorico.length === 0 ? (
                <Text style={styles.textoVacio}>
                  No hay datos históricos suficientes. Completá cierres de caja para visualizar la evolución del negocio.
                </Text>
              ) : (
                <View style={styles.contenedorGrafico}>
                  <BarChart
                    data={barData}
                    width={screenWidth - 48}
                    height={180}
                    noOfSections={4}
                    barWidth={barWidth}
                    spacing={spacing}
                    initialSpacing={12}
                    xAxisColor={theme.colors.border}
                    yAxisColor={theme.colors.border}
                    yAxisTextStyle={styles.textoEjes}
                    xAxisLabelTextStyle={styles.textoEjes}
                    isAnimated
                    hideRules
                  />
                </View>
              )}
            </Tarjeta>

            {/* Sección: Distribución de Ventas (Gráfico de Torta) */}
            <Tarjeta tinted={false} style={styles.tarjetaReporte}>
              <Text style={styles.tituloSeccion}>Métodos de Pago Utilizados</Text>
              <Text style={styles.subtituloSeccion}>Distribución histórica según el volumen monetario</Text>

              {totalMetodos === 0 ? (
                <Text style={styles.textoVacio}>
                  Sin registros de ventas facturadas hasta el momento.
                </Text>
              ) : (
                <View style={styles.filaGraficoTorta}>
                  <View style={styles.contenedorTorta}>
                    <PieChart
                      data={pieData}
                      donut
                      radius={68}
                      innerRadius={44}
                      innerCircleColor="#FFFFFF"
                      centerLabelComponent={() => (
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={styles.textoCentroTorta}>Total</Text>
                          <Text style={styles.montoCentroTorta}>
                            ${Math.round(totalMetodos) >= 100000 
                              ? `${Math.round(totalMetodos / 1000)}k` 
                              : Math.round(totalMetodos)}
                          </Text>
                        </View>
                      )}
                    />
                  </View>

                  {/* Leyenda Personalizada */}
                  <View style={styles.contenedorLeyenda}>
                    {pieData.map((item, idx) => {
                      const porcentaje = ((item.value / totalMetodos) * 100).toFixed(0);
                      return (
                        <View key={idx} style={styles.itemLeyenda}>
                          <View style={[styles.indicadorColor, { backgroundColor: item.color }]} />
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name={obtenerIconoMetodo(item.text)} size={12} color={theme.colors.text.secondary} style={{ marginRight: 6 }} />
                            <View>
                              <Text style={styles.textoLeyenda}>{item.text}</Text>
                              <Text style={styles.porcentajeLeyenda}>
                                ${item.value.toLocaleString('es-AR', { maximumFractionDigits: 0 })} ({porcentaje}%)
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </Tarjeta>
          </>
        )}

      </ScrollView>
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
  contenido: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  contenedorPeriodos: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.sm,
    padding: 4,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  botonPeriodo: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm - 2,
  },
  botonPeriodoActivo: {
    backgroundColor: theme.colors.surface,
  },
  textoPeriodo: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  textoPeriodoActivo: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.primary,
  },
  contenedorCargaReporte: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCargando: {
    marginTop: theme.spacing.md,
    fontFamily: theme.fonts.medium,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
  },
  tarjetaReporte: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  tituloSeccion: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.md,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtituloSeccion: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  filaResumen: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  colResumen: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  bordeIzquierdo: {
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
  },
  labelResumen: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  valorResumen: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.xxl,
    color: theme.colors.text.primary,
  },
  contenedorGrafico: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  textoEjes: {
    fontFamily: theme.fonts.monoRegular,
    fontSize: 9,
    color: theme.colors.text.secondary,
  },
  etiquetaBarra: {
    fontFamily: theme.fonts.monoBold,
    fontSize: 8,
    color: theme.colors.text.secondary,
    marginBottom: 2,
    textAlign: 'center',
  },
  textoVacio: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
  },
  filaGraficoTorta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: theme.spacing.sm,
  },
  contenedorTorta: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCentroTorta: {
    fontFamily: theme.fonts.regular,
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  montoCentroTorta: {
    fontFamily: theme.fonts.monoBold,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  contenedorLeyenda: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
  },
  itemLeyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  indicadorColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: theme.spacing.xs,
  },
  textoLeyenda: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.primary,
  },
  porcentajeLeyenda: {
    fontFamily: theme.fonts.monoRegular,
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  tarjetaExportacion: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  descripcionExportacion: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginVertical: theme.spacing.md,
  },
  botonExportar: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 0,
  },
});
