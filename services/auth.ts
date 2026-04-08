import { Platform } from "react-native";
import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { convexSiteUrl } from "./convex";
import { convexClient, crossDomainClient } from "@convex-dev/better-auth/client/plugins";

const scheme = "habit-tracker";
const storagePrefix = "habit-tracker";

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins:
    Platform.OS === "web"
      ? [crossDomainClient({ storagePrefix }), convexClient()]
      : [
          expoClient({
            scheme,
            storagePrefix,
            storage: SecureStore,
          }),
          convexClient(),
        ],
});

export const signInWithGoogle = async () => {
  return authClient.signIn.social({
    provider: "google",
  });
};
