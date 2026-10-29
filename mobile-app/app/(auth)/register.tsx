import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';

type UserRole = 'customer' | 'driver' | 'restaurant_manager';

export default function RegisterScreen() {
  const params = useLocalSearchParams();
  const { register } = useAuth();
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>((params.role as UserRole) || 'customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Common user data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });
  
  // Role-specific data
  const [customerData, setCustomerData] = useState({
    deliveryAddress: '',
  });
  
  const [driverData, setDriverData] = useState({
    driverLicense: '',
    vehicleType: '',
    vehicleModel: '',
    vehicleColor: '',
    vehicleRegistration: '',
  });
  
  const [managerData, setManagerData] = useState({
    restaurantName: '',
    restaurantAddress: '',
  });

  // Update role from URL params
  useEffect(() => {
    if (params.role) {
      setRole(params.role as UserRole);
    }
  }, [params.role]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleCustomerDataChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleDriverDataChange = (field: string, value: string) => {
    setDriverData(prev => ({ ...prev, [field]: value }));
  };

  const handleManagerDataChange = (field: string, value: string) => {
    setManagerData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const { email, password, confirmPassword, firstName, lastName, phoneNumber } = formData;
    
    if (!email || !password || !confirmPassword || !firstName || !lastName || !phoneNumber) {
      setError('All fields are required');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (!/^[\+]?[1-9][\d]{0,15}$/.test(phoneNumber.replace(/\D/g, ''))) {
      setError('Please enter a valid phone number');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    switch (role) {
      case 'customer':
        if (!customerData.deliveryAddress) {
          setError('Delivery address is required');
          return false;
        }
        break;
      case 'driver':
        if (!driverData.driverLicense || !driverData.vehicleType || !driverData.vehicleModel || 
            !driverData.vehicleColor || !driverData.vehicleRegistration) {
          setError('All driver information is required');
          return false;
        }
        break;
      case 'restaurant_manager':
        if (!managerData.restaurantName || !managerData.restaurantAddress) {
          setError('Restaurant name and address are required');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
        setError('');
      }
    } else {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep(1);
      setError('');
    }
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    setError('');

    try {
      // Prepare registration data
      const registrationData = {
        email: formData.email,
        password: formData.password,
        role,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber,
        ...(role === 'customer' && {
          delivery_addresses: [{
            label: 'Home',
            address: customerData.deliveryAddress,
            is_default: true,
          }],
        }),
        ...(role === 'driver' && driverData),
        ...(role === 'restaurant_manager' && managerData),
      };

      await register(registrationData);
      // Registration successful - navigation is handled in useAuth hook
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'customer': return 'Customer';
      case 'driver': return 'Driver';
      case 'restaurant_manager': return 'Restaurant Manager';
      default: return '';
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'customer': return 'Order food from your favorite restaurants';
      case 'driver': return 'Deliver orders and earn money';
      case 'restaurant_manager': return 'Manage your restaurant and menus';
      default: return '';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'customer': return 'person';
      case 'driver': return 'car';
      case 'restaurant_manager': return 'restaurant';
      default: return 'person';
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join as {getRoleTitle().toLowerCase()}</Text>
      </View>

      <View style={styles.roleDisplay}>
        <View style={styles.roleIconContainer}>
          <Ionicons name={getRoleIcon()} size={24} color={colors.primary} />
        </View>
        <View style={styles.roleInfo}>
          <Text style={styles.roleTitle}>{getRoleTitle()}</Text>
          <Text style={styles.roleDescription}>{getRoleDescription()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.changeRoleButton}
          onPress={() => router.push('/(auth)/welcome')}
        >
          <Text style={styles.changeRoleText}>Change</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.nameRow}>
          <Input
            label="First Name"
            placeholder="John"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
            containerStyle={styles.halfInput}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
            containerStyle={styles.halfInput}
          />
        </View>

        <Input
          label="Email Address"
          placeholder="you@example.com"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Phone Number"
          placeholder="+1 234 567 8900"
          value={formData.phoneNumber}
          onChangeText={(value) => handleInputChange('phoneNumber', value)}
          keyboardType="phone-pad"
        />

        <Input
          label="Password"
          placeholder="••••••••"
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
          secureTextEntry
        />

        <Input
          label="Confirm Password"
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange('confirmPassword', value)}
          secureTextEntry
        />
      </View>
    </>
  );

  const renderStep2 = () => {
    switch (role) {
      case 'customer':
        return (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Delivery Address</Text>
              <Text style={styles.subtitle}>Where should we deliver your orders?</Text>
            </View>

            <View style={styles.form}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label="Delivery Address"
                placeholder="123 Main Street, Apt 4B, City, State 12345"
                value={customerData.deliveryAddress}
                onChangeText={(value) => handleCustomerDataChange('deliveryAddress', value)}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              <View style={styles.noteContainer}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={styles.noteText}>
                  You can add more addresses later in your profile settings
                </Text>
              </View>
            </View>
          </>
        );

      case 'driver':
        return (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Driver Information</Text>
              <Text style={styles.subtitle}>Tell us about your vehicle</Text>
            </View>

            <View style={styles.form}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label="Driver's License Number"
                placeholder="DL12345678"
                value={driverData.driverLicense}
                onChangeText={(value) => handleDriverDataChange('driverLicense', value)}
              />

              <Input
                label="Vehicle Type"
                placeholder="Motorcycle, Car, Bicycle, etc."
                value={driverData.vehicleType}
                onChangeText={(value) => handleDriverDataChange('vehicleType', value)}
              />

              <View style={styles.nameRow}>
                <Input
                  label="Vehicle Model"
                  placeholder="Honda Civic"
                  value={driverData.vehicleModel}
                  onChangeText={(value) => handleDriverDataChange('vehicleModel', value)}
                  containerStyle={styles.halfInput}
                />
                <Input
                  label="Vehicle Color"
                  placeholder="Red"
                  value={driverData.vehicleColor}
                  onChangeText={(value) => handleDriverDataChange('vehicleColor', value)}
                  containerStyle={styles.halfInput}
                />
              </View>

              <Input
                label="Vehicle Registration"
                placeholder="ABC-123"
                value={driverData.vehicleRegistration}
                onChangeText={(value) => handleDriverDataChange('vehicleRegistration', value)}
              />

              <View style={styles.noteContainer}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={styles.noteText}>
                  This information is required for verification and safety purposes
                </Text>
              </View>
            </View>
          </>
        );

      case 'restaurant_manager':
        return (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Restaurant Information</Text>
              <Text style={styles.subtitle}>Tell us about your restaurant</Text>
            </View>

            <View style={styles.form}>
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Input
                label="Restaurant Name"
                placeholder="Pizza Palace"
                value={managerData.restaurantName}
                onChangeText={(value) => handleManagerDataChange('restaurantName', value)}
              />

              <Input
                label="Restaurant Address"
                placeholder="123 Main Street, City, State 12345"
                value={managerData.restaurantAddress}
                onChangeText={(value) => handleManagerDataChange('restaurantAddress', value)}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              <View style={styles.noteContainer}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={styles.noteText}>
                  You can add more restaurants and menu items after registration
                </Text>
              </View>
            </View>
          </>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Progress Steps */}
          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={[styles.stepCircle, step >= 1 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                <Text style={[styles.stepNumber, step >= 1 ? styles.stepNumberActive : styles.stepNumberInactive]}>
                  1
                </Text>
              </View>
              <Text style={[styles.stepLabel, step >= 1 ? styles.stepLabelActive : styles.stepLabelInactive]}>
                Account
              </Text>
            </View>
            
            <View style={[styles.stepLine, step >= 2 ? styles.stepLineActive : styles.stepLineInactive]} />
            
            <View style={styles.step}>
              <View style={[styles.stepCircle, step >= 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                <Text style={[styles.stepNumber, step >= 2 ? styles.stepNumberActive : styles.stepNumberInactive]}>
                  2
                </Text>
              </View>
              <Text style={[styles.stepLabel, step >= 2 ? styles.stepLabelActive : styles.stepLabelInactive]}>
                {role === 'customer' ? 'Address' : role === 'driver' ? 'Vehicle' : 'Restaurant'}
              </Text>
            </View>
          </View>

          {step === 1 ? renderStep1() : renderStep2()}

          <View style={styles.buttonContainer}>
            <Button
              title={step === 1 ? "Next" : "Create Account"}
              onPress={handleNext}
              loading={loading}
              disabled={loading}
              style={styles.primaryButton}
            />
            
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              style={styles.secondaryButton}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  step: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
  },
  stepCircleInactive: {
    backgroundColor: colors.gray200,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepNumberInactive: {
    color: colors.gray600,
  },
  stepLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '500',
  },
  stepLabelInactive: {
    color: colors.gray500,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 10,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepLineInactive: {
    backgroundColor: colors.gray200,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
  roleDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  roleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  changeRoleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeRoleText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  form: {
    gap: 20,
    marginBottom: 40,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 16,
  },
  halfInput: {
    flex: 1,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.infoLight,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.info,
  },
  noteText: {
    fontSize: 14,
    color: colors.infoDark,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 40,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    color: colors.gray600,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});