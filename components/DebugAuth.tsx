import { syncFunctions } from "@/services/convexFunctions";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function DebugAuth() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user } = useUser();
  const authStatus = useQuery(syncFunctions.debugAuth, {});
  const testAuthStatus = useQuery(syncFunctions.testAuth, {});

  const decodeBase64Url = (value: string) => {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

    if (typeof globalThis.atob === "function") {
      return globalThis.atob(padded);
    }

    const bufferCtor = (globalThis as any).Buffer;
    if (bufferCtor) {
      return bufferCtor.from(padded, "base64").toString("utf-8");
    }

    throw new Error("No base64 decoder available in runtime");
  };

  const decodeJWT = async () => {
    try {
      const token = await getToken({ template: "convex" });

      if (!token) {
        Alert.alert("JWT Decoded", "No Convex token found");
        return;
      }

      const parts = token.split(".");
      if (parts.length < 2) {
        Alert.alert("JWT Decoded", "Invalid JWT format");
        return;
      }

      const payloadRaw = decodeBase64Url(parts[1]);
      const payload = JSON.parse(payloadRaw);

      console.log("[JWT PAYLOAD]", JSON.stringify(payload, null, 2));

      Alert.alert(
        "JWT Decoded",
        `iss: ${payload.iss}\n` +
          `sub: ${payload.sub}\n` +
          `aud: ${JSON.stringify(payload.aud)}\n` +
          `azp: ${payload.azp ?? "n/a"}\n` +
          `exp: ${payload.exp ? new Date(payload.exp * 1000).toLocaleString() : "n/a"}`,
      );
    } catch (error: any) {
      Alert.alert("JWT Decode Failed", error?.message ?? "Unknown error");
    }
  };

  const runDiagnostic = async () => {
    const results: string[] = [];

    results.push(`Clerk loaded: ${isLoaded}`);
    results.push(`Clerk signed in: ${isSignedIn}`);
    results.push(
      `Clerk user: ${user?.emailAddresses[0]?.emailAddress ?? "none"}`,
    );

    if (isSignedIn) {
      try {
        const token = await getToken({ template: "convex" });
        results.push(
          `Convex JWT token: ${token ? `EXISTS (${token.length} chars)` : "NULL"}`,
        );

        if (!token) {
          results.push(
            "Problem: no Convex token. Create/verify Clerk JWT template named 'convex'.",
          );
        }
      } catch (error: any) {
        results.push(`Convex JWT error: ${error?.message ?? "Unknown error"}`);
      }
    }

    results.push(`Convex sees auth: ${JSON.stringify(authStatus ?? null)}`);
    results.push(`Convex testAuth: ${JSON.stringify(testAuthStatus ?? null)}`);

    Alert.alert("Auth Diagnostic", results.join("\n\n"));
    console.log("[AUTH DIAGNOSTIC]", results.join("\n"));
  };

  return (
    <View>
      <TouchableOpacity style={styles.button} onPress={runDiagnostic}>
        <Text style={styles.text}>Run Auth Diagnostic</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.decodeButton} onPress={decodeJWT}>
        <Text style={styles.decodeText}>Decode JWT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  text: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
  },
  decodeButton: {
    backgroundColor: "#F59E0B",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  decodeText: {
    color: "#111827",
    textAlign: "center",
    fontWeight: "700",
  },
});
