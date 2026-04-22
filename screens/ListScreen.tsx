// src/screens/ListScreen.tsx
import React, { use, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParams } from "../navigation";
import { useList } from "../context/ListContext";
import { useAuth } from "../context/AuthContext";
import { useColors, spacing, radius, text as textSizes } from "../theme";
import { Header } from "../components/Header";
import { Btn, EmptyState, SectionLabel, Checkbox } from "../components/ui";
import type { ListItem } from "../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SKIP_DELETE_CONFIRMATION_KEY = "skip_delete_confirmation";

// ── DeleteConfirmModal ────────────────────────────────────────────────────────

function DeleteConfirmModal({
  visible,
  itemName,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  itemName: string;
  onConfirm: (skipFuture: boolean) => void;
  onCancel: () => void;
}) {
  const c = useColors();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!visible) return null;

  return (
    <View style={s.modalOverlay}>
      <View style={[s.modalContent, { backgroundColor: c.bgSurface }]}>
        <Text style={[s.modalTitle, { color: c.text }]}>Delete item?</Text>
        <Text style={[s.modalMessage, { color: c.textSecondary }]}>
          Remove "{itemName}" from the list?
        </Text>

        <Pressable
          onPress={() => setDontShowAgain(!dontShowAgain)}
          style={s.checkboxRow}
        >
          <Checkbox checked={dontShowAgain} />
          <Text style={[s.checkboxLabel, { color: c.textSecondary }]}>
            Don't ask again
          </Text>
        </Pressable>

        <View style={s.modalButtons}>
          <Pressable
            onPress={onCancel}
            style={[
              s.modalButton,
              { backgroundColor: c.bgSubtle, borderColor: c.borderDefault },
            ]}
          >
            <Text style={[s.modalButtonText, { color: c.text }]}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => onConfirm(dontShowAgain)}
            style={[s.modalButton, { backgroundColor: c.danger }]}
          >
            <Text style={[s.modalButtonText, { color: "#fff" }]}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── SwipeableItemRow ──────────────────────────────────────────────────────────

function SwipeableItemRow({
  item,
  expanded,
  onExpand,
  onUpdate,
  onDelete,
  onRename,
  onUnitChange,
}: {
  item: ListItem;
  expanded: boolean;
  onExpand: (id: string | null) => void;
  onUpdate: (qty: number) => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onUnitChange: (unit: string) => void;
}) {
  const c = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const [skipConfirmation, setSkipConfirmation] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(SKIP_DELETE_CONFIRMATION_KEY).then((value) => {
      setSkipConfirmation(value === "true");
    });
  }, []);

  const handleDeleteConfirmation = () => {
    if (skipConfirmation) {
      onDelete();
      return;
    }
    setShowModal(true);
  };

  const handleConfirm = async (skipFuture: boolean) => {
    if (skipFuture) {
      await SecureStore.setItemAsync(SKIP_DELETE_CONFIRMATION_KEY, "true");
      setSkipConfirmation(true);
    }
    setShowModal(false);
    onDelete();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !expanded,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !expanded && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swipe right (positive dx)
        if (gestureState.dx > 0) {
          translateX.setValue(Math.min(gestureState.dx, 100));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 80) {
          // Threshold for delete
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            handleDeleteConfirmation();
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <>
      <DeleteConfirmModal
        visible={showModal}
        itemName={item.name}
        onConfirm={handleConfirm}
        onCancel={() => setShowModal(false)}
      />

      <View style={{ position: "relative", marginBottom: 6 }}>
        {/* Delete background */}
        <Animated.View
          style={[
            s.deleteBackground,
            {
              backgroundColor: c.danger,
              opacity: translateX.interpolate({
                inputRange: [0, 100],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <Text style={{ fontSize: 20, marginLeft: spacing.md }}>🗑️</Text>
        </Animated.View>

        {/* Swipeable item */}
        <Animated.View
          style={{
            transform: [{ translateX }],
          }}
          {...panResponder.panHandlers}
        >
          <ItemRow
            item={item}
            expanded={expanded}
            onExpand={onExpand}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onRename={onRename}
            onUnitChange={onUnitChange}
          />
        </Animated.View>
      </View>
    </>
  );
}

// ── ItemRow ───────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  expanded,
  onExpand,
  onUpdate,
  onDelete,
  onRename,
  onUnitChange,
}: {
  item: ListItem;
  expanded: boolean;
  onExpand: (id: string | null) => void;
  onUpdate: (qty: number) => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onUnitChange: (unit: string) => void;
}) {
  const c = useColors();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(item.name);
  const nameInputRef = useRef<TextInput>(null);

  const saveName = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== item.name) onRename(trimmed);
    else setNameValue(item.name);
    setEditingName(false);
  };

  return (
    <View
      style={[
        s.itemRow,
        {
          backgroundColor: c.bgSurface,
          borderColor: expanded || editingName ? c.accent : c.borderDefault,
        },
      ]}
    >
      <Pressable
        style={s.itemMain}
        onPress={() => {
          if (editingName) return;
          if (!expanded) onExpand(item.id);
          else onExpand(null);
        }}
        onLongPress={() => {
          setEditingName(true);
          setTimeout(() => nameInputRef.current?.focus(), 0);
        }}
      >
        {editingName ? (
          <TextInput
            ref={nameInputRef}
            value={nameValue}
            onChangeText={(v) => setNameValue(v.slice(0, 48))}
            onBlur={saveName}
            onSubmitEditing={saveName}
            selectTextOnFocus
            returnKeyType="done"
            style={[s.itemName, { color: c.text, padding: 0 }]}
          />
        ) : (
          <Text
            style={[
              s.itemName,
              { color: item.checked ? c.textTertiary : c.text },
            ]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        )}
        <Text style={[s.itemQty, { color: c.textTertiary }]}>
          {item.unit === "×"
            ? `×${item.quantity}`
            : `${item.quantity}${item.unit}`}
        </Text>
      </Pressable>

      {expanded && (
        <ItemRowExpansion
          item={item}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onUnitChange={onUnitChange}
        />
      )}
    </View>
  );
}

function ItemRowExpansion({
  item,
  onUpdate,
  onDelete,
  onUnitChange,
}: {
  item: ListItem;
  onUpdate: (qty: number) => void;
  onDelete: () => void;
  onUnitChange: (unit: string) => void;
}) {
  const c = useColors();
  const [qty, setQty] = useState(String(item.quantity));

  const saveQty = () => {
    const n = parseInt(qty, 10);
    if (!isNaN(n) && n > 0) onUpdate(n);
    else setQty(String(item.quantity));
  };

  useEffect(() => {
    onUpdate(parseInt(qty, 10));
  }, [qty]);

  return (
    <View>
      <View
        style={[
          s.qtyEditor,
          { backgroundColor: c.bgSubtle, borderTopColor: c.borderDefault },
        ]}
      >
        <Text
          style={[
            { fontSize: textSizes.xs, flex: 1 },
            { color: c.textSecondary },
          ]}
        >
          Quantity
        </Text>
        <Pressable
          onPress={() => {
            const n = Math.max(1, parseInt(qty, 10) - 1);
            setQty(String(n));
          }}
          style={[
            s.qtyBtn,
            { backgroundColor: c.bgSurface, borderColor: c.borderStrong },
          ]}
        >
          <Text
            style={[{ fontSize: 18, fontWeight: "500" }, { color: c.text }]}
          >
            −
          </Text>
        </Pressable>
        <TextInput
          value={qty}
          onChangeText={setQty}
          onBlur={saveQty}
          keyboardType="numeric"
          selectTextOnFocus
          style={[s.qtyInput, { color: c.text }]}
        />
        <Pressable
          onPress={() => {
            const n = parseInt(qty, 10) + 1;
            setQty(String(n));
          }}
          style={[
            s.qtyBtn,
            { backgroundColor: c.bgSurface, borderColor: c.borderStrong },
          ]}
        >
          <Text
            style={[{ fontSize: 18, fontWeight: "500" }, { color: c.text }]}
          >
            +
          </Text>
        </Pressable>
      </View>

      {/* Unit selector */}
      <View
        style={[
          s.qtyEditor,
          { backgroundColor: c.bgSubtle, borderTopColor: c.borderDefault },
        ]}
      >
        <Text
          style={[
            { fontSize: textSizes.xs, flex: 1 },
            { color: c.textSecondary },
          ]}
        >
          Unit
        </Text>
        {UNITS.map((u) => (
          <Pressable
            key={u}
            onPress={() => onUnitChange(u)}
            style={[
              s.unitChip,
              item.unit === u
                ? { backgroundColor: c.accent, borderColor: c.accent }
                : { backgroundColor: c.bgSurface, borderColor: c.borderStrong },
            ]}
          >
            <Text
              style={{
                fontSize: textSizes.xs,
                fontWeight: "500",
                color: item.unit === u ? "#fff" : c.text,
              }}
            >
              {u}
            </Text>
          </Pressable>
        ))}
      </View>

      <View
        style={[
          s.qtyEditor,
          {
            backgroundColor: c.bgSubtle,
            borderTopColor: c.borderDefault,
            justifyContent: "flex-end",
          },
        ]}
      >
        <Pressable
          onPress={onDelete}
          style={[
            s.qtyBtn,
            { backgroundColor: c.danger, borderColor: c.borderStrong },
          ]}
        >
          <Text style={{ fontSize: 16 }}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── ChecklistTab ───────────────────────────────────────────────────────────────

const UNITS = ["×", "g", "kg", "ml", "l"] as const;
type Unit = (typeof UNITS)[number];

function ChecklistTab({ navigation }: { navigation: any }) {
  const c = useColors();
  const { items, addItem, updateItem, removeItem, list, loadList } = useList();
  const [refreshing, setRefreshing] = useState(false);

  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newUnit, setNewUnit] = useState<Unit>("×");
  const [unitOpen, setUnitOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unchecked = items
    .filter((i) => !i.checked)
    .slice()
    .reverse();
  const checked = items
    .filter((i) => i.checked)
    .slice()
    .reverse();

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    setNewName("");
    setNewQty("1");
    setNewUnit("×");
    try {
      await addItem(name, qty, newUnit);
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
    <View style={{ flex: 1 }}>
      <View style={as.form}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <TextInput
            value={newName}
            onChangeText={(v) => setNewName(v.slice(0, 48))}
            placeholder="Item name…"
            placeholderTextColor={c.textTertiary}
            returnKeyType="next"
            style={[
              as.nameInput,
              {
                backgroundColor: c.bgSurface,
                borderColor: c.borderDefault,
                color: c.text,
                flex: 1,
              },
            ]}
          />
          {/* Quantity */}
          <TextInput
            value={newQty}
            onChangeText={(v) => setNewQty(v.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={c.textTertiary}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            style={[
              as.qtyInput,
              {
                backgroundColor: c.bgSurface,
                borderColor: c.borderDefault,
                color: c.text,
              },
            ]}
          />

          {/* Unit dropdown */}
          <View style={{ position: "relative" }}>
            <Pressable
              onPress={() => setUnitOpen((o) => !o)}
              style={[
                as.unitBtn,
                {
                  backgroundColor: c.bgSurface,
                  borderColor: unitOpen ? c.accent : c.borderDefault,
                },
              ]}
            >
              <Text style={[as.unitBtnText, { color: c.text }]}>{newUnit}</Text>
              {/* <Text style={[as.unitChevron, { color: c.textTertiary }]}>▾</Text> */}
            </Pressable>

            {unitOpen && (
              <View
                style={[
                  as.dropdown,
                  {
                    backgroundColor: c.bgSurface,
                    borderColor: c.borderDefault,
                  },
                ]}
              >
                {UNITS.map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => {
                      setNewUnit(u);
                      setUnitOpen(false);
                    }}
                    style={[
                      as.dropdownItem,
                      u === newUnit && { backgroundColor: c.accentSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        as.dropdownItemText,
                        { color: u === newUnit ? c.accentText : c.text },
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
        {/* Add button */}
        <Btn
          label="Add Item"
          variant="primary"
          onPress={handleAdd}
          />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
        keyboardShouldPersistTaps="handled"
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
        {unchecked.length === 0 && checked.length === 0 && (
          <EmptyState
            icon="🛒"
            title="List is empty"
            subtitle="Add your first item above"
          />
        )}
        {unchecked.length > 0 ? (
          <>
            <SectionLabel>{`To get (${unchecked.length})`}</SectionLabel>
            {unchecked.map((item) => (
              <SwipeableItemRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onExpand={setExpandedId}
                onUpdate={(qty) => updateItem(item.id, { quantity: qty })}
                onDelete={() => removeItem(item.id)}
                onRename={(name) => updateItem(item.id, { name })}
                onUnitChange={(unit) => updateItem(item.id, { unit })}
              />
            ))}
          </>
        ) : null}
        {checked.length > 0 ? (
          <>
            <SectionLabel>{`In cart (${checked.length})`}</SectionLabel>
            {checked.map((item) => (
              <SwipeableItemRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onExpand={setExpandedId}
                onUpdate={(qty) => updateItem(item.id, { quantity: qty })}
                onDelete={() => removeItem(item.id)}
                onRename={(name) => updateItem(item.id, { name })}
                onUnitChange={(unit) => updateItem(item.id, { unit })}
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
// ── HistoryTab ────────────────────────────────────────────────────────────────

function HistoryTab() {
  const c = useColors();
  const { trips, list, loadList } = useList();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!list) return;
    setRefreshing(true);
    try {
      await loadList(list.id);
    } finally {
      setRefreshing(false);
    }
  };

  if (!trips.length) {
    return (
      <EmptyState
        icon="📋"
        title="No trips yet"
        subtitle="Complete your first shopping trip to see history"
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
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
      <SectionLabel>Past trips</SectionLabel>
      {trips.map((trip) => (
        <View
          key={trip.id}
          style={[
            s.historyRow,
            { backgroundColor: c.bgSurface, borderColor: c.borderDefault },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[{ fontSize: textSizes.md }, { color: c.text }]}>
              {trip.storeName ?? "No store"} ·{" "}
              {new Date(trip.completedAt).toLocaleDateString()}
            </Text>
            <Text
              style={[
                { fontSize: textSizes.xs, marginTop: 2 },
                { color: c.textTertiary },
              ]}
            >
              {trip.itemCount} items
            </Text>
          </View>
          {trip.receiptUrl && (
            <View style={[s.receiptBadge, { backgroundColor: c.success }]}>
              <Text
                style={[
                  { fontSize: textSizes.xs, fontWeight: "500" },
                  { color: c.successText },
                ]}
              >
                Receipt
              </Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// ── SuggestionsTab ────────────────────────────────────────────────────────────

function SuggestionsTab() {
  const c = useColors();
  const { suggestions, addItem, loadSuggestions, list, loadList } = useList();
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleChip = async (name: string, unit: string) => {
    if (added.has(name)) return;
    setAdded((prev) => new Set(prev).add(name));
    try {
      await addItem(name, 1, unit);
    } catch {}
  };

  const handleRefresh = async () => {
    if (!list) return;
    setRefreshing(true);
    try {
      await loadList(list.id);
      await loadSuggestions();
    } finally {
      setRefreshing(false);
    }
  };

  if (!suggestions.length) {
    return (
      <EmptyState
        icon="✨"
        title="No suggestions yet"
        subtitle="Complete a few trips to get personalised suggestions"
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
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
      <SectionLabel>Buy again soon</SectionLabel>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginBottom: spacing.lg,
        }}
      >
        {suggestions.map((sug) => {
          const isAdded = added.has(sug.name);
          return (
            <Pressable
              key={sug.name}
              onPress={() => handleChip(sug.name, sug.unit)}
              style={[
                s.chip,
                isAdded
                  ? { backgroundColor: c.success, borderColor: c.successBorder }
                  : {
                      backgroundColor: c.bgSurface,
                      borderColor: c.borderDefault,
                    },
              ]}
            >
              <Text
                style={{
                  fontSize: textSizes.sm,
                  color: isAdded ? c.successText : c.text,
                }}
              >
                {sug.name}
              </Text>
              <Text
                style={{
                  fontSize: textSizes.xs,
                  color: isAdded ? c.successText : c.textTertiary,
                }}
              >
                {sug.frequencyLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[{ fontSize: textSizes.xs }, { color: c.textTertiary }]}>
        Tap to add to list
      </Text>
    </ScrollView>
  );
}

// ── ListScreen ────────────────────────────────────────────────────────────────

const TABS = ["Checklist", "History", "Suggestions"] as const;
type Tab = (typeof TABS)[number];

export function ListScreen({
  navigation,
}: NativeStackScreenProps<AppStackParams, "List">) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { list, items, syncState } = useList();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Checklist");

  const partner = list?.members.find((m) => m.id !== user?.id);
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: c.bgApp }]}>
      <Header
        title={list?.name ?? "Shopping list"}
        subtitle={`${items.length} items · ${checkedCount} checked`}
        partner={
          partner
            ? { initials: partner.name[0].toUpperCase(), online: true }
            : undefined
        }
        onPartnerPress={() => navigation.navigate("Settings")}
        syncState={syncState}
      />

      <View style={[s.container, { paddingBottom: insets.bottom }]}>
        {/* Tabs */}
        <View
          style={[
            s.tabs,
            { backgroundColor: c.bgSurface, borderColor: c.borderDefault },
          ]}
        >
          {TABS.map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                s.tab,
                activeTab === tab && [
                  s.tabActive,
                  { backgroundColor: c.bgSubtle, borderColor: c.borderDefault },
                ],
              ]}
            >
              <Text
                style={[
                  { fontSize: textSizes.xs },
                  activeTab === tab
                    ? { color: c.text, fontWeight: "500" }
                    : { color: c.textSecondary },
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {activeTab === "Checklist" && <ChecklistTab navigation={navigation} />}
        {activeTab === "History" && <HistoryTab />}
        {activeTab === "Suggestions" && <SuggestionsTab />}
      </View>

      {activeTab === "Checklist" && (
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
            label="Start shopping"
            variant="primary"
            onPress={() => navigation.navigate("StartShopping")}
          />
          <Btn
            label="⚙️"
            variant="secondary"
            onPress={() => navigation.navigate("Settings")}
            style={{ flex: 0, paddingHorizontal: spacing.lg }}
          />
        </View>
      )}
    </View>
  );
}

const as = StyleSheet.create({
  form: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  nameInput: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0.5,
    fontSize: textSizes.md,
  },
  qtyInput: {
    width: 64,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0.5,
    fontSize: textSizes.md,
    textAlign: "center",
  },
  unitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0.5,
    minWidth: 42,
  },
  unitBtnText: { fontSize: textSizes.md, fontWeight: "500" },
  unitChevron: { fontSize: 10 },
  dropdown: {
    position: "absolute",
    top: 40,
    left: 0,
    zIndex: 999,
    borderRadius: radius.md,
    borderWidth: 0.5,
    overflow: "hidden",
    minWidth: 42,
  },
  dropdownItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dropdownItemText: { fontSize: textSizes.md, textAlign: "center" },
  addBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
});

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 0.5,
    padding: 3,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabActive: { borderWidth: 0.5 },
  bottomBar: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 0.5,
  },
  hint: {
    fontSize: textSizes.xs,
    textAlign: "center",
    marginBottom: spacing.md,
    fontStyle: "italic",
  },
  itemRow: {
    borderRadius: radius.md,
    borderWidth: 0.5,
    marginBottom: 6,
    overflow: "hidden",
  },
  itemMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  itemName: { fontSize: textSizes.md, flex: 1 },
  itemQty: { fontSize: textSizes.xs },
  qtyEditor: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderTopWidth: 0.5,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    fontSize: 15,
    fontWeight: "500",
    minWidth: 36,
    textAlign: "center",
  },
  historyRow: {
    borderRadius: radius.md,
    borderWidth: 0.5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  receiptBadge: {
    borderRadius: radius.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  chip: {
    borderRadius: radius.full,
    borderWidth: 0.5,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  unitChip: {
    borderRadius: radius.sm,
    borderWidth: 0.5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  modalContent: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    minWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: textSizes.lg,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  modalMessage: {
    fontSize: textSizes.md,
    marginBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  checkboxLabel: {
    fontSize: textSizes.sm,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0.5,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: textSizes.md,
    fontWeight: "500",
  },
});
