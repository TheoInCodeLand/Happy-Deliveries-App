import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="fast-food" size={80} color={colors.primary} />
          </View>
          <Text style={styles.title}>HappyDeliveries</Text>
          <Text style={styles.subtitle}>
            Food delivery at your fingertips
          </Text>
        </View>
        
        <View style={styles.roleSelection}>
          <Text style={styles.roleTitle}>Join as:</Text>
          
          <Link href="/(auth)/register?role=customer" asChild>
            <TouchableOpacity style={styles.roleCard}>
              <View style={styles.roleIcon}>
                <Ionicons name="person" size={28} color={colors.primary} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>Customer</Text>
                <Text style={styles.roleDescription}>
                  Order food from your favorite restaurants
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
            </TouchableOpacity>
          </Link>
          
          <Link href="/(auth)/register?role=driver" asChild>
            <TouchableOpacity style={styles.roleCard}>
              <View style={styles.roleIcon}>
                <Ionicons name="car" size={28} color={colors.primary} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>Driver</Text>
                <Text style={styles.roleDescription}>
                  Deliver orders and earn money
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
            </TouchableOpacity>
          </Link>
          
          <Link href="/(auth)/register?role=restaurant_manager" asChild>
            <TouchableOpacity style={styles.roleCard}>
              <View style={styles.roleIcon}>
                <Ionicons name="restaurant" size={28} color={colors.primary} />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>Restaurant Manager</Text>
                <Text style={styles.roleDescription}>
                  Manage your restaurant and menus
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
            </TouchableOpacity>
          </Link>
        </View>
        
        <View style={styles.bottomSection}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.loginButton}>
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/(customer)/home" asChild>
            <TouchableOpacity style={styles.guestButton}>
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center', // Centers content vertically if screen is tall
    paddingBottom: 40, // Adds breathing room at the bottom for scrolling
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04, // Responsive margin (approx 4% of screen height)
    marginTop: height * 0.02,
  },
  logoCircle: {
    width: 100, // Slightly smaller to be safer on small screens
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28, // Slightly reduced from 32 to prevent wrapping on narrow screens
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
  roleSelection: {
    marginBottom: height * 0.04,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  roleIcon: {
    width: 44, // Slightly smaller
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  bottomSection: {
    alignItems: 'center',
    marginTop: 'auto', // Pushes to bottom if there is space left
  },
  loginText: {
    fontSize: 15,
    color: colors.gray600,
    marginBottom: 12,
  },
  loginButton: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: 16, // Reduced slightly for better fit
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    width: '100%',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  guestButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});