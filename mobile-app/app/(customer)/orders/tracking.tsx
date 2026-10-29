import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, Feather } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { orderService } from '../../../services/order';

// 1. IMPORT YOUR SOCKET HOOK
import { useSocket } from '../../../hooks/useSocket';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

// Helper to parse Postgres coordinates (from the initial API fetch fallback)
const parseCoordinates = (location: any) => {
  if (!location) return null;
  if (Array.isArray(location)) return { latitude: location[1], longitude: location[0] };
  if (location.x && location.y) return { latitude: location.y, longitude: location.x };
  return null;
};

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  
  // 2. INITIALIZE SOCKET
  const socket = useSocket();
  
  const [order, setOrder] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [restaurantLocation, setRestaurantLocation] = useState<any>(null);
  const [userLocation, setUserLocation] = useState({ latitude: -26.2041, longitude: 28.0473 }); 
  
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false); 

  // 3. REPLACED SET_INTERVAL WITH LIVE SOCKET LISTENERS
  useEffect(() => {
    // Fetch base order details once
    fetchOrderData();

    if (socket && id) {
      // Tell the backend we want to listen to this specific order
      socket.emit('join_order', id);

      // Listen for the live GPS ping from the driver
      socket.on('driver_location', (data: any) => {
        if (data && data.location) {
          // Socket payload from your backend is [lng, lat]
          setDriverLocation({
            latitude: data.location[1],
            longitude: data.location[0],
          });
        }
      });

      // Listen for instant status updates (like 'arrived' or 'delivered')
      socket.on('order_update', (data: any) => {
        if (data && data.status) {
          setOrder((prev: any) => prev ? { ...prev, status: data.status } : null);
        }
      });
    }

    // Clean up listeners when leaving the screen
    return () => {
      if (socket) {
        socket.off('driver_location');
        socket.off('order_update');
      }
    };
  }, [id, socket]); 

  const fetchOrderData = async () => {
    try {
      const response: any = await orderService.getOrder(id);
      const data = response.data || response;
      setOrder(data);

      // We still parse these just in case the API does return them on load
      if (data.driver_location) {
        const coords = parseCoordinates(data.driver_location);
        if (coords) setDriverLocation(coords);
      }

      if (data.restaurant_location) {
        const coords = parseCoordinates(data.restaurant_location);
        if (coords) setRestaurantLocation(coords);
      }
    } catch (error) {
      console.error('Tracking error:', error);
    } finally {
      setLoading(false);
    }
  };

  // AUTO-ZOOM MAP
  useEffect(() => {
    if (mapRef.current && driverLocation && userLocation) {
      mapRef.current.fitToCoordinates([driverLocation, userLocation], {
        edgePadding: { top: 120, right: 50, bottom: showQR ? 450 : 300, left: 50 },
        animated: true,
      });
    }
  }, [driverLocation, showQR]);

  const handleCallDriver = () => {
    if (order?.driver_phone) Linking.openURL(`tel:${order.driver_phone}`);
  };

  const toggleQR = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowQR(!showQR);
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending': return 'Looking for a driver...';
      case 'accepted_by_driver': return 'Heading to restaurant';
      case 'picked_up': return 'Order picked up!';
      case 'on_the_way': return 'Driver is approaching!';
      case 'delivered': return 'Order Delivered';
      default: return 'Processing Order';
    }
  };

  const getExpiryText = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return 'No expiry available';
    const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Establishing connection...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Feather name="alert-circle" size={40} color={colors.gray500} />
        <Text style={styles.loadingText}>Tracking session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* FULL SCREEN MAP */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        mapPadding={{ top: insets.top + 60, right: 20, bottom: showQR ? 400 : 250, left: 20 }}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={userLocation} title="You">
          <View style={styles.markerUser}>
            <View style={styles.markerUserInner}>
              <Ionicons name="home" size={16} color="#fff" />
            </View>
          </View>
        </Marker>

        {!!restaurantLocation && (
          <Marker coordinate={restaurantLocation} title={order.restaurant_name}>
            <View style={styles.markerRestaurant}>
              <Ionicons name="restaurant" size={16} color="#fff" />
            </View>
          </Marker>
        )}

        {/* 4. THE DRIVER MARKER WILL NOW RENDER AS SOON AS driverLocation UPDATES */}
        {!!(driverLocation && order.driver_id) && (
          <Marker coordinate={driverLocation} title="Driver">
            <View style={styles.markerDriver}>
              <Ionicons name="car" size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {!!driverLocation && (
          <Polyline
            coordinates={[driverLocation, userLocation]}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[6, 6]}
          />
        )}
      </MapView>

      {/* FLOATING HEADER */}
      <View style={[styles.headerFloating, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <View style={styles.liveDot} />
          <Text style={styles.headerTitle}>Live Tracking</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* FLOATING BOTTOM SHEET */}
      <View style={[styles.bottomSheetFloating, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grabber} />
        
        <Text style={styles.statusText}>{getStatusMessage(order.status)}</Text>

        {order.driver_id ? (
          <View style={styles.driverSection}>
            <View style={styles.driverRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {order.driver_first_name?.charAt(0)}{order.driver_last_name?.charAt(0)}
                </Text>
              </View>
              <View style={styles.driverInfoBlock}>
                <Text style={styles.driverName}>
                  {order.driver_first_name} {order.driver_last_name}
                </Text>
                <View style={styles.vehicleRow}>
                  <Text style={styles.vehicleText}>
                    {order.driver_vehicle_color} {order.driver_vehicle_model}
                  </Text>
                  <View style={styles.plateBadge}>
                    <Text style={styles.plateText}>{order.driver_vehicle_plate || 'N/A'}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.waitingState}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.waitingText}>Assigning an optimal driver...</Text>
          </View>
        )}

        {['on_the_way', 'arrived'].includes(order.status) && !!order.verification_code && (
          <View style={styles.verificationContainer}>
            <TouchableOpacity style={styles.toggleCodeBtn} onPress={toggleQR} activeOpacity={0.8}>
              <Feather name="shield" size={18} color="#fff" />
              <Text style={styles.toggleCodeText}>
                {showQR ? 'Hide Verification Code' : 'Show Delivery Code'}
              </Text>
              <Feather name={showQR ? "chevron-up" : "chevron-down"} size={20} color="#fff" />
            </TouchableOpacity>

            {showQR && (
              <View style={styles.qrCard}>
                <Text style={styles.qrInstruction}>Show this to the driver upon arrival</Text>
                <View style={styles.qrWrapper}>
                  <QRCode value={String(order.verification_code)} size={160} backgroundColor="#fff" color="#1A1A1A" />
                </View>
                <Text style={styles.verificationCode}>{order.verification_code}</Text>
                <Text style={styles.expiresText}>Expires in {getExpiryText(order.code_expires_at)}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#E8EAED' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    gap: 12
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray500,
  },

  /* --- Map Markers --- */
  markerUser: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerUserInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerRestaurant: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  markerDriver: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },

  /* --- Floating Header --- */
  headerFloating: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  /* --- Floating Bottom Sheet --- */
  bottomSheetFloating: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 15,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  
  /* --- Driver Section --- */
  driverSection: {
    marginBottom: 20,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  driverInfoBlock: {
    flex: 1,
    marginLeft: 16,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  plateBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  plateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  /* --- Waiting State --- */
  waitingState: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  waitingText: {
    marginLeft: 12,
    color: colors.gray500,
    fontWeight: '600',
  },

  /* --- Verification Section --- */
  verificationContainer: {
    marginTop: 8,
  },
  toggleCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  toggleCodeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  qrCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 24,
    marginTop: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  qrInstruction: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 16,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  verificationCode: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  expiresText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});