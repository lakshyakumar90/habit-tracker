import { useAuth, useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const googleOAuth = useOAuth({ strategy: "oauth_google" });

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await googleOAuth.startOAuthFlow({
        redirectUrl: Linking.createURL("/", { scheme: "habittracker" }),
      });

      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        console.log("[Auth] Google sign-in successful");
      } else {
        console.warn("[Auth] No session created");
        Alert.alert("Sign In", "Could not complete sign in");
      }
    } catch (error: any) {
      console.error("[Auth] Google OAuth error:", error);
      Alert.alert(
        "Sign In Error",
        error?.errors?.[0]?.message || error?.message || "Unknown error",
      );
    }
  }, [googleOAuth]);

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Habit Tracker</Text>
        <Text style={styles.subtitle}>
          Build better habits, one day at a time
        </Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignIn}
        >
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
          <Text style={styles.linkText}>Don\'t have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#94A3B8",
    textAlign: "center",
  },
  buttons: {
    width: "100%",
    gap: 16,
    alignItems: "center",
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  googleButton: {
    backgroundColor: "#22C55E",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  linkText: {
    color: "#22C55E",
    fontSize: 14,
    marginTop: 8,
  },
});
