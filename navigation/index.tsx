// src/navigation/index.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useList } from '../context/ListContext';
import { useColors } from '../theme';

import {
  SplashScreen,
  NewOrJoinScreen,
  RegisterScreen,
  LoginScreen,
  JoinScreen,
} from '../screens/AuthScreens';
import { ListScreen } from '../screens/ListScreen';
import {
  StartShoppingScreen,
  ShoppingScreen,
  TripCompleteScreen,
} from '../screens/ShoppingScreens';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { Store } from '../services/api';

// ── Route param types ─────────────────────────────────────────────────────────

export type AuthStackParams = {
  Splash:    undefined;
  NewOrJoin: undefined;
  Register:  undefined;
  Login:     undefined;
  Join:      undefined;
};

export type AppStackParams = {
  List:          undefined;
  StartShopping: undefined;
  Shopping:      { store: Store | null };
  TripComplete:  { tripId: string };
  Settings:      undefined;
};

// ── Stacks ────────────────────────────────────────────────────────────────────

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const AppStack  = createNativeStackNavigator<AppStackParams>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Splash"    component={SplashScreen} />
      <AuthStack.Screen name="NewOrJoin" component={NewOrJoinScreen} />
      <AuthStack.Screen name="Register"  component={RegisterScreen} />
      <AuthStack.Screen name="Login"     component={LoginScreen} />
      <AuthStack.Screen name="Join"      component={JoinScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  const { user } = useAuth();
  const { loadList } = useList();

  // Load the user's first list automatically after login
  useEffect(() => {
    const firstListId = user?.listIds?.[0];
    if (firstListId) {
      loadList(firstListId);
    }
  }, [user]);

  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="List"          component={ListScreen} />
      <AppStack.Screen name="StartShopping" component={StartShoppingScreen} />
      <AppStack.Screen name="Shopping"      component={ShoppingScreen} />
      <AppStack.Screen name="TripComplete"  component={TripCompleteScreen} />
      <AppStack.Screen name="Settings"      component={SettingsScreen} />
    </AppStack.Navigator>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function RootNavigator() {
  const { user, loading } = useAuth();
  const c = useColors();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bgApp }}>
        <ActivityIndicator color={c.accent} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
