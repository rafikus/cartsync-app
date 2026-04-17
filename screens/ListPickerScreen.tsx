// src/screens/ListPickerScreen.tsx
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppStackParams } from "../navigation";
import { useAuth } from "../context/AuthContext";
import { useList } from "../context/ListContext";
import { listsApi } from "../services/api";
import { useColors, spacing, radius, text as textSizes } from "../theme";
import { Btn, Input, SectionLabel } from "../components/ui";
import { Header } from "../components/Header";

// ── ListPickerScreen ──────────────────────────────────────────────────────────

export function ListPickerScreen({
  navigation,
}: NativeStackScreenProps<AppStackParams, "ListPicker">) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { list, loadList, clearList } = useList();
  const [loading, setLoading] = useState<string | null>(null);

  const [lists, setLists] = useState<{ name: string; id: string }[]>([]);

  useEffect(() => {
    // Fetch existing list names to help avoid duplicates. This is just a UX nicety, not required.
    // We could get these from the user object if we stored them there, but that would require an extra fetch on login.
    const fetchNames = async () => {
      if (!user || !user.listIds) return;
      try {
        const lists = await Promise.all(
          user.listIds.map((id) => listsApi.get(id)),
        );
        setLists(lists);
      } catch {}
    };
    fetchNames();
  }, [user]);

  const listIds = user?.listIds ?? [];

  // Names aren't stored on the user object — we show IDs until loaded.
  // To show names you'd need to either store them on the user or fetch all.
  // Here we fetch each one lazily on tap.
  const handlePick = async (id: string) => {
    if (list?.id === id) {
      return;
    }
    setLoading(id);
    clearList();
    try {
      await loadList(id);
      // Don't navigate — the navigator will show List automatically
      // once list state is non-null
    } catch (e: unknown) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Could not load list",
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: c.bgApp }]}>
      <Header title="Your lists" subtitle="Select a list to open" />

      <ScrollView
        style={{ paddingHorizontal: spacing.lg }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing["4xl"],
        }}
      >
        {listIds.length === 0 ? (
          <Text style={[s.empty, { color: c.textSecondary }]}>
            You don't have any lists yet.
          </Text>
        ) : (
          <>
            <SectionLabel>Your lists</SectionLabel>
            {lists.map(({ name, id }) => {
              const isCurrent = list?.id === id;
              const isLoading = loading === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => handlePick(id)}
                  style={[
                    s.listCard,
                    {
                      backgroundColor: c.bgSurface,
                      borderColor: isCurrent ? c.accent : c.borderDefault,
                      borderWidth: isCurrent ? 1.5 : 0.5,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.listName, { color: c.text }]}>
                      {name.length < 18 ? name : `${name.slice(0, 18)}…`}
                    </Text>
                  </View>
                  {isLoading ? (
                    <Text style={[s.listSub, { color: c.textTertiary }]}>
                      Loading…
                    </Text>
                  ) : (
                    <Text style={[s.chevron, { color: c.textTertiary }]}>
                      ›
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </>
        )}

        <SectionLabel>Add a list</SectionLabel>

        <View style={s.actionRow}>
          <Btn
            label="Create new list"
            onPress={() => navigation.navigate("CreateList")}
          />
        </View>

        <View
          style={[
            s.joinCard,
            { backgroundColor: c.bgSurface, borderColor: c.borderDefault },
          ]}
        >
          <JoinByCode
            onJoined={async (id) => {
              await refreshUser();
              clearList();
              try {
                await loadList(id);
                // No navigate — state change triggers re-render
              } catch {}
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ── JoinByCode — inline sub-form ──────────────────────────────────────────────

function JoinByCode({ onJoined }: { onJoined: (listId: string) => void }) {
  const c = useColors();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (code.length < 7) return Alert.alert("Enter the full 7-character code");
    setLoading(true);
    try {
      const joined = await listsApi.join(code.trim());
      onJoined(joined.id);
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Text style={[s.listName, { color: c.text, marginBottom: spacing.sm }]}>
        Join with invite code
      </Text>
      <Input
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        placeholder="A4F-92K"
        autoCapitalize="characters"
        maxLength={7}
        returnKeyType="go"
        onSubmitEditing={submit}
        style={{
          textAlign: "center",
          fontSize: textSizes.xl,
          letterSpacing: 5,
          fontWeight: "500",
          marginBottom: spacing.md,
        }}
      />
      <Btn
        label="Join list"
        onPress={submit}
        loading={loading}
        disabled={code.length < 7}
      />
    </>
  );
}

// ── CreateListScreen ──────────────────────────────────────────────────────────

export function CreateListScreen({
  navigation,
}: NativeStackScreenProps<AppStackParams, "CreateList">) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { refreshUser } = useAuth();
  const { clearList, loadList } = useList();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return Alert.alert("Give your list a name");
    setLoading(true);
    try {
      const created = await listsApi.create(name.trim());
      await refreshUser();
      clearList();
      await loadList(created.id);
      // No navigate — once list is non-null the navigator switches automatically
    } catch (e: unknown) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Could not create list",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[{ flex: 1 }, { backgroundColor: c.bgApp }]}>
      <Header title="New list" />
      <View
        style={[s.createForm, { paddingBottom: insets.bottom + spacing.lg }]}
      >
        <Text
          style={[
            s.listSub,
            { color: c.textSecondary, marginBottom: spacing.lg },
          ]}
        >
          Give your list a name. You can invite your partner from Settings.
        </Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="e.g. Our weekly shop"
          returnKeyType="go"
          onSubmitEditing={submit}
          autoFocus
        />
        <View style={{ height: spacing.lg }} />
        <Btn
          label="Create list"
          onPress={submit}
          loading={loading}
          disabled={!name.trim()}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  empty: {
    fontSize: textSizes.sm,
    textAlign: "center",
    marginTop: spacing["3xl"],
  },
  listCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  listName: { fontSize: textSizes.md, fontWeight: "500" },
  listSub: { fontSize: textSizes.xs, marginTop: 3 },
  chevron: { fontSize: 22 },
  actionRow: { marginBottom: spacing.sm },
  joinCard: { borderRadius: radius.lg, borderWidth: 0.5, padding: spacing.lg },
  createForm: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
