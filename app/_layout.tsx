import { Stack } from 'expo-router';
import { useDBMigrations } from '@/db/migrator';
import { useAppFonts } from '@/hooks/use-fonts';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { CajaProvider } from '@/context/CajaContext';

/**
 * Layout raíz de la app. Ejecuta las migraciones de SQLite y carga las fuentes
 * de Google Fonts antes de mostrar cualquier pantalla, evitando accesos
 * incorrectos a la base de datos o parpadeos de tipografía.
 */
export default function RootLayout() {
  const { success: dbSuccess, error: dbError } = useDBMigrations();
  const { loaded: fontsLoaded, error: fontsError } = useAppFonts();

  if (dbError || fontsError) {
    const errorMensaje = dbError?.message || fontsError?.message || 'Error desconocido';
    return (
      <View style={styles.centrado}>
        <Text style={styles.errorTexto}>Error al inicializar la aplicación.</Text>
        <Text style={styles.errorDetalle}>{errorMensaje}</Text>
      </View>
    );
  }

  if (!dbSuccess || !fontsLoaded) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <CajaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </CajaProvider>
  );
}

const styles = StyleSheet.create({
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  errorTexto: {
    fontSize: theme.sizes.md,
    fontFamily: theme.fonts.bold,
    color: theme.colors.danger,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  errorDetalle: {
    fontSize: theme.sizes.sm,
    fontFamily: theme.fonts.monoRegular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

