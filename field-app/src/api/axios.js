import axios from 'axios';
import * as storage from '../utils/storage';

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the machine's IP address
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  // Using the verified LAN IP of this machine for mobile connectivity
  return 'http://192.168.1.78:5000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
