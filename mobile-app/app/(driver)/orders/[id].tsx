import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { colors } from '../../../constants/colors';
import { driverService } from '../../../services/driver';
import { useSocket } from '../../../hooks/useSocket';

type OrderItem = {
  id: string;
  name: string;
  item_name?: string;
  quantity: number;
  unit_price: number;
  special_instructions?: string;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  tip_amount: number;
  total_amount: number;
  placed_at: string;
  special_instructions?: string;
  delivery_instructions?: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  restaurant_location?: any;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | { street: string; city: string; zip: string };
  items: OrderItem[];
  driver_id: string;
};

export default function DriverOrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const socket = useSocket();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // --- 1. Fetch Data ---
  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response: any = await driverService.getOrder(id);
      setOrder(response.data || response);
    } catch (error) {
      console.error('Fetch order error:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Live GPS Socket Broadcaster ---
  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      const activeStatuses = ['accepted_by_driver', 'picked_up', 'on_the_way'];
      
      // If the order is complete or not in an active transit state, KILL the tracker
      if (!order || !activeStatuses.includes(order.status) || !socket) {
        stopTracking();
        return;
      }

      // Prevent duplicate watchers if one is already running
      if (locationSubscription.current) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS permission is required to update the customer.');
        return;
      }

      setIsLiveTracking(true);
      
      // Start pulsing animation for the "LIVE" badge
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,     // Ping every 3 seconds
          distanceInterval: 10,   // OR every 10 meters moved (saves battery)
        },
        (location) => {
          if (socket && isMounted) {
            // Emits exactly the payload your backend index.js expects
            socket.emit('driver_location_update', {
              driverId: order.driver_id,
              orderId: id,
              location: [location.coords.longitude, location.coords.latitude],
            });
          }
        }
      );
    };

    const stopTracking = () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
      setIsLiveTracking(false);
      pulseAnim.setValue(1);
    };

    startTracking();

    // Cleanup: When screen unmounts or status changes, kill the tracker
    return () => {
      isMounted = false;
      stopTracking();
    };
  }, [order?.status, socket, id]);


  // --- 3. Order Actions ---
  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await driverService.updateOrderStatus(id, newStatus);
      await fetchOrderDetails(); // Refresh to see changes and trigger/kill GPS
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleScanDeliveryCode = () => {
    router.push(`/(driver)/orders/${id}/scan`);
  };

  const openMaps = (address: string | any) => {
    const addrString = typeof address === 'object' ? `${address.street}, ${address.city}` : address;
    const url = Platform.select({
      ios: `maps:0,0?q=${addrString}`,
      android: `geo:0,0?q=${addrString}`,
    });
    Linking.openURL(url || '');
  };

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getNextAction = () => {
    if (!order) return null;
    switch (order.status) {
      case 'accepted_by_driver':
        return { label: 'Confirm Pick Up', status: 'picked_up', icon: 'cube' };
      case 'picked_up':
        return { label: 'Start Delivery', status: 'on_the_way', icon: 'navigate' };
      case 'on_the_way':
        return { label: 'Arrived at Customer', status: 'arrived', icon: 'location' };
      case 'arrived':
        return { label: 'Scan Delivery Code', actionType: 'scan', icon: 'scan' };
      default:
        return null;
    }
  };

  const formatAddress = (address: any) => {
    if (typeof address === 'object' && address !== null) {
      return `${address.street}, ${address.city}`;
    }
    return address || 'Unknown Address';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Order not found</Text>
      </View>
    );
  }

  const nextAction = getNextAction();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.order_number || order.id.slice(0, 6)}</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Status Banner with Live Indicator */}
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>{order.status.replace(/_/g, ' ').toUpperCase()}</Text>
          {isLiveTracking && (
            <Animated.View style={[styles.liveBadge, { opacity: pulseAnim }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE GPS</Text>
            </Animated.View>
          )}
        </View>

        {/* 1. Pick Up Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Pick Up</Text>
            <TouchableOpacity onPress={() => callNumber(order.restaurant_phone)}>
              <Ionicons name="call" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{order.restaurant_name}</Text>
          <Text style={styles.address}>{order.restaurant_address}</Text>
          <TouchableOpacity 
            style={styles.mapBtn} 
            onPress={() => openMaps(order.restaurant_address)}
          >
            <Ionicons name="map" size={16} color={colors.primary} />
            <Text style={styles.mapBtnText}>Navigate to Restaurant</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Delivery Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Drop Off</Text>
            <TouchableOpacity onPress={() => callNumber(order.customer_phone)}>
              <Ionicons name="call" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{order.customer_name}</Text>
          <Text style={styles.address}>{formatAddress(order.delivery_address)}</Text>
          
          {order.delivery_instructions ? (
            <View style={styles.noteContainer}>
              <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
              <Text style={styles.noteText}>{order.delivery_instructions}</Text>
            </View>
          ) : null}

          <TouchableOpacity 
            style={styles.mapBtn}
            onPress={() => openMaps(order.delivery_address)}
          >
            <Ionicons name="navigate" size={16} color={colors.primary} />
            <Text style={styles.mapBtnText}>Navigate to Customer</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {(order.items || []).map((item, index) => (
            <View key={item.id || index} style={styles.itemRow}>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{item.quantity}x</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name || item.item_name}</Text>
                {item.special_instructions ? (
                  <Text style={styles.itemNote}>Note: {item.special_instructions}</Text>
                ) : null}
              </View>
              <Text style={styles.itemPrice}>R{Number(item.unit_price).toFixed(2)}</Text>
            </View>
          ))}
          
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total (Cash to Collect)</Text>
            <Text style={styles.totalValue}>R{Number(order.total_amount).toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Footer Action Button */}
      {nextAction && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => nextAction.actionType === 'scan' ? handleScanDeliveryCode() : handleUpdateStatus(nextAction.status)}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.actionBtnText}>{nextAction.label}</Text>
                <Ionicons name={nextAction.icon as any} size={20} color="#fff" style={{marginLeft: 8}} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 120 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  
  statusBanner: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { fontSize: 14, color: colors.textSecondary, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  
  name: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  address: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  
  mapBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: colors.primary + '10', padding: 10, borderRadius: 8, alignSelf: 'flex-start' },
  mapBtnText: { color: colors.primary, fontWeight: '600', fontSize: 13, marginLeft: 6 },

  noteContainer: { flexDirection: 'row', marginTop: 8, backgroundColor: '#FFF3E0', padding: 8, borderRadius: 6 },
  noteText: { marginLeft: 6, color: '#E65100', fontSize: 13, flex: 1 },

  itemRow: { flexDirection: 'row', marginBottom: 12 },
  qtyBadge: { backgroundColor: colors.gray100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 10, height: 24, justifyContent: 'center' },
  qtyText: { fontWeight: 'bold', fontSize: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  itemNote: { fontSize: 12, color: colors.textTertiary, marginTop: 2, fontStyle: 'italic' },
  itemPrice: { fontSize: 14, fontWeight: '600' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  actionBtn: {
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});