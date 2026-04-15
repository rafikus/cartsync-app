// src/screens/SettingsScreen.tsx
import React from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParams } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { useList } from '../context/ListContext';
import { wsClient } from '../services/ws';
import { useColors, spacing, radius, text as textSizes } from '../theme';
import { Header } from '../components/Header';
import { Avatar, SectionLabel } from '../components/ui';

export function SettingsScreen({ navigation }: NativeStackScreenProps<AppStackParams, 'Settings'>) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { list, stores, syncState } = useList();

  const partner = list?.members.find((m) => m.id !== user?.id);

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: async () => {
        wsClient.disconnect();
        await logout();
      }},
    ]);
  };

  const shareCode = () => {
    if (list?.inviteCode) {
      Share.share({ message: `Join my CartSync list with code: ${list.inviteCode}` });
    }
  };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: c.bgApp }]}>
      <Header title="Settings" onBack={() => navigation.goBack()} syncState={syncState} />

      <ScrollView
        style={{ paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing['4xl'] }}
      >
        {/* List */}
        <SectionLabel>List</SectionLabel>
        <View style={[s.card, { backgroundColor: c.bgSurface, borderColor: c.borderDefault }]}>
          <Text style={[s.cardTitle, { color: c.text }]}>{list?.name ?? '–'}</Text>
          <Text style={[s.cardSub, { color: c.textTertiary }]}>List name</Text>
        </View>

        {/* Partner */}
        <SectionLabel>Partner</SectionLabel>
        {partner ? (
          <View style={[s.card, s.cardRow, { backgroundColor: c.bgSurface, borderColor: c.borderDefault }]}>
            <Avatar initials={partner.name[0].toUpperCase()} online={true} />
            <View>
              <Text style={[s.cardTitle, { color: c.text }]}>{partner.name}</Text>
              <Text style={[s.cardSub, { color: c.textTertiary }]}>Partner · online</Text>
            </View>
          </View>
        ) : (
          <View style={[s.card, { backgroundColor: c.bgSurface, borderColor: c.borderDefault }]}>
            <Text style={[s.cardSub, { color: c.textSecondary }]}>No partner yet</Text>
          </View>
        )}

        <View style={[s.card, { backgroundColor: c.bgSurface, borderColor: c.borderDefault }]}>
          <Text style={[s.cardTitle, { color: c.text }]}>Invite code</Text>
          <Text style={[s.cardSub, { color: c.textTertiary, marginBottom: spacing.md }]}>Share this to invite your partner</Text>
          <View style={[s.codeBox, { backgroundColor: c.bgSubtle, borderColor: c.borderDefault }]}>
            <Text style={[s.codeText, { color: c.text }]}>{list?.inviteCode ?? '–'}</Text>
          </View>
          <Pressable onPress={shareCode} style={[s.shareBtn, { backgroundColor: c.accent }]}>
            <Text style={{ color: '#fff', fontSize: textSizes.md, fontWeight: '500' }}>Share invite code</Text>
          </Pressable>
        </View>

        {/* Stores */}
        <SectionLabel>Stores</SectionLabel>
        {stores.length === 0 ? (
          <View style={[s.card, { backgroundColor: c.bgSurface, borderColor: c.borderDefault }]}>
            <Text style={[s.cardSub, { color: c.textSecondary }]}>No stores saved yet</Text>
          </View>
        ) : stores.map((store) => (
          <View key={store.id} style={[s.card, { backgroundColor: c.bgSurface, borderColor: c.borderDefault }]}>
            <Text style={[s.cardTitle, { color: c.text }]}>{store.name}</Text>
            <Text style={[s.cardSub, { color: c.textTertiary }]}>
              {store.tripCount} {store.tripCount === 1 ? 'trip' : 'trips'} · {store.tripCount >= 2 ? 'order learned' : 'still learning'}
            </Text>
          </View>
        ))}

        {/* Account */}
        <SectionLabel>Account</SectionLabel>
        <View style={[s.card, { backgroundColor: c.bgSurface, borderColor: c.borderDefault }]}>
          <Text style={[s.cardTitle, { color: c.text }]}>{user?.name}</Text>
          <Text style={[s.cardSub, { color: c.textTertiary }]}>{user?.email}</Text>
        </View>

        <View style={{ height: spacing.sm }} />
        <Pressable onPress={handleLogout} style={[s.card, { backgroundColor: c.bgSurface, borderColor: c.borderDefault }]}>
          <Text style={[s.cardTitle, { color: c.dangerText }]}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card:      { borderRadius: radius.lg, borderWidth: 0.5, padding: spacing.lg, marginBottom: spacing.sm },
  cardRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardTitle: { fontSize: textSizes.md, fontWeight: '500', marginBottom: 3 },
  cardSub:   { fontSize: textSizes.xs },
  codeBox:   { borderRadius: radius.md, borderWidth: 0.5, padding: spacing.md, alignItems: 'center', marginBottom: spacing.md },
  codeText:  { fontSize: textSizes['2xl'], fontWeight: '500', letterSpacing: 6 },
  shareBtn:  { borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
});
