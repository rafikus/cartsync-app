// src/screens/ShoppingScreens.tsx
import React, { useRef, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParams } from "../navigation";
import { useList } from "../context/ListContext";
import { storesApi, tripsApi } from "../services/api";
import type { Store, ListItem } from "../services/api";
import { useColors, spacing, radius, text as textSizes } from "../theme";
import { Header } from "../components/Header";
import { Banner, Btn, Checkbox, Divider, SectionLabel } from "../components/ui";

// ── StartShoppingScreen ───────────────────────────────────────────────────────

export function StartShoppingScreen({
  navigation,
}: NativeStackScreenProps<AppStackParams, "StartShopping">) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { list, stores, loadList } = useList();
  const [selected, setSelected] = useState<Store | null>(stores[0] ?? null);
  const [newName, setNewName] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [creating, setCreating] = useState(false);

  const createStore = async () => {
    if (!newName.trim() || !list) return;
    setCreating(true);
    try {
      const store = await storesApi.create(list.id, newName.trim());
      setSelected(store);
      setAddingNew(false);
      setNewName("");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      loadList(list.id);
      setCreating(false);
    }
  };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: c.bgApp }]}>
      <Header title="Start shopping" onBack={() => navigation.goBack()} />

      <ScrollView
        style={{ paddingHorizontal: spacing.lg }}
        contentContainerStyle={{ paddingBottom: spacing["4xl"] }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            { fontSize: textSizes.sm, marginBottom: spacing.lg },
            { color: c.textSecondary },
          ]}
        >
          Which store are you in?
        </Text>

        <SectionLabel>Your stores</SectionLabel>

        {stores.map((store) => {
          const isSelected = selected?.id === store.id;
          const isLearned = store.tripCount >= 2;
          return (
            <Pressable
              key={store.id}
              onPress={() => setSelected(store)}
              style={[
                s.storeOption,
                {
                  backgroundColor: c.bgSurface,
                  borderColor: isSelected ? c.accent : c.borderDefault,
                  borderWidth: isSelected ? 1.5 : 0.5,
                },
              ]}
            >
              <View
                style={[
                  s.radio,
                  {
                    borderColor: isSelected ? c.accent : c.borderStrong,
                    backgroundColor: isSelected ? c.accent : "transparent",
                  },
                ]}
              >
                {isSelected && <View style={s.radioDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    { fontSize: textSizes.md, fontWeight: "500" },
                    { color: c.text },
                  ]}
                >
                  {store.name}
                </Text>
                <Text
                  style={[
                    { fontSize: textSizes.xs, marginTop: 2 },
                    { color: c.textTertiary },
                  ]}
                >
                  {store.tripCount} {store.tripCount === 1 ? "trip" : "trips"} ·{" "}
                  {isLearned ? "order learned" : "still learning"}
                </Text>
              </View>
              <View
                style={[
                  s.storeBadge,
                  { backgroundColor: isLearned ? c.success : c.bgSubtle },
                ]}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "500",
                    color: isLearned ? c.successText : c.textSecondary,
                  }}
                >
                  {isLearned ? "Learned" : "Learning"}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {addingNew ? (
          <View
            style={[
              s.storeOption,
              {
                backgroundColor: c.bgSurface,
                borderColor: c.borderDefault,
                flexDirection: "column",
                alignItems: "stretch",
              },
            ]}
          >
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Store name…"
              placeholderTextColor={c.textTertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={createStore}
              style={[
                {
                  fontSize: textSizes.md,
                  marginBottom: spacing.md,
                  color: c.text,
                },
              ]}
            />
            <Banner variant="accent">
              No setup needed — check items as you walk and we'll learn the
              order for next time.
            </Banner>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Btn
                label="Cancel"
                variant="secondary"
                onPress={() => setAddingNew(false)}
              />
              <Btn
                label="Add store"
                onPress={createStore}
                loading={creating}
                disabled={!newName.trim()}
              />
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setAddingNew(true)}
            style={[s.dashedOption, { borderColor: c.borderStrong }]}
          >
            <View
              style={[
                s.plusCircle,
                { backgroundColor: c.bgSubtle, borderColor: c.borderStrong },
              ]}
            >
              <Text
                style={[{ fontSize: textSizes.lg }, { color: c.textTertiary }]}
              >
                +
              </Text>
            </View>
            <Text
              style={[{ fontSize: textSizes.md }, { color: c.textSecondary }]}
            >
              New store
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <View
        style={[
          s.bottomBar,
          {
            borderTopColor: c.borderDefault,
            backgroundColor: c.bgApp,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}
      >
        <Btn
          label="No store"
          variant="secondary"
          onPress={() => navigation.replace("Shopping", { store: null })}
        />
        <Btn
          label="Start shopping"
          onPress={() => navigation.replace("Shopping", { store: selected })}
        />
      </View>
    </View>
  );
}

// ── ShoppingScreen ────────────────────────────────────────────────────────────

function ShoppingRow({
  item,
  badge,
  partnerChecking,
  onToggle,
}: {
  item: ListItem;
  badge?: { num?: number; variant: "live" | "learned" | "new" };
  partnerChecking: boolean;
  onToggle: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onToggle}
      style={[
        s.shoppingRow,
        {
          backgroundColor: c.bgSurface,
          borderColor: partnerChecking ? c.accent : c.borderDefault,
        },
        partnerChecking && { borderWidth: 1.5 },
        item.checked && { opacity: 0.45 },
      ]}
    >
      <Checkbox checked={item.checked} />
      <Text
        style={[
          { fontSize: textSizes.md, flex: 1 },
          {
            color: item.checked ? c.textTertiary : c.text,
            textDecorationLine: item.checked ? "line-through" : "none",
          },
        ]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      <Text style={[{ fontSize: textSizes.xs }, { color: c.textTertiary }]}>
        {item.unit === "×"
          ? `×${item.quantity}`
          : `${item.quantity}${item.unit}`}
      </Text>
      {badge && badge.variant !== "new" && badge.num !== undefined && (
        <View
          style={[
            s.orderBadge,
            badge.variant === "learned"
              ? { backgroundColor: c.success }
              : { backgroundColor: c.accent },
          ]}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "500",
              color: badge.variant === "learned" ? c.successText : "#fff",
            }}
          >
            {badge.num}
          </Text>
        </View>
      )}
      {badge?.variant === "new" && (
        <View
          style={[
            s.newTag,
            { backgroundColor: c.bgSubtle, borderColor: c.borderDefault },
          ]}
        >
          <Text style={[{ fontSize: textSizes.xs }, { color: c.textTertiary }]}>
            New
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function ShoppingScreen({
  navigation,
  route,
}: NativeStackScreenProps<AppStackParams, "Shopping">) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const store: Store | null = route.params?.store ?? null;
  const { items, toggleItem, completeTrip, syncState, partnerCheckingId, list, loadList } =
    useList();
  const checkOrderRef = useRef<string[]>([]);
  const isLearned = (store?.tripCount ?? 0) >= 2;
  const [refreshing, setRefreshing] = useState(false);

  const sorted = React.useMemo(() => {
    if (!store || !isLearned) return items;
    return [...items].sort((a, b) => {
      const pa = store.learnedOrder[a.name] ?? 9999;
      const pb = store.learnedOrder[b.name] ?? 9999;
      return pa - pb;
    });
  }, [items, store, isLearned]);

  const unchecked = sorted.filter((i) => !i.checked);
  const checked = sorted.filter((i) => i.checked);
  const newItems = isLearned
    ? unchecked.filter((i) => store && store.learnedOrder[i.name] === undefined)
    : [];
  const known = isLearned
    ? unchecked.filter((i) => store && store.learnedOrder[i.name] !== undefined)
    : unchecked;

  const handleToggle = async (item: ListItem) => {
    if (!item.checked) checkOrderRef.current.push(item.name);
    else
      checkOrderRef.current = checkOrderRef.current.filter(
        (n) => n !== item.name,
      );
    await toggleItem(item.id);
  };

  const handleDone = async () => {
    try {
      const trip = await completeTrip(store?.id, checkOrderRef.current);
      navigation.replace("TripComplete", { tripId: trip.id });
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  };

  const handleRefresh = async () => {
    if (!list) return;
    setRefreshing(true);
    try {
      await loadList(list.id);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: c.bgApp }]}>
      <Header
        title={
          items.every((i) => i.checked) && items.length > 0
            ? "All done 🎉"
            : "Shopping"
        }
        subtitle={
          store
            ? `${store.name} · ${isLearned ? "your route" : "learning…"}`
            : "No store selected"
        }
        onBack={() => navigation.goBack()}
        syncState={syncState}
      />

      <ScrollView
        style={{ paddingHorizontal: spacing.lg }}
        contentContainerStyle={{
          paddingBottom: spacing["4xl"],
          paddingTop: spacing.sm,
        }}
        bounces={true}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.accent}
            colors={[c.accent]}
            progressViewOffset={0}
          />
        }
      >
        {!isLearned && store && (
          <Banner variant="accent">
            First visit — check items as you find them. The order will be saved
            for next time.
          </Banner>
        )}
        {isLearned && store && (
          <Banner variant="success">
            Sorted by how you usually walk this store. New items are at the
            bottom.
          </Banner>
        )}

        {known.map((item, idx) => (
          <ShoppingRow
            key={item.id}
            item={item}
            badge={{
              num: isLearned
                ? Math.round(store?.learnedOrder[item.name] ?? idx + 1)
                : idx + 1,
              variant: isLearned ? "learned" : "live",
            }}
            partnerChecking={item.id === partnerCheckingId}
            onToggle={() => handleToggle(item)}
          />
        ))}

        {newItems.length > 0 && (
          <>
            <Divider dashed />
            <Text
              style={[
                {
                  fontSize: textSizes.xs,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: spacing.sm,
                },
                { color: c.textTertiary },
              ]}
            >
              New — not yet placed
            </Text>
            {newItems.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                badge={{ variant: "new" }}
                partnerChecking={item.id === partnerCheckingId}
                onToggle={() => handleToggle(item)}
              />
            ))}
          </>
        )}

        {checked.length > 0 && (
          <>
            <SectionLabel>{`In cart (${checked.length})`}</SectionLabel>
            {checked.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                partnerChecking={false}
                onToggle={() => handleToggle(item)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <View
        style={[
          s.bottomBar,
          {
            borderTopColor: c.borderDefault,
            backgroundColor: c.bgApp,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}
      >
        {isLearned && (
          <Btn
            label="Unsorted"
            variant="secondary"
            style={{ flex: 0, paddingHorizontal: spacing.lg }}
            onPress={() => {}}
          />
        )}
        <Btn label="Mark as bought" onPress={handleDone} />
      </View>
    </View>
  );
}

// ── TripCompleteScreen ────────────────────────────────────────────────────────

export function TripCompleteScreen({
  navigation,
  route,
}: NativeStackScreenProps<AppStackParams, "TripComplete">) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { list } = useList();
  const tripId: string = route.params.tripId;
  const [uploading, setUploading] = useState(false);

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (result.canceled || !list) return;
    setUploading(true);
    try {
      await tripsApi.attachReceipt(list.id, tripId, result.assets[0].uri);
    } catch {
    } finally {
      setUploading(false);
    }
    navigation.replace("List");
  };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: c.bgApp }]}>
      <View
        style={[
          {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: insets.top,
          },
        ]}
      >
        <Text style={{ fontSize: 52, marginBottom: spacing.lg }}>✅</Text>
        <Text
          style={[
            { fontSize: textSizes["2xl"], fontWeight: "500", marginBottom: 6 },
            { color: c.text },
          ]}
        >
          All done!
        </Text>
        <Text style={[{ fontSize: textSizes.sm }, { color: c.textSecondary }]}>
          Would you like to attach a receipt?
        </Text>
      </View>

      <View
        style={[
          { paddingHorizontal: spacing.lg },
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
      >
        <View
          style={[
            s.receiptCard,
            { backgroundColor: c.bgSurface, borderColor: c.borderDefault },
          ]}
        >
          <Text
            style={[
              { fontSize: textSizes.md, fontWeight: "500", marginBottom: 4 },
              { color: c.text },
            ]}
          >
            Attach a receipt
          </Text>
          <Text
            style={[
              { fontSize: textSizes.xs, marginBottom: spacing.md },
              { color: c.textSecondary },
            ]}
          >
            Saved to this trip in history
          </Text>
          <View style={[s.uploadZone, { borderColor: c.borderStrong }]}>
            <Text
              style={[{ fontSize: textSizes.sm }, { color: c.textSecondary }]}
            >
              📷 Take photo or upload
            </Text>
            <Text
              style={[
                { fontSize: textSizes.xs, marginTop: 4 },
                { color: c.textTertiary },
              ]}
            >
              jpg, png, pdf
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Btn
            label="Skip"
            variant="secondary"
            onPress={() => navigation.replace("List")}
          />
          <Btn label="Add receipt" onPress={pickReceipt} loading={uploading} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bottomBar: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 0.5,
  },
  storeOption: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: "#fff",
  },
  storeBadge: {
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  dashedOption: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  plusCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  shoppingRow: {
    borderRadius: radius.md,
    borderWidth: 0.5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 6,
  },
  orderBadge: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  newTag: {
    borderRadius: radius.sm,
    borderWidth: 0.5,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  receiptCard: {
    borderRadius: radius.lg,
    borderWidth: 0.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  uploadZone: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.md,
  },
});
