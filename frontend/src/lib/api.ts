import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor to add authentication token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      // You might want to redirect to login page here
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions for plant lots
export const lotAPI = {
  // Get all lots with pagination and filters
  getLots: async (params?: {
    page?: number;
    limit?: number;
    zone?: string;
    healthStatus?: string;
    speciesId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/lots', { params });
    return response.data;
  },

  // Get single lot by ID
  getLot: async (id: string) => {
    const response = await api.get(`/lots/${id}`);
    return response.data;
  },

  // Create new lot
  createLot: async (lotData: any) => {
    const response = await api.post('/lots', lotData);
    return response.data;
  },

  // Update lot
  updateLot: async (id: string, updates: any) => {
    const response = await api.put(`/lots/${id}`, updates);
    return response.data;
  },

  // Delete lot
  deleteLot: async (id: string) => {
    const response = await api.delete(`/lots/${id}`);
    return response.data;
  },

  // Get lot statistics
  getStats: async () => {
    const response = await api.get('/lots/stats');
    return response.data;
  }
};

// API functions for QR codes
export const qrAPI = {
  // Generate QR code for lot
  generateLotQR: async (lotId: string, params?: {
    format?: 'base64' | 'png';
    size?: number;
  }) => {
    const response = await api.get(`/qr/lot/${lotId}`, { params });
    return response.data;
  },

  // Generate QR code for lot info page
  generateLotInfoQR: async (lotId: string, params?: {
    format?: 'base64' | 'png';
    size?: number;
  }) => {
    const response = await api.get(`/qr/lot/${lotId}/info`, { params });
    return response.data;
  },

  // Generate batch QR codes
  generateBatchQR: async (lotIds: string[], params?: {
    format?: 'base64' | 'png';
    size?: number;
  }) => {
    const response = await api.post('/qr/lots/batch', {
      lotIds,
      ...params
    });
    return response.data;
  },

  // Get QR statistics
  getQRStats: async () => {
    const response = await api.get('/qr/stats');
    return response.data;
  }
};

// API functions for authentication
export const authAPI = {
  // Login user
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Register user
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  }
};

export default api;
