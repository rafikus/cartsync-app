import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { ListProvider } from './context/ListContext';
import { RootNavigator } from './navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ListProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </ListProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
