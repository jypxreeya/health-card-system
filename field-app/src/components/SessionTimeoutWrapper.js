import React, { useEffect, useRef } from 'react';
import { View, PanResponder, AppState } from 'react-native';
import { useAuth } from '../context/AuthContext';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const SessionTimeoutWrapper = ({ children }) => {
  const { user, logout } = useAuth();
  const timerId = useRef(null);
  const appState = useRef(AppState.currentState);

  const resetTimer = () => {
    if (timerId.current) clearTimeout(timerId.current);
    if (user) {
      timerId.current = setTimeout(() => {
        // Log out when timer expires
        logout();
      }, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    resetTimer();

    // Reset timer when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        resetTimer();
      }
      appState.current = nextAppState;
    });

    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      subscription.remove();
    };
  }, [user]); // Re-run when user logs in/out

  // Capture all touches
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
      onMoveShouldSetPanResponderCapture: () => {
        resetTimer();
        return false;
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

export default SessionTimeoutWrapper;
