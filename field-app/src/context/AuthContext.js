import React, { createContext, useState, useEffect, useContext } from 'react';
import * as storage from '../utils/storage';
import api from '../api/axios';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await storage.getItemAsync('userToken');
      const storedUser = await storage.getItemAsync('userData');
      
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.log('Error reading secure store', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = res.data.data;

      if (userData.role !== 'field_executive' && userData.role !== 'super_admin') {
        throw new Error('Access denied. Field Executives only.');
      }

      await storage.setItemAsync('userToken', accessToken);
      await storage.setItemAsync('userData', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    await storage.deleteItemAsync('userToken');
    await storage.deleteItemAsync('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
