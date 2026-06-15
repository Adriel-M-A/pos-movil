import { useEffect, useState } from 'react';
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
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { obtenerDatosMensuales, obtenerTendenciaMensual } from '@/db/repositorio';
import { MaterialIcons } from '@expo/vector-icons';

interface VentaItem {
  id: number;
  cajaId: number;
  monto: number;
  timestamp: string;
  nota: string | null;
}

interface DatosMensualesType {
  ventas: VentaItem[];
  pagosPorMetodo: {
    efectivo: number;
    transferencia: number;
    qr: number;
    credito: number;
  };
  totalVendido: number;
}

const obtenerIconoMetodo = (text: string) => {
  switch (text.toLowerCase()) {
    case 'efectivo':
      return 'payments';
    case 'transf.':
    case 'transferencia':
      return 'account-balance';
    case 'qr':
      return 'qr-code';
    case 'crédito':
    case 'credito':
      return 'credit-card';
    default:
      return 'payment';
  }
};

const nombresMeses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const mesesAbreviados = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Reportes() {
  const [anioMes, setAnioMes] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const [cargando, setCargando] = useState<boolean>(true);
  const [datosMensuales, setDatosMensuales] = useState<DatosMensualesType>({
    ventas: [],
    pagosPorMetodo: { efectivo: 0, transferencia: 0, qr: 0, credito: 0 },
    totalVendido: 0,
  });
  
  const [tendenciaMensual, setTendenciaMensual] = useState<Array<{ mes: string; total: number }>>([]);

  useEffect(() => {
    async function cargarDatos() {
      setCargando(true);
      try {
        const dMes = await obtenerDatosMensuales(anioMes);
        const tMes = await obtenerTendenciaMensual(anioMes, 6);
        setDatosMensuales(dMes);
        setTendenciaMensual(tMes);
      } catch (err) {
        console.error('Error al cargar datos del reporte:', err);
        Alert.alert('Error', 'No se pudieron cargar las estadísticas.');
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, [anioMes]);

  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    const [anioStr, mesStr] = anioMes.split('-');
    let anio = parseInt(anioStr);
    let mes = parseInt(mesStr);
    
    if (direccion === 'anterior') {
      mes = mes - 1;
      if (mes === 0) {
        mes = 12;
        anio = anio - 1;
      }
    } else {
      mes = mes + 1;
      if (mes === 13) {
        mes = 1;
        anio = anio + 1;
      }
    }
    setAnioMes(`${anio}-${String(mes).padStart(2, '0')}`);
  };

  const formatearTituloMes = (am: string) => {
    const [anioStr, mesStr] = am.split('-');
    const idx = parseInt(mesStr) - 1;
    return `${nombresMeses[idx]} ${anioStr}`;
  };

  // 1. Cálculos de métricas destacadas
  const totalFacturado = datosMensuales.totalVendido;
  const operacionesCount = datosMensuales.ventas.length;
  const ticketPromedio = operacionesCount > 0 ? Math.round(totalFacturado / operacionesCount) : 0;

  // 2. Datos para gráfico de tendencia (Mini bar chart) - Sin topLabelComponent para visuales limpios en móviles
  const barDataTendencia = tendenciaMensual.map((item) => {
    const [_, mesStr] = item.mes.split('-');
    const mesIdx = parseInt(mesStr) - 1;
    const label = mesesAbreviados[mesIdx] || item.mes;
    const esMesActivo = item.mes === anioMes;

    return {
      value: item.total,
      label,
      frontColor: esMesActivo ? theme.colors.secondary : '#B0BEC5',
    };
  });

  // 3. Datos para el gráfico de torta (métodos de pago)
  const pieData = [
    {
      value: datosMensuales.pagosPorMetodo.efectivo,
      color: theme.colors.efectivo,
      text: 'Efectivo',
    },
    {
      value: datosMensuales.pagosPorMetodo.transferencia,
      color: theme.colors.transferencia,
      text: 'Transf.',
    },
    {
      value: datosMensuales.pagosPorMetodo.qr,
      color: theme.colors.digital,
      text: 'QR',
    },
    {
      value: datosMensuales.pagosPorMetodo.credito,
      color: theme.colors.credito,
      text: 'Crédito',
    },
  ].filter((p) => p.value > 0);

  // 4. Datos para gráfico diario - Sin topLabelComponent
  const [anioStr, mesStr] = anioMes.split('-');
  const anio = parseInt(anioStr);
  const mes = parseInt(mesStr);
  const diasEnMes = new Date(anio, mes, 0).getDate();

  const datosDiarios = Array.from({ length: diasEnMes }, (_, i) => ({
    day: i + 1,
    total: 0,
  }));

  datosMensuales.ventas.forEach((v) => {
    try {
      const dStr = v.timestamp.split('T')[0].split('-')[2];
      const d = parseInt(dStr);
      if (d >= 1 && d <= diasEnMes) {
        datosDiarios[d - 1].total += v.monto;
      }
    } catch (e) {
      // ignore
    }
  });

  const barDataDiario = datosDiarios.map((d) => {
    const hoy = new Date();
    const esHoy = d.day === hoy.getDate() && 
                 mes === (hoy.getMonth() + 1) && 
                 anio === hoy.getFullYear();

    return {
      value: d.total,
      label: String(d.day),
      frontColor: esHoy ? theme.colors.secondary : theme.colors.primary,
    };
  });

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
      
      {/* Cabecera / Selector de Mes estilo Mercado Pago */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.botonHeader} onPress={() => cambiarMes('anterior')}>
          <MaterialIcons name="chevron-left" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>{formatearTituloMes(anioMes)}</Text>
        <TouchableOpacity style={styles.botonHeader} onPress={() => cambiarMes('siguiente')}>
          <MaterialIcons name="chevron-right" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        
        {cargando ? (
          <View style={styles.contenedorCarga}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.textoCargando}>Procesando métricas...</Text>
          </View>
        ) : (
          <>
            {/* 1. Tarjeta Resumen de Ventas (Monto Gigante) */}
            <Tarjeta tinted={false} style={styles.tarjetaTotal}>
              <Text style={styles.labelTotal}>Facturación total del mes</Text>
              <Text style={styles.montoGigante}>
                ${totalFacturado.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Text>
              
              <View style={styles.lineaDivisoria} />
              
              <View style={styles.filaMetricas}>
                <View style={styles.itemMetrica}>
                  <Text style={styles.labelMetrica}>Operaciones</Text>
                  <Text style={styles.valorMetrica}>{operacionesCount}</Text>
                </View>
                <View style={[styles.itemMetrica, styles.bordeIzquierdo]}>
                  <Text style={styles.labelMetrica}>Ticket Promedio</Text>
                  <Text style={styles.valorMetrica}>
                    ${ticketPromedio.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            </Tarjeta>

            {/* 2. Tarjeta Métodos de Pago ("Salidas por categoría" de MP) - Ubicado antes que Tendencias */}
            <Tarjeta tinted={false} style={styles.tarjetaReporte}>
              <Text style={styles.tituloSeccion}>Ingresos por Método de Pago</Text>
              <Text style={styles.subtituloSeccion}>Distribución según el medio de cobro seleccionado</Text>

              {totalFacturado === 0 ? (
                <Text style={styles.textoVacio}>
                  Sin ventas registradas en este mes comercial.
                </Text>
              ) : (
                <View style={styles.filaGraficoTorta}>
                  <View style={styles.contenedorTorta}>
                    <PieChart
                      data={pieData}
                      donut
                      radius={68}
                      innerRadius={48}
                      innerCircleColor={theme.colors.surface}
                      centerLabelComponent={() => (
                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={styles.textoCentroTorta}>Total</Text>
                          <Text style={styles.montoCentroTorta}>
                            ${totalFacturado >= 100000 
                              ? `${Math.round(totalFacturado / 1000)}k` 
                              : Math.round(totalFacturado)}
                          </Text>
                        </View>
                      )}
                    />
                  </View>

                  {/* Leyenda en formato filas (un método por fila) */}
                  <View style={styles.contenedorLeyendaFilas}>
                    {pieData.map((item, idx) => {
                      const porcentaje = ((item.value / totalFacturado) * 100).toFixed(0);
                      return (
                        <View 
                          key={idx} 
                          style={[
                            styles.itemLeyendaFila, 
                            idx === pieData.length - 1 && { borderBottomWidth: 0 }
                          ]}
                        >
                          <View style={styles.infoLeyendaFilaIzq}>
                            <View style={[styles.indicadorColor, { backgroundColor: item.color }]} />
                            <MaterialIcons name={obtenerIconoMetodo(item.text)} size={18} color={theme.colors.text.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.textoLeyenda}>{item.text}</Text>
                          </View>
                          <View style={styles.infoLeyendaFilaDer}>
                            <Text style={styles.montoLeyenda}>${item.value.toLocaleString('es-AR')}</Text>
                            <Text style={styles.porcentajeLeyendaFila}>({porcentaje}%)</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </Tarjeta>

            {/* 3. Tarjeta Tendencia Mensual (Comparativa) */}
            <Tarjeta tinted={false} style={styles.tarjetaReporte}>
              <Text style={styles.tituloSeccion}>Tendencia de Facturación</Text>
              <Text style={styles.subtituloSeccion}>Comparación histórica de los últimos meses</Text>
              
              <View style={styles.contenedorGraficoTendencia}>
                <BarChart
                  data={barDataTendencia}
                  width={screenWidth - 32}
                  height={110}
                  noOfSections={3}
                  barWidth={22}
                  spacing={20}
                  initialSpacing={12}
                  xAxisColor={theme.colors.border}
                  yAxisColor="transparent"
                  yAxisTextStyle={styles.textoEjes}
                  xAxisLabelTextStyle={styles.textoEjes}
                  isAnimated
                  hideRules
                />
              </View>
            </Tarjeta>

            {/* 4. Tarjeta Historial Diario (Eje Y Fijo con Scroll Interno mediante el prop nativo de BarChart) */}
            <Tarjeta tinted={false} style={styles.tarjetaReporte}>
              <Text style={styles.tituloSeccion}>Historial Diario de Ventas</Text>
              <Text style={styles.subtituloSeccion}>Facturación día por día del mes seleccionado</Text>

              {totalFacturado === 0 ? (
                <Text style={styles.textoVacio}>
                  Sin registros diarios para este mes.
                </Text>
              ) : (
                <View style={styles.contenedorGraficoDiarioOuter}>
                  {/* Se remueve scrollable={true} ya que en Gifted Charts el scroll es automático si el contenido supera el 'width' provisto */}
                  <BarChart
                    data={barDataDiario}
                    width={screenWidth - 24}
                    height={180}
                    noOfSections={4}
                    barWidth={12}
                    spacing={14}
                    initialSpacing={10}
                    xAxisColor={theme.colors.border}
                    yAxisColor="transparent"
                    yAxisTextStyle={styles.textoEjes}
                    xAxisLabelTextStyle={styles.textoEjes}
                    isAnimated
                    hideRules
                  />
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
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  botonHeader: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  contenedorCarga: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoCargando: {
    marginTop: theme.spacing.md,
    fontFamily: theme.fonts.medium,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
  },
  tarjetaTotal: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  labelTotal: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  montoGigante: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.giant + 6,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  lineaDivisoria: {
    width: '100%',
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  filaMetricas: {
    flexDirection: 'row',
    width: '100%',
  },
  itemMetrica: {
    flex: 1,
    alignItems: 'center',
  },
  bordeIzquierdo: {
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
  },
  labelMetrica: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valorMetrica: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.lg,
    color: theme.colors.primary,
  },
  tarjetaReporte: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  tituloSeccion: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.md,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  subtituloSeccion: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  contenedorGraficoTendencia: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  textoEjes: {
    fontFamily: theme.fonts.monoRegular,
    fontSize: 9,
    color: theme.colors.text.secondary,
  },
  textoVacio: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
  },
  filaGraficoTorta: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  contenedorTorta: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  textoCentroTorta: {
    fontFamily: theme.fonts.regular,
    fontSize: 10,
    color: theme.colors.text.secondary,
  },
  montoCentroTorta: {
    fontFamily: theme.fonts.monoBold,
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  contenedorLeyendaFilas: {
    width: '100%',
    marginTop: theme.spacing.md,
  },
  itemLeyendaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoLeyendaFilaIzq: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLeyendaFilaDer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicadorColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  textoLeyenda: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.primary,
  },
  montoLeyenda: {
    fontFamily: theme.fonts.monoBold,
    fontSize: theme.sizes.sm,
    color: theme.colors.text.primary,
    marginRight: 6,
  },
  porcentajeLeyendaFila: {
    fontFamily: theme.fonts.medium,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
  },
  contenedorGraficoDiarioOuter: {
    marginTop: theme.spacing.sm,
  },
});
