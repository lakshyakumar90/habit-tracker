import { createClient } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { google } from "better-auth/social-providers";
import { componentsGeneric } from "convex/server";
import authConfig from "./auth.config";

const components = componentsGeneric() as any;

export const authComponent = createClient(components.betterAuth as any);

const siteUrl = process.env.SITE_URL ?? process.env.CONVEX_SITE_URL ?? "";
const trustedOrigins = [
  "habit-tracker://",
  "habit-tracker:/",
  "http://localhost:8081",
  "http://localhost:19006",
  ...(siteUrl ? [siteUrl] : []),
];

export const createAuth = (ctx: any) => {
  return betterAuth({
    baseURL: process.env.CONVEX_SITE_URL,
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins,
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
    plugins: [
      expo(),
      ...(siteUrl ? [crossDomain({ siteUrl })] : []),
      convex({ authConfig }),
    ],
  });
};

export const { getAuthUser } = authComponent.clientApi();
