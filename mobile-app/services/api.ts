import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/api';

const api = axios.create({
  baseURL: API_CONFIG.API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let errorMessage = 'Something went wrong';

    if (error.response) {
      // Server responded with an error (e.g., 400, 500)
      errorMessage = error.response.data?.error || errorMessage;
    } else if (error.request) {
      // Request was made but no response was received (Server is down or ECONNRESET)
      errorMessage = 'Network error: Cannot reach the server';
    } else {
      errorMessage = error.message;
    }

    console.error('[API ERROR]:', errorMessage);
    return Promise.reject(errorMessage);
  }
);

export default api;