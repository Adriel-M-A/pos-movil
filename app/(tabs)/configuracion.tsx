import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { obtenerConfiguracion, guardarConfiguracion, exportarA_CSV } from '@/db/repositorio';
import { theme } from '@/theme';
import { TecladoNumerico, TipoTecla, procesarEntradaTeclado } from '@/components/TecladoNumerico';
import { Boton } from '@/components/Boton';
import { Tarjeta } from '@/components/Tarjeta';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function Configuracion() {
  const [monto, setMonto] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [exportando, setExportando] = useState<boolean>(false);

  const handleExportar = async () => {
    setExportando(true);
    try {
      const csvContent = await exportarA_CSV();
      
      const fechaHoy = new Date().toISOString().split('T')[0];
      const filename = `reporte_ventas_${fechaHoy}.csv`;
      const fileUri = `${(FileSystem as any).documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Compartir Reporte de Ventas',
        });
      } else {
        Alert.alert('Error', 'La funcionalidad de compartir no está disponible en este dispositivo.');
      }
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      Alert.alert('Error', 'No se pudo generar ni compartir el archivo de reporte.');
    } finally {
      setExportando(false);
    }
  };

  // Cargar configuración inicial al montar la pantalla
  useEffect(() => {
    async function cargar() {
      try {
        const val = await obtenerConfiguracion('fondo_inicial_default');
        if (val) {
          setMonto(val.replace('.', ','));
        } else {
          setMonto('10000'); // Valor por defecto
        }
      } catch (err) {
        console.error('Error al obtener fondo inicial default:', err);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const handleTecla = (tecla: TipoTecla) => {
    setMonto((prev: string) => procesarEntradaTeclado(prev, tecla));
  };

  const handleLimpiar = () => {
    setMonto('');
  };

  const handleGuardar = async () => {
    const valorGuardar = monto.replace(',', '.');
    const valorNumerico = parseFloat(valorGuardar);

    if (isNaN(valorNumerico) || valorNumerico < 0) {
      return;
    }

    setGuardando(true);
    try {
      await guardarConfiguracion('fondo_inicial_default', valorGuardar);
      Alert.alert('Éxito ✓', 'Ajustes guardados correctamente.');
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      Alert.alert('Error', 'No se pudieron guardar los ajustes.');
    } finally {
      setGuardando(false);
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

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Cabecera sutil */}
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>Ajustes del Sistema</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <Tarjeta tinted={false} style={styles.seccionTarjeta}>
          <Text style={styles.etiquetaCampo}>Fondo de Apertura Predeterminado</Text>
          
          <View style={styles.contenedorMonto}>
            <Text style={styles.simboloMoneda}>$</Text>
            <Text style={styles.montoTexto} numberOfLines={1}>
              {monto || '0'}
            </Text>
          </View>
          
          <Text style={styles.descripcionCampo}>
            Este valor se autocompletará en la pantalla de inicio al abrir la caja de cada jornada. Podés editarlo libremente en cualquier momento.
          </Text>
        </Tarjeta>

        {/* Teclado Integrado */}
        <TecladoNumerico
          onPresionarTecla={handleTecla}
          onLimpiarTodo={handleLimpiar}
          style={styles.teclado}
        />

        {/* Botón Guardar */}
        <Boton
          titulo={guardando ? 'Guardando...' : 'Guardar Ajustes'}
          variant="primary"
          alto="large"
          loading={guardando}
          onPress={handleGuardar}
          style={{ marginBottom: theme.spacing.lg }}
        />

        {/* Sección: Respaldar Información */}
        <Tarjeta tinted style={styles.tarjetaExportacion}>
          <Text style={[styles.tituloSeccion, { color: theme.colors.text.light }]}>Respaldar Información</Text>
          <Text style={styles.descripcionExportacion}>
            Exportá un archivo plano en formato CSV compatible con Microsoft Excel y Google Sheets. Contiene el historial completo de ventas, notas y cierres de caja de la aplicación.
          </Text>
          
          <Boton
            titulo="Exportar Datos a CSV"
            variant="secondary"
            alto="large"
            loading={exportando}
            onPress={handleExportar}
            style={styles.botonExportar}
          />
        </Tarjeta>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
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
  contenido: {
    flexGrow: 1,
    padding: theme.spacing.md,
    justifyContent: 'space-between',
  },
  seccionTarjeta: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  etiquetaCampo: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  contenedorMonto: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
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
  descripcionCampo: {
    fontFamily: theme.fonts.regular,
    fontSize: theme.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  teclado: {
    marginVertical: theme.spacing.sm,
  },
  tarjetaExportacion: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  tituloSeccion: {
    fontFamily: theme.fonts.bold,
    fontSize: theme.sizes.md,
    marginBottom: 4,
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
