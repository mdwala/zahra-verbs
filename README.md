# Zahra's Language Adventure

This is a language learning game designed to help children improve their descriptive vocabulary. It was created based on the plan in `PLAN.md`.

The application is built with a React frontend and a Node.js (Express) backend.

**Due to the development environment, dependencies were not installed. You will need to do this manually.**

## How to Run This Project

You will need to have [Node.js](https://nodejs.org/) installed on your computer.

### 1. Run the Backend Server

The backend server is responsible for communicating with the AI (currently mocked).

```bash
# Navigate to the backend directory
cd zahra-verbs/backend

# Install dependencies
npm install

# Start the server
npm start
```

The backend will be running on `http://localhost:3001`.

**Important:** Before you get real results, you must open `zahra-verbs/backend/server.js` and replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual Gemini API key. The Gemini API is already integrated, so you just need to provide the key.

### 2. Run the Frontend Application

The frontend is the main web application that you will interact with in the browser.

```bash
# Open a NEW terminal window/tab
# Navigate to the frontend directory
cd zahra-verbs

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be running on a local port, typically `http://localhost:5173`. Open this URL in your web browser to use the app.

## How to Use the App

1.  **Select a Profile:** Click on a user profile to start.
2.  **Listen to the Question:** The robot character will ask a question out loud.
3.  **Answer the Question:** Press and hold the microphone button and speak your answer. Release the button when you are finished.
4.  **Get Your Score:** The app will evaluate your answer and show you a score and feedback.
5.  **Play Again:** Click the "Play Again" button to try another round.

Your progress (score and level) is saved automatically in your browser.
