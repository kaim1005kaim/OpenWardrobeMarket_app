import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import { Link, Tabs } from 'expo-router';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Pressable, Platform, StyleSheet, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// Minimal line icons for Floating Glass Dock
function TabBarIcon(props: {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
}) {
  return <Feather size={22} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => (
        <View style={styles.tabBarWrapper}>
          <BottomTabBar {...props} />
        </View>
      )}
      screenOptions={{
        tabBarActiveTintColor: '#1a3d3d', // darkTeal
        tabBarInactiveTintColor: '#9CA3AF', // グレー
        headerShown: false,
        tabBarShowLabel: false, // ラベルを非表示
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
          paddingTop: 12,
        },
        tabBarStyle: {
          position: 'relative',
          height: 64,
          backgroundColor: 'rgba(255, 255, 255, 0.8)', // すりガラス効果
          borderRadius: 24,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.4)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 12,
          elevation: 8,
          paddingBottom: 0,
          paddingTop: 0,
          ...(Platform.OS === 'ios' && {
            backdropFilter: 'blur(20px)',
          }),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'STUDIO',
          tabBarIcon: ({ color }) => <TabBarIcon name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="showcase"
        options={{
          title: 'SHOWCASE',
          tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'CREATE',
          tabBarIcon: ({ color }) => <TabBarIcon name="plus" color={color} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'EVENTS',
          tabBarIcon: ({ color }) => <TabBarIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: 'ARCHIVE',
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 24,
    alignSelf: 'center',
  },
});
