export const GAME_STATE_STRINGS = {
  SEARCH: "Searching for available battles...",
  CREATE: "No battle found. Creating a new one...",
  JOIN: "Battle found! Joining battle...",
};

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const TRIVIA_GAME_TIMING = {
  QUESTION_DURATION: 20, // seconds
  REVIEW_DURATION: 3, // seconds
  TIMER_UPDATE_INTERVAL: 100, // milliseconds
};

export const CHAT_CONSTANTS = {
  MESSAGE_RETENTION: 30 * 60 * 1000, // 30 minutes in milliseconds
  MAX_MESSAGES: 50,
  ERROR_DISPLAY_DURATION: 3000, // 3 seconds in milliseconds
};
