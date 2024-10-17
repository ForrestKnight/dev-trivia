import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    
    if (user !== null) {
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name });
      }
      return user._id;
    }
    
    const newUser = await ctx.db.insert("users", {
      name: identity.name!,
      profileUrl: identity.pictureUrl,
      tokenIdentifier: identity.tokenIdentifier,
    });
    return newUser;
  },
});

export const getUserHistories = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const triviaParticipations = await ctx.db
      .query("triviaParticipants")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .order("desc")
      .collect();

    return { triviaParticipations };
  },
});

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    
    const users = await ctx.db
      .query("users")
      .filter((q) => 
        q.or(
          q.eq(q.field("tokenIdentifier"), args.userId),
          q.eq(q.field("tokenIdentifier"), `https://united-wolf-23.clerk.accounts.dev|${args.userId}`)
        )
      )
      .collect();
    
    const user = users[0];

    return { user };
  },
});