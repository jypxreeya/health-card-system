import axios from 'axios';
import * as storage from '../utils/storage';

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the machine's IP address dynamically for mobile devices
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  // Extract IP from debugger host (works for physical devices and emulators)
  const debuggerHost = Constants.expoConfig?.hostUri;
  const ip = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
  return `http://${ip}:5000/api`;
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
