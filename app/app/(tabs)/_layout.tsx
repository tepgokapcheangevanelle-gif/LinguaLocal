import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { type ColorValue, useColorScheme } from 'react-native';

import { Colors } from '@/theme';

export default function TabsLayout() {
  const colors = useColorScheme() === 'dark' ? Colors.dark : Colors.light;
  const tint = (color: ColorValue) => (typeof color === 'string' ? color : colors.primary);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Traduire',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={tint(color)} />,
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          title: 'Dictionnaire',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={tint(color)} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoris',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={tint(color)} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historique',
          tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={tint(color)} />,
        }}
      />
    </Tabs>
  );
}
