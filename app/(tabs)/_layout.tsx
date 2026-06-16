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
        tabBarInactiveTintColor: theme.colors.text.muted,
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
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="point-of-sale" size={22} color={color} />
          ),
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
    backgroundColor: theme.colors.surface,
    overflow: 'visible', // Evita que se recorte el botón central en iOS/Android
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 10,
    marginTop: 2,
  },

});
