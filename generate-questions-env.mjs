import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting generate-questions-env script');

try {
  let triviaQuestionsJson;

  // Check if questions.config.ts exists (local environment)
  const questionsConfigPath = join(__dirname, 'questions.config.ts');
  if (existsSync(questionsConfigPath)) {
    console.log('questions.config.ts found, reading questions from file');
    const questionsConfigContent = readFileSync(questionsConfigPath, 'utf8');
    const match = questionsConfigContent.match(/export const triviaQuestions = (\[[\s\S]*?\]);/);
    
    if (match && match[1]) {
      triviaQuestionsJson = JSON.stringify(eval(match[1]));
    } else {
      throw new Error('Failed to extract triviaQuestions from questions.config.ts');
    }
  } 
  // Check if TRIVIA_QUESTIONS environment variable exists (Vercel environment)
  else if (process.env.TRIVIA_QUESTIONS) {
    console.log('TRIVIA_QUESTIONS environment variable found');
    triviaQuestionsJson = process.env.TRIVIA_QUESTIONS;
  } 
  else {
    throw new Error('Neither questions.config.ts nor TRIVIA_QUESTIONS environment variable found');
  }

  // Create or update the .env file with the questions
  const envContent = `TRIVIA_QUESTIONS='${triviaQuestionsJson}'`;
  writeFileSync('.env', envContent);
  
  console.log('Successfully generated .env file with TRIVIA_QUESTIONS');
} catch (error) {
  console.error('Error generating TRIVIA_QUESTIONS:', error);
  process.exit(1);
}