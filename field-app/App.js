import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import SessionTimeoutWrapper from './src/components/SessionTimeoutWrapper';
import { initDb } from './src/api/database';

export default function App() {
  useEffect(() => {
    initDb();
  }, []);
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SessionTimeoutWrapper>
          <AppNavigator />
        </SessionTimeoutWrapper>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
