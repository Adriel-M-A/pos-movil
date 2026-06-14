import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportarA_CSV } from '@/db/repositorio';
import { theme } from '@/theme';
import { Boton } from '@/components/Boton';
import { Tarjeta } from '@/components/Tarjeta';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function Configuracion() {
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

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Cabecera sutil */}
      <View style={styles.header}>
        <Text style={styles.tituloHeader}>Ajustes del Sistema</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
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
