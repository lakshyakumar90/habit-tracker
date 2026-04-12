import { TokenCache } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

const createTokenCache = (): TokenCache => {
  return {
    getToken: async (key: string) => {
      try {
        const item = await SecureStore.getItemAsync(key);
        if (item) {
          console.log(`[TokenCache] Retrieved key: ${key}`);
        } else {
          console.log(`[TokenCache] No value for key: ${key}`);
        }
        return item;
      } catch (error) {
        console.error("[TokenCache] getToken error:", error);
        await SecureStore.deleteItemAsync(key);
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      try {
        await SecureStore.setItemAsync(key, token);
        console.log(`[TokenCache] Saved key: ${key}`);
      } catch (error) {
        console.error("[TokenCache] saveToken error:", error);
      }
    },
  };
};

export const tokenCache = createTokenCache();
