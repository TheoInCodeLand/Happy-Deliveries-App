import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../components/common/Button';
import { colors } from '../../../constants/colors';
import { orderService } from '../../../services/order';

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
  delivered_at?: string;
  special_instructions?: string;
  delivery_instructions?: string;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  driver_first_name?: string;
  driver_last_name?: string;
  driver_phone?: string;
  driver_vehicle?: string;
  items: Array<{
    id: string;
    item_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    special_instructions?: string;
    selected_options?: any;
  }>;
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (id) {
  //     fetchOrderDetails();
  //   }
  // }, [id]);

  useEffect(() => {
    let isMounted = true; 

    const loadData = async () => {
      try {
        const data = await orderService.getOrder(id);
        if (isMounted) setOrder(data.data);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();
    const intervalId = setInterval(loadData, 5000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const data = await orderService.getOrder(id);
      setOrder(data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'ordered', label: 'Order Placed', icon: 'receipt' },
      { key: 'accepted', label: 'Driver Accepted', icon: 'person' },
      { key: 'preparing', label: 'Preparing', icon: 'restaurant' },
      { key: 'on_the_way', label: 'On the Way', icon: 'car' },
      { key: 'delivered', label: 'Delivered', icon: 'checkmark-circle' },
    ];

    const statusIndex: {[key: string]: number} = {
      'pending': 0,
      'accepted_by_driver': 1,
      'ordering_at_restaurant': 2,
      'order_ready': 2,
      'picked_up': 3,
      'on_the_way': 3,
      'arrived': 3,
      'delivered': 4,
      'cancelled': -1,
      'no_drivers_available': -1,
    };

    const currentIndex = statusIndex[order?.status || 'pending'] || 0;

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="receipt-outline" size={60} color={colors.gray400} />
          <Text style={styles.errorTitle}>Order not found</Text>
          <Button 
            title="Back to Orders"
            onPress={() => router.push('/(customer)/orders')}
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const statusSteps = getStatusSteps();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status Timeline */}
        <View style={styles.timelineContainer}>
          {statusSteps.map((step, index) => (
            <View key={step.key} style={styles.timelineStep}>
              <View style={styles.timelineLineContainer}>
                {index > 0 && (
                  <View style={[
                    styles.timelineLine,
                    step.completed ? styles.timelineLineActive : styles.timelineLineInactive,
                  ]} />
                )}
                <View style={[
                  styles.timelineDot,
                  step.completed ? styles.timelineDotActive : styles.timelineDotInactive,
                  step.current && styles.timelineDotCurrent,
                ]}>
                  <Ionicons 
                    name={step.icon as any} 
                    size={16} 
                    color={step.completed ? '#fff' : colors.gray400} 
                  />
                </View>
              </View>
              <Text style={[
                styles.timelineLabel,
                step.completed ? styles.timelineLabelActive : styles.timelineLabelInactive,
              ]}>
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items.map(item => (
            <View key={item.id} style={styles.orderItem}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                {/* FIX: Ensure number conversion */}
                <Text style={styles.itemPrice}>R {Number(item.total_price || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                {item.special_instructions && (
                  <Text style={styles.itemInstructions}>Note: {item.special_instructions}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="restaurant" size={20} color={colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Restaurant</Text>
              <Text style={styles.detailValue}>{order.restaurant_name}</Text>
              <Text style={styles.detailSubtext}>{order.restaurant_address}</Text>
              {order.restaurant_phone && (
                <Text style={styles.detailSubtext}>{order.restaurant_phone}</Text>
              )}
            </View>
          </View>

          {order.driver_first_name && (
            <View style={styles.detailRow}>
              <Ionicons name="person" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Driver</Text>
                <Text style={styles.detailValue}>
                  {order.driver_first_name} {order.driver_last_name}
                </Text>
                {order.driver_phone && (
                  <Text style={styles.detailSubtext}>{order.driver_phone}</Text>
                )}
                {order.driver_vehicle && (
                  <Text style={styles.detailSubtext}>{order.driver_vehicle}</Text>
                )}
              </View>
            </View>
          )}

          {order.delivery_instructions && (
            <View style={styles.detailRow}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Delivery Instructions</Text>
                <Text style={styles.detailValue}>{order.delivery_instructions}</Text>
              </View>
            </View>
          )}

          {order.special_instructions && (
            <View style={styles.detailRow}>
              <Ionicons name="clipboard" size={20} color={colors.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Special Instructions</Text>
                <Text style={styles.detailValue}>{order.special_instructions}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            {/* FIX: Ensure number conversion */}
            <Text style={styles.summaryValue}>R {Number(order.subtotal || 0).toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            {/* FIX: Ensure number conversion */}
            <Text style={styles.summaryValue}>R {Number(order.delivery_fee || 0).toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            {/* FIX: Ensure number conversion */}
            <Text style={styles.summaryValue}>R {Number(order.tax_amount || 0).toFixed(2)}</Text>
          </View>
          
          {Number(order.tip_amount) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tip</Text>
              <Text style={styles.summaryValue}>R {Number(order.tip_amount || 0).toFixed(2)}</Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            {/* FIX: Ensure number conversion */}
            <Text style={styles.totalValue}>R {Number(order.total_amount || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {['pending', 'accepted_by_driver', 'picked_up', 'on_the_way', 'arrived'].includes(order.status) && (
          <View style={styles.actionButtons}>
            <Button
              title={order.status === 'pending' ? 'Track Order' : 'View Live Tracking'}
              onPress={() => router.push(`/(customer)/orders/tracking?id=${order.id}`)}
              variant="primary"
              style={styles.actionButton}
            />
            {['pending', 'accepted_by_driver'].includes(order.status) && (
              <Button
                title="Cancel Order"
                onPress={() => {
                  // Handle cancel order
                }}
                variant="outline"
                style={styles.actionButton}
              />
            )}
          </View>
        )}

        {order.status === 'delivered' && (
          <View style={styles.actionButtons}>
            <Button
              title="Reorder"
              onPress={() => {
                // Handle reorder
              }}
              variant="primary"
              style={styles.actionButton}
            />
            <Button
              title="Rate Order"
              onPress={() => {
                // Handle rating
              }}
              variant="outline"
              style={styles.actionButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    color: colors.error,
    marginTop: 20,
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  timelineLineContainer: {
    alignItems: 'center',
    width: '100%',
  },
  timelineLine: {
    position: 'absolute',
    top: 12,
    left: -50,
    right: 50,
    height: 2,
  },
  timelineLineActive: {
    backgroundColor: colors.primary,
  },
  timelineLineInactive: {
    backgroundColor: colors.gray200,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
  },
  timelineDotInactive: {
    backgroundColor: colors.gray100,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  timelineDotCurrent: {
    borderWidth: 3,
    borderColor: colors.primary + '40',
  },
  timelineLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  timelineLabelActive: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  timelineLabelInactive: {
    color: colors.textTertiary,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  orderItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  itemDetails: {
    marginLeft: 8,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemInstructions: {
    fontSize: 14,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailSubtext: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionButtons: {
    padding: 20,
    backgroundColor: '#fff',
  },
  actionButton: {
    marginBottom: 12,
  },
});