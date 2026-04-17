// src/screens/ListScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParams } from "../navigation";
import { useList } from "../context/ListContext";
import { useAuth } from "../context/AuthContext";
import { useColors, spacing, radius, text as textSizes } from "../theme";
import { Header } from "../components/Header";
import {
  Btn,
  Checkbox,
  Divider,
  EmptyState,
  SectionLabel,
} from "../components/ui";
import type { ListItem } from "../services/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── ItemRow ───────────────────────────────────────────────────────────────────

function ItemRow({
  item,
  isPartnerChecking,
  onToggle,
  onUpdate,
}: {
  item: ListItem;
  isPartnerChecking: boolean;
  onToggle: () => void;
  onUpdate: (qty: number) => void;
}) {
  const c = useColors();
  const [expanded, setExpanded] = useState(false);
  const [qty, setQty] = useState(String(item.quantity));

  const saveQty = () => {
    const n = parseInt(qty, 10);
    if (!isNaN(n) && n > 0) onUpdate(n);
    else setQty(String(item.quantity));
  };

  return (
    <View
      style={[
        s.itemRow,
        {
          backgroundColor: c.bgSurface,
          borderColor:
            isPartnerChecking || expanded ? c.accent : c.borderDefault,
        },
        isPartnerChecking && { borderWidth: 1.5 },
        item.checked && { opacity: 0.45 },
      ]}
    >
      <Pressable
        style={s.itemMain}
        onPress={() => {
          if (!expanded) onToggle();
          else {
            saveQty();
            setExpanded(false);
          }
        }}
        onLongPress={() => setExpanded(true)}
      >
        <Checkbox checked={item.checked} />
        <Text
          style={[
            s.itemName,
            { color: item.checked ? c.textTertiary : c.text },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[s.itemQty, { color: c.textTertiary }]}>
          {item.unit === "×"
            ? `×${item.quantity}`
            : `${item.quantity}${item.unit}`}
        </Text>
      </Pressable>

      {expanded && (
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
            style={[s.qtyInput, { color: c.text }]}
          />
          <Pressable
            onPress={() => setQty((v) => String(parseInt(v, 10) + 1))}
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
      )}
    </View>
  );
}

// ── ShoppingTab ───────────────────────────────────────────────────────────────

const UNITS = ["×", "g", "kg", "ml", "l"] as const;
type Unit = (typeof UNITS)[number];

function ShoppingTab({ navigation }: { navigation: any }) {
  const c = useColors();
  const { items, addItem, toggleItem, updateItem, partnerCheckingId } =
    useList();

  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newUnit, setNewUnit] = useState<Unit>("×");
  const [unitOpen, setUnitOpen] = useState(false);

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

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

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: spacing["3xl"] }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Add form ── */}
      <View style={as.form}>
        {/* Row 1 — item name, full width */}
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="Item name…"
          placeholderTextColor={c.textTertiary}
          returnKeyType="next"
          style={[
            as.nameInput,
            {
              backgroundColor: c.bgSurface,
              borderColor: c.borderDefault,
              color: c.text,
            },
          ]}
        />

        {/* Row 2 — quantity, unit picker, add button */}
        <View style={as.row2}>
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
              <Text style={[as.unitChevron, { color: c.textTertiary }]}>▾</Text>
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

          {/* Add button */}
          <Pressable
            onPress={handleAdd}
            style={[as.addBtn, { backgroundColor: c.accent }]}
          >
            <Text style={as.addBtnText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[s.hint, { color: c.textTertiary }]}>
        Hold an item to edit quantity
      </Text>

      {unchecked.length === 0 && checked.length === 0 && (
        <EmptyState
          icon="🛒"
          title="List is empty"
          subtitle="Add your first item above"
        />
      )}

      {unchecked.length > 0 && (
        <>
          <SectionLabel>{`To get (${unchecked.length})`}</SectionLabel>
          {unchecked.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              isPartnerChecking={item.id === partnerCheckingId}
              onToggle={() => toggleItem(item.id)}
              onUpdate={(qty) => updateItem(item.id, { quantity: qty })}
            />
          ))}
        </>
      )}

      {checked.length > 0 && (
        <>
          <SectionLabel>{`In cart (${checked.length})`}</SectionLabel>
          {checked.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              isPartnerChecking={false}
              onToggle={() => toggleItem(item.id)}
              onUpdate={(qty) => updateItem(item.id, { quantity: qty })}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}
// ── HistoryTab ────────────────────────────────────────────────────────────────

function HistoryTab() {
  const c = useColors();
  const { trips } = useList();

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
    <ScrollView style={{ flex: 1 }}>
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
  const { suggestions, addItem, loadSuggestions } = useList();
  const [added, setAdded] = useState<Set<string>>(new Set());

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
    <ScrollView style={{ flex: 1 }}>
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

const TABS = ["Shopping", "History", "Suggestions"] as const;
type Tab = (typeof TABS)[number];

export function ListScreen({
  navigation,
}: NativeStackScreenProps<AppStackParams, "List">) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { list, items, syncState } = useList();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("Shopping");

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

        {activeTab === "Shopping" && <ShoppingTab navigation={navigation} />}
        {activeTab === "History" && <HistoryTab />}
        {activeTab === "Suggestions" && <SuggestionsTab />}
      </View>

      {activeTab === "Shopping" && (
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
  form: { marginBottom: spacing.sm, gap: spacing.sm },
  nameInput: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0.5,
    fontSize: textSizes.md,
  },
  row2: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
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
    gap: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 0.5,
    minWidth: 56,
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
    minWidth: 72,
  },
  dropdownItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  dropdownItemText: { fontSize: textSizes.md },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  addBtnText: { color: "#fff", fontSize: 22, lineHeight: 26 },
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
});
