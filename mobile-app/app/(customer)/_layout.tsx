import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useCartStore } from '../../store/cartStore';

export default function CustomerLayout() {
  const cartCount = useCartStore((state) =>
    state.items.reduce((count, item) => count + item.quantity, 0)
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIcon : null}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
{/* 
      <Tabs.Screen
        name="home/restaurants"
        options={{
          title: 'Restaurants',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIcon : null}>
              <Ionicons name={focused ? 'restaurant' : 'restaurant-outline'} size={size} color={color} />
            </View>
          ),
        }}
      /> */}

      <Tabs.Screen
        name="home/restaurants"
        options={{ 
          href: null, // This hides the button
          tabBarStyle: { display: 'none' } // Optional: This hides the tab bar when on this screen
        }} 
      />
      
      <Tabs.Screen
        name="search/index"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIcon : null}>
              <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIcon : null}>
              <MaterialIcons name={focused ? 'receipt-long' : 'receipt-long'} size={size} color={color} />
            </View>
          ),
        }}
      />
      
      <Tabs.Screen
        name="cart/index"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIcon : null}>
              <Ionicons name={focused ? 'cart' : 'cart-outline'} size={size} color={color} />
            </View>
          ),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIcon : null}>
              <Feather name={focused ? 'user' : 'user'} size={size} color={color} />
            </View>
          ),
        }}
      />

      <Tabs.Screen 
        name="orders/[id]" 
        options={{ 
          href: null, // This hides the button
          tabBarStyle: { display: 'none' } // Optional: This hides the tab bar when on this screen
        }} 
      />
      
      <Tabs.Screen 
        name="orders/tracking" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' }
        }} 
      />
      
      <Tabs.Screen 
        name="checkout/index" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' } // Good UX to hide nav during checkout
        }} 
      />

      <Tabs.Screen 
        name="home/restaurant-details" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' },
        }} 
      />

      <Tabs.Screen
        name="menu/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopColor: '#eee',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  activeIcon: {
    color: colors.primary + '20',
    borderRadius: 20,
  },
});