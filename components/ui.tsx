// src/components/ui.tsx
// All small shared UI components in one file.
// Import what you need: import { Btn, Input, ... } from '../components/ui';

import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useColors, spacing, radius, text as textSizes } from '../theme';

// ── Btn ───────────────────────────────────────────────────────────────────────

interface BtnProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Btn({ label, onPress, variant = 'primary', loading, disabled, style }: BtnProps) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary'
          ? { backgroundColor: c.accent }
          : { backgroundColor: c.bgSurface, borderWidth: 0.5, borderColor: c.borderDefault },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? c.textOnAccent : c.accent} size={20} />
      ) : (
        <Text style={[styles.btnText, { color: variant === 'primary' ? c.textOnAccent : c.text }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────

export function Input(props: TextInputProps) {
  const c = useColors();
  return (
    <TextInput
      placeholderTextColor={c.textTertiary}
      {...props}
      style={[
        styles.input,
        { backgroundColor: c.bgSurface, borderColor: c.borderDefault, color: c.text },
        props.style,
      ]}
    />
  );
}

// ── Label ─────────────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: string }) {
  const c = useColors();
  return (
    <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>{children}</Text>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

export function Divider({ dashed }: { dashed?: boolean }) {
  const c = useColors();
  return (
    <View style={[styles.divider, { backgroundColor: c.borderDefault }, dashed && { opacity: 0.5 }]} />
  );
}

// ── Banner ────────────────────────────────────────────────────────────────────

export function Banner({ children, variant = 'accent' }: { children: string; variant?: 'accent' | 'success' }) {
  const c = useColors();
  const bg   = variant === 'accent' ? c.accentSubtle : c.success;
  const color = variant === 'accent' ? c.accentTextDark : c.successText;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Text style={{ fontSize: textSizes.xs, lineHeight: textSizes.xs * 1.7, color }}>{children}</Text>
    </View>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────────────────

export function Checkbox({ checked }: { checked: boolean }) {
  const c = useColors();
  return (
    <View style={[
      styles.checkbox,
      checked
        ? { backgroundColor: c.accent, borderColor: c.accent }
        : { borderColor: c.borderStrong },
    ]}>
      {checked && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>✓</Text>}
    </View>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────

export function Avatar({ initials, online, onPress }: { initials: string; online: boolean; onPress?: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.avatar, { backgroundColor: c.avatarBg }]}>
      <Text style={[styles.avatarText, { color: c.avatarText }]}>{initials}</Text>
      <View style={[styles.presenceDot, { borderColor: c.bgApp, backgroundColor: online ? c.syncLive : c.syncOffline }]} />
    </Pressable>
  );
}

// ── SyncIndicator ─────────────────────────────────────────────────────────────

export function SyncIndicator({ state }: { state: 'live' | 'pending' | 'offline' }) {
  const c = useColors();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (state === 'live') {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ]));
    } else if (state === 'pending') {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 400, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 400, useNativeDriver: true }),
      ]));
    }
    anim?.start();
    return () => { anim?.stop(); opacity.setValue(1); };
  }, [state]);

  const dotColor = state === 'live' ? c.syncLive : state === 'pending' ? c.syncPending : c.syncOffline;
  const label    = state === 'live' ? 'Live sync' : state === 'pending' ? 'Syncing…' : 'Offline';

  return (
    <View style={styles.syncRow}>
      <Animated.View style={[styles.syncDot, { backgroundColor: dotColor, opacity }]} />
      <Text style={{ fontSize: textSizes.xs, color: c.textTertiary }}>{label}</Text>
    </View>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.emptySub, { color: c.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  btnText: {
    position: 'absolute',
    fontSize: textSizes.md,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0.5,
    fontSize: textSizes.md,
  },
  sectionLabel: {
    fontSize: textSizes.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  divider: {
    height: 0.5,
    marginVertical: spacing.sm,
  },
  banner: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: textSizes.xs,
    fontWeight: '500',
  },
  presenceDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    gap: spacing.sm,
  },
  emptyIcon: { fontSize: 40, marginBottom: spacing.sm },
  emptyTitle: { fontSize: textSizes.lg, fontWeight: '500', textAlign: 'center' },
  emptySub:   { fontSize: textSizes.sm, textAlign: 'center', lineHeight: textSizes.sm * 1.6 },
});
