import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import OrderCard from '../../../components/customer/OrderCard';
import { colors } from '../../../constants/colors';
import { orderService } from '../../../services/order';
import { useAuth } from '../../../hooks/useAuth';

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  placed_at: string;
  restaurant_name: string;
  driver_first_name?: string;
  driver_last_name?: string;
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getMyOrders();
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return colors.success;
      case 'cancelled':
      case 'no_drivers_available':
        return colors.error;
      case 'pending':
      case 'accepted_by_driver':
        return colors.warning;
      default:
        return colors.info;
    }
  };

  const getStatusText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const filters = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Active' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const activeStatuses = ['accepted_by_driver', 'picked_up', 'on_the_way', 'arrived'];
  const activeOrders = orders.filter(order => activeStatuses.includes(order.status));

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={80} color={colors.gray300} />
      <Text style={styles.emptyTitle}>No orders yet</Text>
      <Text style={styles.emptySubtitle}>
        Your order history will appear here
      </Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => router.push('/(customer)/home')}
      >
        <Text style={styles.browseButtonText}>Browse Restaurants</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <TouchableOpacity>
          <Ionicons name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === item.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === item.key && styles.filterTextActive,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {activeOrders.length > 0 && selectedFilter !== 'delivered' && selectedFilter !== 'cancelled' ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeBannerTitle}>Active Delivery</Text>
          <Text style={styles.activeBannerText}>Track your active order live from here.</Text>
          <TouchableOpacity
            style={styles.activeBannerButton}
            onPress={() => router.push(`/(customer)/orders/tracking?id=${activeOrders[0].id}`)}
          >
            <Text style={styles.activeBannerButtonText}>Track Now</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(customer)/orders/${item.id}`)}
            >
              <OrderCard
                order={item}
                actionLabel={activeStatuses.includes(item.status) ? 'Track Order' : 'View Details'}
                onActionPress={activeStatuses.includes(item.status) ? () => router.push(`/(customer)/orders/tracking?id=${item.id}`) : undefined}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  browseButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activeBanner: {
    backgroundColor: '#fff8f1',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  activeBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  activeBannerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  activeBannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  activeBannerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});