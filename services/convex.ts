import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn(
    "EXPO_PUBLIC_CONVEX_URL is not set. Cloud sync will stay unavailable until it is configured.",
  );
}

export const convex = new ConvexReactClient(
  convexUrl ?? "https://placeholder.convex.cloud",
);

export const convexSiteUrl =
  process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? "https://placeholder.convex.site";
