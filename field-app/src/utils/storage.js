import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const setItemAsync = async (key, value) => {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  return await SecureStore.setItemAsync(key, value);
};

export const getItemAsync = async (key) => {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

export const deleteItemAsync = async (key) => {
  if (isWeb) {
    localStorage.removeItem(key);
    return;
  }
  return await SecureStore.deleteItemAsync(key);
};
