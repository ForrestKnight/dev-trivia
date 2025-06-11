// NOTE: You can remove this file. Declaring the shape
// of the database is entirely optional in Convex.
// See https://docs.convex.dev/database/schemas.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    profileUrl: v.optional(v.string()),
    tokenIdentifier: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  triviaQuestions: defineTable({
    questionText: v.string(),
    choiceA: v.string(),
    choiceB: v.string(),
    choiceC: v.string(),
    choiceD: v.string(),
    correctChoice: v.string(),
    maxPoints: v.number(),
  }),

  triviaGames: defineTable({
    status: v.string(), // "waiting", "in_progress", "finished"
    hostUserId: v.optional(v.id("users")), // Optional for solo games
    startDateTime: v.optional(v.string()),
    endDateTime: v.optional(v.string()),
    currentQuestionIndex: v.number(),
    triviaQuestionIds: v.array(v.id("triviaQuestions")),
    weekNumber: v.number(),
    questionStartedAt: v.number(),
    isInReviewPhase: v.boolean(),
  }).index("by_status", ["status"]),

  triviaParticipants: defineTable({
    userId: v.optional(v.id("users")), // Optional for anonymous players
    gameId: v.id("triviaGames"),
    name: v.string(),
    score: v.number(),
    answers: v.array(v.object({
      questionId: v.id("triviaQuestions"),
      answerSubmitted: v.string(),
      timeRemaining: v.number(),
      pointsEarned: v.number(),
    })),
  }).index("by_game", ["gameId"])
    .index("by_user_and_game", ["userId", "gameId"])
    .index("by_user", ["userId"]),

  chatMessages: defineTable({
    userId: v.string(),
    username: v.string(),
    content: v.string(),
    timestamp: v.string(),
  }).index("by_game", ["timestamp"]),
    
}, { schemaValidation: true });