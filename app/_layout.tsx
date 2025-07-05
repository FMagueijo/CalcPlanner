import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import { View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function TabBarWithSafeArea() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ 
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      backgroundColor: '#1a1a1a',
    }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderTopWidth: 1,
            borderTopColor: '#1a1a1a',
            borderColor: '#2D2D2D',
            shadowOpacity: 0,
            paddingTop: 10,
            height: 90,
          },
          tabBarActiveTintColor: '#4A90E2',
          tabBarInactiveTintColor: '#888',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Novo Orçamento',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="add-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="orcamentos"
          options={{
            title: 'Orçamentos',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <TabBarWithSafeArea />
    </SafeAreaProvider>
  );
}
