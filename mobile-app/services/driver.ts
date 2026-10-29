import api from './api';

export const driverService = {
  async getStats() {
    return api.get('/drivers/stats');
  },

  async getAvailableOrders() {
    return api.get('/drivers/available-orders');
  },

  async getMyOrders() {
    return api.get('/drivers/orders');
  },

  async getOrder(orderId: string) {
    return api.get(`/orders/${orderId}`);
  },

  async acceptOrder(orderId: string) {
    return api.post(`/orders/${orderId}/accept`);
  },

  async declineOrder(orderId: string) {
    return api.post(`/orders/${orderId}/decline`);
  },

  async updateOrderStatus(orderId: string, status: string) {
    return api.patch(`/orders/${orderId}/status`, { status });
  },

  async verifyDeliveryCode(orderId: string, code: string) {
    return api.post(`/orders/${orderId}/verify-code`, { code });
  },

  async getEarningsSummary() {
    return api.get('/drivers/earnings/summary');
  },

  async getDailyEarnings(period: string = 'week') {
    return api.get(`/drivers/earnings/daily?period=${period}`);
  },

  async getProfile() {
    return api.get('/drivers/profile');
  },

  async updateProfile(data: any) {
    return api.put('/drivers/profile', data);
  },

  async updateStatus(status: string) {
    return api.put('/drivers/status', { status });
  },

  async updateLocation(lat: number, lng: number) {
    return api.put('/drivers/location', { lat, lng });
  },

  async getVehicleInfo() {
    return api.get('/drivers/vehicle');
  },

  async updateVehicleInfo(data: any) {
    return api.put('/drivers/vehicle', data);
  },
};