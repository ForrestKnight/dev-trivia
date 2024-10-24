import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { triviaQuestions } from './triviaQuestions';
import { TriviaQuestion } from './types';

// Only Forrest can create a game
export const createTriviaGame = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Not authorized to create a game");
    }

    const userData = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", user.tokenIdentifier))
      .unique();
    
    if (!userData) {
      throw new Error("Not authorized to create a game");
    }

    const questionIds = await Promise.all(
      triviaQuestions.map((question: TriviaQuestion) => ctx.db.insert("triviaQuestions", question))
    );

    const gameId = await ctx.db.insert("triviaGames", {
      status: "waiting",
      hostUserId: userData._id,
      startDateTime: undefined,
      endDateTime: undefined,
      currentQuestionIndex: 0,
      triviaQuestionIds: questionIds,
      weekNumber: Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)),
      questionStartedAt: 0,
      isInReviewPhase: false,
    });

    await ctx.db.insert("triviaParticipants", {
      userId: userData._id,
      gameId: gameId,
      name: userData.name,
      score: 0,
      answers: [],
    });

    return gameId;
  },
});

export const getAvailableGame = query({
  args: {},
  handler: async (ctx) => {
    const availableGame = await ctx.db
      .query("triviaGames")
      .filter(q => q.eq(q.field("status"), "waiting"))
      .first();
    
    return availableGame;
  },
});

export const joinTriviaGame = mutation({
  args: { gameId: v.id("triviaGames") },
  handler: async (ctx, args) => {
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

    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "waiting") {
      throw new Error("Game not available for joining");
    }

    // Check if the user has already joined
    const existingParticipant = await ctx.db
      .query("triviaParticipants")
      .withIndex("by_user_and_game", (q) => 
        q.eq("userId", user._id).eq("gameId", args.gameId)
      )
      .unique();

    if (existingParticipant) {
      return { success: true };
    }

    await ctx.db.insert("triviaParticipants", {
      userId: user._id,
      gameId: args.gameId,
      name: user.name,
      score: 0,
      answers: [],
    });

    return { success: true };
  },
});

export const getTriviaGame = query({
  args: { gameId: v.id("triviaGames") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      return null;
    }

    const questions = await Promise.all(
      game.triviaQuestionIds.map(async (id) => {
        const question = await ctx.db.get(id);
        return question;
      })
    );

    const participants = await ctx.db
      .query("triviaParticipants")
      .withIndex("by_game", (q) => q.eq("gameId", args.gameId))
      .collect();

    return { game, questions, participants };
  },
});

export const startTriviaGame = mutation({
  args: { gameId: v.id("triviaGames") },
  handler: async (ctx, args) => {
    
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

    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.hostUserId !== user._id) {
      throw new Error("Not authorized to start the game");
    }

    if (game.status !== "waiting") {
      throw new Error(`Cannot start game with status: ${game.status}`);
    }

    const startDateTime = new Date();
    const endDateTime = new Date(startDateTime.getTime() + game.triviaQuestionIds.length * (20 + 3) * 1000); // amount of questions, 20 seconds each, 3 second review phase

    await ctx.db.patch(args.gameId, {
      status: "in_progress",
      startDateTime: startDateTime.toISOString(),
      endDateTime: endDateTime.toISOString(),
      questionStartedAt: Date.now(),
      isInReviewPhase: false,
    });
    return { success: true, gameId: args.gameId };
  },
});

export const moveToReviewPhase = mutation({
  args: { gameId: v.id("triviaGames") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "in_progress") {
      throw new Error("Game is not in progress");
    }

    if (!user || user._id !== game.hostUserId) {
      throw new Error("Only host can move to next question");
    }

    await ctx.db.patch(args.gameId, {
      isInReviewPhase: true,
      questionStartedAt: Date.now(),
    })

    return { success: true };
  }
})

export const submitAnswer = mutation({
  args: {
    gameId: v.id("triviaGames"),
    questionId: v.id("triviaQuestions"),
    answer: v.string(),
    timeRemaining: v.number(),
  },
  handler: async (ctx, args) => {
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

    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "in_progress") {
      throw new Error("Game is not in progress");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    let participant = await ctx.db
      .query("triviaParticipants")
      .withIndex("by_user_and_game", q => 
        q.eq("userId", user._id)
         .eq("gameId", args.gameId)
      )
      .unique();

    if (!participant) {
      // If participant is not found, create a new one
      const participantId = await ctx.db.insert("triviaParticipants", {
        userId: user._id,
        gameId: args.gameId,
        name: user.name,
        score: 0,
        answers: [],
      });
      participant = await ctx.db.get(participantId);
    }

    if (!participant) {
      throw new Error("Failed to create or find participant");
    }

    // Check if the answer for this question has already been submitted
    const existingAnswer = participant.answers.find(a => a.questionId === args.questionId);
    if (existingAnswer) {
      return { success: true, pointsEarned: existingAnswer.pointsEarned, message: "Answer already submitted" };
    }

    const isCorrect = question.correctChoice === args.answer;
    const pointsEarned = isCorrect ? Math.round(args.timeRemaining) : 0;

    await ctx.db.patch(participant._id, {
      score: (participant.score || 0) + pointsEarned,
      answers: [
        ...(participant.answers || []),
        {
          questionId: args.questionId,
          answerSubmitted: args.answer,
          timeRemaining: args.timeRemaining,
          pointsEarned,
        },
      ],
    });

    return { success: true, pointsEarned };
  },
});

export const moveToNextQuestion = mutation({
  args: { gameId: v.id("triviaGames") },
  handler: async (ctx, args) => {

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", q => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "in_progress") {
      throw new Error("Game is not in progress");
    }

    if (!user || user._id !== game.hostUserId) {
      throw new Error("Only host can move to next question");
    }

    const nextQuestionIndex = game.currentQuestionIndex + 1;

    if (nextQuestionIndex >= game.triviaQuestionIds.length) {
      await ctx.db.patch(args.gameId, { 
        status: "finished",
        currentQuestionIndex: nextQuestionIndex - 1
      });
      return { gameFinished: true, newQuestionIndex: nextQuestionIndex - 1 };
    }

    await ctx.db.patch(args.gameId, {
      currentQuestionIndex: nextQuestionIndex,
      questionStartedAt: Date.now(),
      isInReviewPhase: false,
    });

    return { success: true, newQuestionIndex: nextQuestionIndex };
  },
});

export const getLeaderboard = query({
  args: { gameId: v.id("triviaGames") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("triviaParticipants")
      .withIndex("by_game", q => q.eq("gameId", args.gameId))
      .collect();

    const leaderboard = await Promise.all(
      participants.map(async participant => {
        const user = await ctx.db.get(participant.userId);
        return {
          name: user?.name,
          score: participant.score,
        };
      })
    );

    return leaderboard.sort((a, b) => b.score - a.score);
  },
});

export const getMostRecentGameLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const mostRecentGame = await ctx.db
      .query("triviaGames")
      .filter((q) => q.eq(q.field("status"), "finished"))
      .order("desc")
      .first();

    if (!mostRecentGame) {
      return null;
    }

    const participants = await ctx.db
      .query("triviaParticipants")
      .withIndex("by_game", (q) => q.eq("gameId", mostRecentGame._id))
      .collect();

    const leaderboard = participants
      .map((participant) => ({
        name: participant.name,
        score: participant.score,
      }))
      .sort((a, b) => b.score - a.score);

    return leaderboard;
  },
});

export const getCurrentGame = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .first();

    if (!user) return null;

    const participations = await ctx.db
      .query('triviaParticipants')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    for (const participation of participations) {
      const game = await ctx.db.get(participation.gameId);
      if (game && (game.status === 'waiting' || game.status === 'in_progress')) {
        return game._id;
      }
    }
    return null;
  },
});