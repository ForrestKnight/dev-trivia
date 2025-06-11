import { v } from "convex/values";
import { mutation, query } from "./_generated/server";



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

    // Get existing questions from the database (randomly select 10)
    const allQuestions = await ctx.db.query("triviaQuestions").collect();

    if (allQuestions.length === 0) {
      throw new Error("No questions available in database");
    }

    // Shuffle and take 10 questions
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, 10);
    const questionIds = selectedQuestions.map(q => q._id);

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
        const user = participant.userId ? await ctx.db.get(participant.userId) : null;
        return {
          name: user?.name || participant.name,
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
    // Get all finished games and their participants for a global leaderboard
    const allParticipants = await ctx.db
      .query("triviaParticipants")
      .collect();

    // Filter participants from finished games only
    const finishedGameParticipants = [];
    for (const participant of allParticipants) {
      const game = await ctx.db.get(participant.gameId);
      if (game && game.status === "finished") {
        finishedGameParticipants.push(participant);
      }
    }

    if (finishedGameParticipants.length === 0) {
      return null;
    }

    const leaderboard = await Promise.all(
      finishedGameParticipants.map(async (participant) => {
        const user = participant.userId ? await ctx.db.get(participant.userId) : null;
        return {
          name: user?.name || participant.name,
          score: participant.score,
          gameId: participant.gameId,
        };
      })
    );

    return leaderboard.sort((a, b) => b.score - a.score);
  },
});

// Generate random anonymous player names
function generateAnonymousName(): string {
  const adjectives = [
    "Swift", "Clever", "Ninja", "Cyber", "Digital", "Code", "Binary", "Quantum",
    "Pixel", "Logic", "Stealth", "Turbo", "Elite", "Prime", "Alpha", "Beta",
    "Gamma", "Delta", "Omega", "Neon", "Chrome", "Shadow", "Ghost", "Phantom",
    "Mystic", "Cosmic", "Atomic", "Electric", "Magnetic", "Sonic", "Hyper",
    "Ultra", "Mega", "Super", "Blazing", "Lightning", "Thunder", "Storm"
  ];

  const nouns = [
    "Coder", "Hacker", "Developer", "Programmer", "Engineer", "Architect", "Wizard",
    "Ninja", "Warrior", "Guardian", "Hunter", "Ranger", "Scout", "Agent", "Operative",
    "Pilot", "Captain", "Commander", "Chief", "Master", "Expert", "Guru", "Sage",
    "Phoenix", "Dragon", "Tiger", "Wolf", "Eagle", "Falcon", "Hawk", "Raven",
    "Viper", "Cobra", "Panther", "Lynx", "Fox", "Bear", "Lion", "Shark"
  ];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 999) + 1;

  return `${randomAdjective}${randomNoun}${randomNumber}`;
}

// Solo game functions for on-demand play
export const createSoloGame = mutation({
  args: {},
  handler: async (ctx) => {
    // Get existing questions from the database (randomly select 10)
    const allQuestions = await ctx.db.query("triviaQuestions").collect();

    if (allQuestions.length === 0) {
      throw new Error("No questions available in database");
    }

    // Shuffle and take 10 questions
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, 1);
    const questionIds = selectedQuestions.map(q => q._id);

    // Create the game without requiring authentication
    const gameId = await ctx.db.insert("triviaGames", {
      status: "in_progress", // Start immediately
      hostUserId: undefined, // No host for solo games
      startDateTime: new Date().toISOString(),
      endDateTime: undefined,
      currentQuestionIndex: 0,
      triviaQuestionIds: questionIds,
      weekNumber: Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)),
      questionStartedAt: Date.now(),
      isInReviewPhase: false,
    });

    // Create anonymous participant with random name
    await ctx.db.insert("triviaParticipants", {
      userId: undefined, // Anonymous user
      gameId: gameId,
      name: generateAnonymousName(),
      score: 0,
      answers: [],
    });

    return gameId;
  },
});

export const submitSoloAnswer = mutation({
  args: {
    gameId: v.id("triviaGames"),
    questionId: v.id("triviaQuestions"),
    answer: v.string(),
    timeRemaining: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "in_progress") {
      throw new Error("Game is not in progress");
    }

    const question = await ctx.db.get(args.questionId);
    if (!question) {
      throw new Error("Question not found");
    }

    // Find the anonymous participant for this game
    const participant = await ctx.db
      .query("triviaParticipants")
      .withIndex("by_game", q => q.eq("gameId", args.gameId))
      .first();

    if (!participant) {
      throw new Error("Participant not found");
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

export const moveToNextSoloQuestion = mutation({
  args: {
    gameId: v.id("triviaGames"),
    showReview: v.boolean(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.status !== "in_progress") {
      throw new Error("Game is not in progress");
    }

    if (args.showReview && !game.isInReviewPhase) {
      // Move to review phase
      await ctx.db.patch(args.gameId, {
        isInReviewPhase: true,
        questionStartedAt: Date.now(),
      });
      return { success: true, reviewPhase: true };
    }

    // Move to next question or finish game
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