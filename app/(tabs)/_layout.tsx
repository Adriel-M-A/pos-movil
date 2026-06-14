import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Caja',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="storefront" size={22} color={color} />
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
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontFamily: theme.fonts.bold,
    fontSize: 11,
  },
});
