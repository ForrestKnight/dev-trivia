# Dev Trivia

This project is a live, weekly developer trivia application built with Vite, React, Tailwind CSS, TypeScript, and Convex.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 14 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Git](https://git-scm.com/)

## Getting Started

Follow these steps to set up and run the project locally:

1. Clone the repository:
   ```
   git clone https://github.com/forrestknight/dev-trivia.git
   cd dev-trivia
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Convex:
   - If you haven't already, create a Convex account at [https://dashboard.convex.dev](https://dashboard.convex.dev)
   - Run the following command and follow the prompts to create a Convex project:
     ```
     npx convex dev
     ```

4. Set up Clerk (for authentication):
   - Follow the [Convex + Clerk](https://docs.convex.dev/auth/clerk) documentation.
   - Copy the Clerk publishable key and add it to your `.env.local` file:
     ```
     VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
     ```

5. Start the development server:
   ```
   npm run dev
   ```

This command will start both the frontend and backend servers concurrently.

## Project Structure

- `/src`: Contains the React frontend code
- `/convex`: Contains the Convex backend code
- `/public`: Contains public assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
