import { type AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain:
        "https://excited-honeybee-19.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
