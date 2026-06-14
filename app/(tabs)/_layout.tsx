import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { theme } from '@/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#B0BEC5', // Gris claro de alto contraste
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="storefront" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="caja"
        options={{
          title: 'Caja',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="account-balance-wallet" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="venta"
        options={{
          title: 'Cobrar',
          tabBarButton: (props) => {
            const isFocused = props.accessibilityState?.selected;
            return (
              <TouchableOpacity
                onPress={props.onPress ?? undefined}
                onLongPress={props.onLongPress ?? undefined}
                accessibilityState={props.accessibilityState}
                accessibilityRole={props.accessibilityRole}
                accessibilityLabel={props.accessibilityLabel}
                disabled={props.disabled ?? undefined}
                style={styles.contenedorBotonCobrar}
                activeOpacity={0.85}
              >
                <View style={[
                  styles.botonCobrarCentral,
                  isFocused && styles.botonCobrarCentralActivo
                ]}>
                  <MaterialIcons name="point-of-sale" size={28} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="reportes"
        options={{
          title: 'Reportes',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="bar-chart" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="configuracion"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="settings" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    height: 68,
    paddingBottom: 10,
    paddingTop: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'visible', // Evita que se recorte el botón central en iOS/Android
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    marginTop: 2,
  },
  contenedorBotonCobrar: {
    top: -14, // Posicionar verticalmente el botón flotante
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  botonCobrarCentral: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  botonCobrarCentralActivo: {
    backgroundColor: theme.colors.secondary,
  },
});
