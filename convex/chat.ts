import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const sendMessage = mutation({
  args: {
    userId: v.string(),
    username: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert('chatMessages', {
      userId: args.userId,
      username: args.username,
      content: args.content,
      timestamp: new Date().toISOString(),
    });
    return messageId;
  },
});

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    return await ctx.db
      .query('chatMessages')
      .filter(q => q.gt(q.field('timestamp'), thirtyMinutesAgo))
      .order('desc')
      .take(50);
  },
});