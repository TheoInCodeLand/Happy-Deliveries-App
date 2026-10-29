import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar as RNStatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Searchbar, Surface, Avatar, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Hooks & Services
import { useLocation } from '../../../hooks/useLocation'; //
import { useAuth } from '../../../hooks/useAuth'; //
import { restaurantService } from '../../../services/restaurant'; //

// Constants & Theme
import { colors } from '../../../constants/colors'; //
import { shadows, spacing, typography } from '../../../constants/theme'; //

const { width } = Dimensions.get('window');

// --- Types ---
type Restaurant = {
  id: string;
  name: string;
  description: string;
  cuisine_type: string[];
  cover_image_url: string;
  preparation_time_minutes: number;
  average_rating?: number;
  total_ratings?: number;
};

type MenuItem = {
  id: string;
  name: string;
  restaurant_name: string;
  price: number;
  discounted_price: number;
  image_url: string;
  restaurant_id: string;
};

type MenuCategory = {
  id: string;
  name: string;
  restaurant_name: string;
};

export default function CustomerHomeScreen() {
  const router = useRouter(); //
  const { location } = useLocation(); //
  const { user } = useAuth(); //
  
  // --- State ---
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [popularRestaurants, setPopularRestaurants] = useState<Restaurant[]>([]);
  const [menus, setMenus] = useState<MenuCategory[]>([]);
  const [discounts, setDiscounts] = useState<MenuItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleRestaurantSearch = () => {
    const trimmedSearch = searchQuery.trim();
    if (trimmedSearch.length > 0) {
      router.push(`/(customer)/search?query=${encodeURIComponent(trimmedSearch)}`);
    } else {
      router.push(`/(customer)/search`);
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (location) {
      fetchAllData();
    }
  }, [location]); //

  // --- Data Fetching ---
  const fetchAllData = async () => {
    if (!location) return; //

    try {
      setLoading(true); //
      
      const [feedResponse, searchResponse] = await Promise.all([
        restaurantService.getHomeFeed(), //
        restaurantService.searchRestaurants(
          location.coords.latitude,
          location.coords.longitude,
          { maxDistance: 10 }
        ), //
      ]);

      // 1. Handle Home Feed (Menus & Items)
      const feedData = feedResponse?.data;
      if (feedData?.success) { //
        const menuData = feedData.data?.menus || []; //
        const itemData = feedData.data?.discounts || []; //
        
        setMenus(menuData);
        setDiscounts(itemData);

        console.log(`[DATA FETCH]: Retrieved ${menuData.length} Menu Categories.`); //
        console.log(`[DATA FETCH]: Retrieved ${itemData.length} Menu Items.`); //
      }

      // 2. Handle Restaurant Data
      let restaurantData: any[] = [];
      const searchData = searchResponse?.data;
      if (searchData && Array.isArray(searchData)) {
        restaurantData = searchData;
      }

      console.log(`[DATA FETCH]: Retrieved ${restaurantData.length} Nearby Restaurants.`); //
      setRestaurants(restaurantData);
      
      setPopularRestaurants(
        restaurantData.filter((r: any) => (r.total_ratings || 0) > 0).slice(0, 5)
      ); //

    } catch (error) {
      console.error('[DATA FETCH] Critical Error:', error); //
    } finally {
      setLoading(false); //
      setRefreshing(false); //
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
  };

  // --- Render Helpers ---

  const renderCategory = ({ item }: { item: MenuCategory }) => (
    <TouchableOpacity style={styles.categoryCard} activeOpacity={0.7}>
      <Surface style={styles.categoryIconContainer}>
         <FontAwesome5 name="utensils" size={20} color={colors.primary} />
      </Surface>
      <Text style={styles.categoryTitle} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderRestaurantCard = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push(`/(customer)/home/restaurant-details?id=${item.id}`)} //
      style={styles.cardContainer}
    >
      <Surface style={styles.restaurantCard}>
        <Image 
          source={{ uri: item.cover_image_url || 'https://via.placeholder.com/300' }} 
          style={styles.cardImage} 
        />
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={14} color="#FFC107" />
          <Text style={styles.ratingText}>{item.average_rating || 'New'}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.cardMeta}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.metaText}> {item.preparation_time_minutes} min</Text>
            <Text style={styles.metaSeparator}> • </Text>
            <Text style={styles.metaText}>{item.cuisine_type?.[0] || 'Food'}</Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderDealCard = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push(`/(customer)/home/restaurant-details?id=${item.restaurant_id}`)} //
      style={styles.dealContainer}
    >
      <Surface style={styles.dealCard}>
        <Image 
          source={{ uri: item.image_url || 'https://via.placeholder.com/150' }} 
          style={styles.dealImage} 
        />
        {item.discounted_price < item.price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              -{Math.round(((item.price - item.discounted_price) / item.price) * 100)}%
            </Text>
          </View>
        )}
        <View style={styles.dealContent}>
          <Text style={styles.dealTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.dealRestaurant} numberOfLines={1}>{item.restaurant_name}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.newPrice}>${item.discounted_price || item.price}</Text>
            {item.discounted_price && <Text style={styles.oldPrice}>${item.price}</Text>}
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Preparing your kitchen...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <RNStatusBar barStyle="dark-content" />
      
      {/* 1. Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.locationBlock}>
          <Text style={styles.deliveryLabel}>DELIVERING TO</Text>
          <TouchableOpacity style={styles.addressRow} activeOpacity={0.6}>
             <Ionicons name="location" size={18} color={colors.primary} />
             <Text style={styles.addressText} numberOfLines={1}>
               Current Location
             </Text>
             <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/(customer)/profile')}
        >
          <Avatar.Image 
            size={45} 
            source={{ uri: 'https://i.pravatar.cc/150' }} // Standard mock, replace with user.profile_image_url
            style={{ backgroundColor: colors.gray100 }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* 2. Modern Search Bar */}
        <View style={styles.searchSection}>
          <Searchbar
            placeholder="Search food, restaurants..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={colors.gray400}
            placeholderTextColor={colors.gray400}
            elevation={0}
            onSubmitEditing={handleRestaurantSearch}
            onIconPress={handleRestaurantSearch}
          />
        </View>

        {/* 3. Horizontal Categories */}
        {menus.length > 0 && (
          <View style={styles.section}>
            <FlatList
              horizontal
              data={menus}
              renderItem={renderCategory}
              keyExtractor={item => `cat-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* 4. Impactful Promo Banner */}
        <View style={styles.bannerSection}>
          <Surface style={styles.banner}>
            <View style={styles.bannerContent}>
              <View style={styles.promoTag}>
                <Text style={styles.promoTagText}>LIMITED TIME</Text>
              </View>
              <Text style={styles.bannerTitle}>30% OFF</Text>
              <Text style={styles.bannerSubtitle}>On your first 3 orders!</Text>
              <TouchableOpacity style={styles.bannerBtn}>
                <Text style={styles.bannerBtnText}>Claim Now</Text>
              </TouchableOpacity>
            </View>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=500' }} 
              style={styles.bannerImage} 
            />
          </Surface>
        </View>

        {/* 5. Stores Nearby Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stores Nearby</Text>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        {restaurants.length > 0 ? (
          <FlatList
            horizontal
            data={restaurants}
            renderItem={renderRestaurantCard}
            keyExtractor={item => `near-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        ) : (
          <View style={styles.emptyState}>
             <MaterialCommunityIcons name="store-off-outline" size={48} color={colors.gray300} />
            <Text style={styles.emptyStateText}>No stores found in this radius</Text>
          </View>
        )}

        {/* 6. Trending Deals Section */}
        {discounts.length > 0 && (
          <View style={styles.mt24}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Deals</Text>
              <TouchableOpacity activeOpacity={0.6}>
                <Text style={styles.seeAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={discounts}
              renderItem={renderDealCard}
              keyExtractor={item => `deal-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          </View>
        )}

        {/* 7. Popular Choice Section */}
        {popularRestaurants.length > 0 && (
          <View style={styles.mt24}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Choice</Text>
            </View>
            <FlatList
              horizontal
              data={popularRestaurants}
              renderItem={renderRestaurantCard}
              keyExtractor={item => `pop-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
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
    backgroundColor: colors.white, // Updated to clean white background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    ...typography.body2,
  },
  mt24: { marginTop: 24 },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  locationBlock: { flex: 1 },
  deliveryLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: colors.gray400,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  addressRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  addressText: { 
    fontWeight: '700', 
    fontSize: 15, 
    marginHorizontal: 4, 
    color: colors.textPrimary 
  },
  profileButton: {
    ...shadows.small,
    borderRadius: 25,
  },

  // Search
  searchSection: { 
    paddingHorizontal: spacing.md, 
    marginVertical: spacing.md 
  },
  searchBar: { 
    backgroundColor: colors.gray50, 
    borderRadius: 16, 
    height: 52,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  searchInput: { 
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Categories
  section: { marginBottom: spacing.md },
  categoryCard: { 
    alignItems: 'center', 
    marginRight: 20, 
    width: 75 
  },
  categoryIconContainer: {
    width: 64, 
    height: 64, 
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 8,
    ...shadows.small,
    borderWidth: 1,
    borderColor: colors.gray50,
  },
  categoryTitle: { 
    fontSize: 12, 
    fontWeight: '600',
    color: colors.textSecondary, 
    textAlign: 'center' 
  },

  // Banner
  bannerSection: { 
    paddingHorizontal: spacing.md, 
    marginBottom: spacing.lg 
  },
  banner: {
    height: 160,
    backgroundColor: colors.primary, 
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.medium,
  },
  bannerContent: { 
    flex: 1.2, 
    padding: 20, 
    justifyContent: 'center', 
    zIndex: 2 
  },
  promoTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  promoTagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
  bannerTitle: { 
    color: colors.white, 
    fontSize: 28, 
    fontWeight: '900', 
    lineHeight: 32 
  },
  bannerSubtitle: { 
    color: 'rgba(255,255,255,0.85)', 
    fontSize: 13, 
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16 
  },
  bannerBtn: { 
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  bannerBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  bannerImage: { 
    flex: 0.8,
    height: '100%', 
    resizeMode: 'cover',
    opacity: 0.9,
  },

  // Sections Common
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: spacing.md, 
    marginBottom: 16,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: colors.textPrimary 
  },
  seeAllText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  horizontalList: { 
    paddingHorizontal: spacing.md, 
    gap: 16 
  },

  // Restaurant Card
  cardContainer: { 
    marginBottom: 4 
  },
  restaurantCard: {
    width: 260,
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: 'hidden',
    ...shadows.medium,
    borderWidth: 1,
    borderColor: colors.gray50,
  },
  cardImage: { 
    width: '100%', 
    height: 150, 
    resizeMode: 'cover' 
  },
  ratingBadge: {
    position: 'absolute', 
    top: 12, 
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)', 
    borderRadius: 12,
    paddingHorizontal: 8, 
    paddingVertical: 4,
    flexDirection: 'row', 
    alignItems: 'center',
    ...shadows.small
  },
  ratingText: { 
    fontSize: 13, 
    fontWeight: '800', 
    marginLeft: 4,
    color: colors.textPrimary 
  },
  cardContent: { padding: 16 },
  cardTitle: { 
    fontWeight: '800', 
    fontSize: 17, 
    marginBottom: 6,
    color: colors.textPrimary 
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  metaSeparator: { color: colors.gray300, fontWeight: '900' },

  // Deal Card
  dealContainer: { 
    marginBottom: 4 
  },
  dealCard: {
    width: 170,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 12,
    ...shadows.small,
    borderWidth: 1,
    borderColor: colors.gray50,
  },
  dealImage: { 
    width: '100%', 
    height: 110, 
    borderRadius: 16, 
    marginBottom: 12 
  },
  discountBadge: {
    position: 'absolute', 
    top: 8, 
    left: 8,
    backgroundColor: colors.error,
    borderRadius: 8,
    paddingHorizontal: 6, 
    paddingVertical: 4
  },
  discountText: { 
    color: colors.white, 
    fontSize: 11, 
    fontWeight: '900' 
  },
  dealContent: {
    gap: 2,
  },
  dealTitle: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: colors.textPrimary 
  },
  dealRestaurant: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  newPrice: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: colors.success 
  },
  oldPrice: { 
    fontSize: 12, 
    textDecorationLine: 'line-through', 
    color: colors.gray400,
    fontWeight: '600'
  },
  emptyState: { 
    padding: 40, 
    alignItems: 'center',
    width: width - 32,
    backgroundColor: colors.gray50,
    borderRadius: 24,
    marginHorizontal: 16,
  },
  emptyStateText: {
    marginTop: 12,
    color: colors.gray400,
    fontWeight: '600',
    fontSize: 14,
  }
});