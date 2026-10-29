import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth';
import { router } from 'expo-router';

type User = {
  id: string;
  email: string;
  role: 'customer' | 'driver' | 'restaurant_manager';
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_image_url?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        
        // Verify token with backend
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser.data.user);
          await AsyncStorage.setItem('user', JSON.stringify(currentUser.data.user));
        } catch (error) {
          // Token might be expired
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('user');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    setUser(response.data.user);
    
    // Redirect based on role
    switch (response.data.user.role) {
      case 'customer':
        router.replace('/(customer)/home');
        break;
      case 'driver':
        router.replace('/(driver)/dashboard');
        break;
      case 'restaurant_manager':
        router.replace('/(manager)/dashboard');
        break;
    }
  };

  const register = async (data: any) => {
    const response = await authService.register(data);
    
    await AsyncStorage.setItem('token', response.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
    
    setUser(response.data.user);
    
    // Redirect based on role
    switch (response.data.user.role) {
      case 'customer':
        router.replace('/(customer)/home');
        break;
      case 'driver':
        router.replace('/(driver)/dashboard');
        break;
      case 'restaurant_manager':
        router.replace('/(manager)/dashboard');
        break;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
    router.replace('/(auth)/welcome');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}