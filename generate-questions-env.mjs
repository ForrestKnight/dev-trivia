import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the questions.config.ts file
const questionsConfigPath = join(__dirname, 'questions.config.ts');
const questionsConfigContent = readFileSync(questionsConfigPath, 'utf8');

// Extract the array from the file content
const questionsArrayMatch = questionsConfigContent.match(/export const triviaQuestions = (\[[\s\S]*?\]);/);

if (questionsArrayMatch && questionsArrayMatch[1]) {
  const questionsArray = eval(questionsArrayMatch[1]);
  
  // Convert the array to a JSON string
  const questionsJson = JSON.stringify(questionsArray);
  
  // Create or update the .env file
  const envContent = `TRIVIA_QUESTIONS='${questionsJson}'`;
  writeFileSync('.env', envContent);
  
  console.log('Successfully generated .env file with TRIVIA_QUESTIONS');
} else {
  console.error('Failed to extract questions array from questions.config.ts');
  process.exit(1);
}