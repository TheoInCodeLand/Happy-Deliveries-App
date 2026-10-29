import api from './api';

export const authService = {
  async register(data: {
    email: string;
    password: string;
    role: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    [key: string]: any;
  }) {
    return api.post('/auth/register', data);
  },

  async login(email: string, password: string) {
    return api.post('/auth/login', { email, password });
  },

  async getCurrentUser() {
    return api.get('/auth/me');
  },

  async updateProfile(data: any) {
    return api.put('/users/profile', data);
  },

  async logout() {
    // Clear local storage is handled in useAuth hook
    return Promise.resolve();
  },
};