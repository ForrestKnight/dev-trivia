import { TriviaQuestion } from './types';

export let triviaQuestions: TriviaQuestion[] = [];

if (typeof process !== 'undefined' && process.env.TRIVIA_QUESTIONS) {
  try {
    triviaQuestions = JSON.parse(process.env.TRIVIA_QUESTIONS);
  } catch (error) {
    console.error('Error parsing TRIVIA_QUESTIONS:', error);
  }
}