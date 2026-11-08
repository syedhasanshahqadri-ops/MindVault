# Mindvault — Personal AI Memory Space

A futuristic personal knowledge workspace starter with:
- React + Vite frontend
- Firebase Authentication (Google + email/password)
- Firestore per-user memory storage and security rules
- Express backend for AI chat (API key stays server-side)
- Memory capture, search, timeline, knowledge graph preview, voice input

## 1. Requirements
- Node.js 18+
- A Firebase project
- An AI API key for the assistant

## 2. Install

From the project root:

```bash
npm install
cd server
npm install
cd ..
```

## 3. Configure Firebase

1. Create a project at https://console.firebase.google.com/
2. Add a Web App and copy its config values.
3. In Firebase Authentication, enable **Google** and **Email/Password** providers.
4. Create a Firestore database.
5. Open Firestore Rules and publish the contents of `firestore.rules`.
6. Copy `.env.example` to `.env` in the project root and fill in the Firebase values.

The Firestore rules restrict each signed-in user to their own `/users/{uid}/memories` documents.

## 4. Configure the AI backend

In the same root `.env` file, set:

```env
OPENAI_API_KEY=your_real_key
OPENAI_MODEL=gpt-4.1-mini
PORT=8787
```

Keep this key private. Do not rename it to `VITE_OPENAI_API_KEY`, do not commit `.env`, and do not paste it into frontend code.

## 5. Run locally

Open two terminals in the project root.

Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
npm run server
```

Open http://localhost:5173

## Demo mode
You can choose **Explore the demo first** on the sign-in screen. Demo memories are stored only in browser memory and reset when the page reloads. Cloud sign-in and sync require Firebase configuration.

## Current build notes
- Google and email/password authentication are wired to Firebase, but require your Firebase project settings and enabled providers.
- AI chat is wired to a server endpoint, but requires a valid server-side API key.
- The knowledge graph currently provides a visual preview. Semantic relationship extraction is a planned next step.
- Voice input uses the browser Web Speech API where supported.
- This is a development starter, not a security-audited production service. Before public launch, add rate limiting, stricter CORS, server-side Firebase ID-token verification for the AI endpoint, abuse controls, monitoring, and privacy/retention settings.
# AI-MEMORY
