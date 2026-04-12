export const authComponent = {
  getAuthUser: async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return {
      _id: identity.tokenIdentifier,
      email: identity.email,
      name: identity.name,
      image: identity.pictureUrl,
    };
  },
};

export const createAuth = () => {
  throw new Error("Better Auth routes are disabled in this Clerk setup.");
};
