// src/screens/AuthScreens.tsx
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParams } from "../navigation";
import { useAuth } from "../context/AuthContext";
import { useColors, spacing, radius, text as textSizes } from "../theme";
import { Btn, Input } from "../components/ui";
import { listsApi } from "../services/api";

// ── Splash ────────────────────────────────────────────────────────────────────

export function SplashScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, "Splash">) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.center,
        {
          backgroundColor: c.bgApp,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + spacing.lg,
        },
      ]}
    >
      <Text style={s.splashIcon}>🛒</Text>
      <Text style={[s.splashTitle, { color: c.text }]}>CartSync</Text>
      <Text style={[s.splashSub, { color: c.textSecondary }]}>
        A shared shopping list{"\n"}that stays in sync with your partner
      </Text>
      <View style={s.splashBtns}>
        <Btn
          label="Get started"
          onPress={() => navigation.navigate("NewOrJoin")}
        />
        <View style={{ height: spacing.sm }} />
        <Btn
          label="I already have an account"
          variant="secondary"
          onPress={() => navigation.navigate("Login")}
        />
      </View>
    </View>
  );
}

// ── NewOrJoin ─────────────────────────────────────────────────────────────────

export function NewOrJoinScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, "NewOrJoin">) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.screen,
        {
          backgroundColor: c.bgApp,
          paddingTop: insets.top + spacing.lg,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <Text style={[s.heading, { color: c.text }]}>
        How would you like to start?
      </Text>
      <Text
        style={[
          s.para,
          { color: c.textSecondary, marginBottom: spacing["2xl"] },
        ]}
      >
        You can invite your partner after setup
      </Text>

      <View
        style={[
          s.card,
          { backgroundColor: c.bgSurface, borderColor: c.borderDefault },
        ]}
      >
        <Text style={[s.cardTitle, { color: c.text }]}>Create a new list</Text>
        <Text style={[s.cardSub, { color: c.textSecondary }]}>
          Start fresh and invite your partner
        </Text>
        <View style={{ height: spacing.md }} />
        <Btn
          label="Create list"
          onPress={() => navigation.navigate("Register")}
        />
      </View>

      <View
        style={[
          s.card,
          { backgroundColor: c.bgSurface, borderColor: c.borderDefault },
        ]}
      >
        <Text style={[s.cardTitle, { color: c.text }]}>
          Join an existing list
        </Text>
        <Text style={[s.cardSub, { color: c.textSecondary }]}>
          Your partner already set one up
        </Text>
        <View style={{ height: spacing.md }} />
        <Btn
          label="Join with a code"
          variant="secondary"
          onPress={() => navigation.navigate("Join")}
        />
      </View>
    </View>
  );
}

// ── Register ──────────────────────────────────────────────────────────────────

export function RegisterScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, "Register">) {
  const c = useColors();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const submit = async () => {
    if (!name || !email || !password)
      return Alert.alert("Please fill in all fields");
    if (!isValidEmail(email))
      return Alert.alert("Invalid email", "Please enter a valid email address");
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (e: unknown) {
      console.log("Registration error", e);
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          s.form,
          {
            backgroundColor: c.bgApp,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => navigation.goBack()} style={s.backLink}>
          <Text style={[s.backLinkText, { color: c.accentText }]}>← Back</Text>
        </Pressable>
        <Text style={[s.heading, { color: c.text }]}>Create account</Text>
        <Text
          style={[
            s.para,
            { color: c.textSecondary, marginBottom: spacing["2xl"] },
          ]}
        >
          You can invite your partner after setup
        </Text>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          returnKeyType="next"
        />
        <View style={{ height: spacing.sm }} />
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
        <View style={{ height: spacing.sm }} />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <View style={{ height: spacing.lg }} />
        <Btn
          style={{ flex: 0 }}
          label="Create account"
          onPress={submit}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

export function LoginScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, "Login">) {
  const c = useColors();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const submit = async () => {
    if (!email || !password) return Alert.alert("Please fill in all fields");
    if (!isValidEmail(email))
      return Alert.alert("Invalid email", "Please enter a valid email address");
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: unknown) {
      console.log("Login error", e);
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Invalid credentials",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          s.form,
          {
            backgroundColor: c.bgApp,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => navigation.goBack()} style={s.backLink}>
          <Text style={[s.backLinkText, { color: c.accentText }]}>← Back</Text>
        </Pressable>
        <Text style={[s.heading, { color: c.text }]}>Welcome back</Text>
        <Text
          style={[
            s.para,
            { color: c.textSecondary, marginBottom: spacing["2xl"] },
          ]}
        >
          Sign in to your account
        </Text>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
        <View style={{ height: spacing.sm }} />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <View style={{ height: spacing.lg }} />
        <Btn
          style={{ flex: 0 }}
          label="Sign in"
          onPress={submit}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Join ──────────────────────────────────────────────────────────────────────

export function JoinScreen({
  navigation,
}: NativeStackScreenProps<AuthStackParams, "Join">) {
  const c = useColors();
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const submit = async () => {
    if (!code || !name || !email || !password)
      return Alert.alert("Please fill in all fields");
    if (!isValidEmail(email))
      return Alert.alert("Invalid email", "Please enter a valid email address");

    setLoading(true);
    try {
      // Register then the navigation automatically shows list screen;
      // the list context can join by code after auth
      await register(email, password, name);
      // The join-by-code flow happens post-auth in ListContext/Navigator
      await listsApi.join(code.trim().toUpperCase());
    } catch (e: unknown) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          s.form,
          {
            backgroundColor: c.bgApp,
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => navigation.goBack()} style={s.backLink}>
          <Text style={[s.backLinkText, { color: c.accentText }]}>← Back</Text>
        </Pressable>
        <Text style={[s.heading, { color: c.text }]}>Join a list</Text>
        <Text
          style={[
            s.para,
            { color: c.textSecondary, marginBottom: spacing["2xl"] },
          ]}
        >
          Enter the invite code your partner shared
        </Text>
        <Input
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          placeholder="A4F-92K"
          autoCapitalize="characters"
          style={{
            textAlign: "center",
            fontSize: textSizes["2xl"],
            letterSpacing: 6,
            fontWeight: "500",
          }}
          maxLength={7}
        />
        <View style={{ height: spacing.lg }} />
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          returnKeyType="next"
        />
        <View style={{ height: spacing.sm }} />
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
        />
        <View style={{ height: spacing.sm }} />
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <View style={{ height: spacing.lg }} />
        <Btn
          style={{ flex: 0 }}
          label="Join list"
          onPress={submit}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.lg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  form: { flexGrow: 1, paddingHorizontal: spacing.lg },
  heading: { fontSize: textSizes["2xl"], fontWeight: "500", marginBottom: 6 },
  para: { fontSize: textSizes.sm, lineHeight: textSizes.sm * 1.6 },
  splashIcon: { fontSize: 52, marginBottom: spacing.lg },
  splashTitle: {
    fontSize: textSizes["3xl"],
    fontWeight: "500",
    marginBottom: spacing.sm,
  },
  splashSub: {
    fontSize: textSizes.md,
    textAlign: "center",
    lineHeight: textSizes.md * 1.7,
    marginBottom: spacing["4xl"],
  },
  splashBtns: { width: "100%" },
  card: {
    borderRadius: radius.lg,
    borderWidth: 0.5,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: textSizes.lg, fontWeight: "500", marginBottom: 4 },
  cardSub: { fontSize: textSizes.sm },
  backLink: { marginBottom: spacing["2xl"] },
  backLinkText: { fontSize: textSizes.sm, fontWeight: "500" },
});
