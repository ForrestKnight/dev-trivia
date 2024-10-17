import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const sendMessage = mutation({
  args: {
    gameId: v.id('triviaGames'),
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
  args: { gameId: v.id('triviaGames') },
  handler: async (ctx) => {
    return await ctx.db
      .query('chatMessages')
      .order('desc')
      .take(50);
  },
});