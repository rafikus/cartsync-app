// src/components/Header.tsx
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors, spacing, radius, text as textSizes } from "../theme";
import { Avatar, SyncIndicator } from "./ui";
import type { SyncState } from "../context/ListContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  partner?: { initials: string; online: boolean };
  onPartnerPress?: () => void;
  badge?: string;
  syncState?: SyncState;
}

export function Header({
  title,
  subtitle,
  onBack,
  partner,
  onPartnerPress,
  badge,
  syncState = "offline",
}: HeaderProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: c.bgSurface, paddingTop: insets.top + spacing.sm },
      ]}
    >
      {/* Status row */}
      <View style={styles.statusRow}>
        <SyncIndicator state={syncState} />
      </View>

      {/* Main row */}
      <View style={styles.mainRow}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={[
              styles.backBtn,
              { backgroundColor: c.bgSubtle, borderColor: c.borderDefault },
            ]}
          >
            <Text style={[styles.backArrow, { color: c.textSecondary }]}>
              ‹
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, { color: c.textSecondary }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightSlot}>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: c.success }]}>
              <Text style={[styles.badgeText, { color: c.successText }]}>
                {badge}
              </Text>
            </View>
          ) : null}
          {partner ? (
            <Avatar
              initials={partner.initials}
              online={partner.online}
              onPress={onPartnerPress}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  statusRow: { marginBottom: spacing.md },
  mainRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  backArrow: { fontSize: 20, marginTop: -1 },
  backPlaceholder: { width: 30 },
  titleBlock: { flex: 1, minWidth: 0 },
  title: {
    fontSize: textSizes["2xl"],
    fontWeight: "500",
    lineHeight: textSizes["2xl"] * 1.2,
  },
  subtitle: { fontSize: textSizes.sm, marginTop: 2 },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 0,
    paddingTop: 3,
  },
  badge: {
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  badgeText: { fontSize: textSizes.xs, fontWeight: "500" },
});
