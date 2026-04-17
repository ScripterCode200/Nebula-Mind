# Nebula Mind - Comprehensive Project Overview

## 1. Project Overview

**Nebula Mind** is an advanced, AI-powered learning application built with Next.js 15. Designed to revolutionize how users manage and assimilate information, the application seamlessly transforms static documents into interactive knowledge bases. By leveraging cutting-edge LLMs (Google Gemini, OpenAI GPT-4o, and local Ollama models), the platform provides rapid document analysis, smart study tool generation, and personalized learning experiences.

The core philosophy behind Nebula Mind is to blend AI capabilities with proven educational techniques and gamification, establishing a consistent daily learning habit backed by real-time progress tracking.

---

## 2. Core Features & Goals

### 🧠 AI-Powered Workspace
*   **Chat with Documents:** Upload PDFs and other resources to have a natural, context-aware conversation. Users can retrieve summaries, clarify complex concepts, and ask specific questions instantly.
*   **Multi-Model Support:** The application allows users to switch interchangeably between **Google Gemini**, **OpenAI**, and **Ollama** (for local, privacy-first processing).

### ⚡ Smart Study & Productivity Tools
*   **Flashcard Generator:** Automatically extracts key concepts from notes to create high-quality flashcards, reinforcing memory through active recall.
*   **Mock Test Generator:** Dynamically creates adaptive quizzes containing mixed question formats (Multiple Choice, True/False, Short Answer) to test user comprehension.
*   **AI Note Taker:** Distills lengthy documents into clean, structured study notes.
*   **Learning Booster:** Dedicated section for accelerated comprehension.

### 🎮 Gamification & Progress Tracking
*   **Study Streak:** A daily heartbeat system monitors consecutive login and study days, effectively building a daily learning habit.
*   **Time Focused:** Accumulates active usage time (via a 60-second visibility-checked heartbeat) to measure authentic dedication, rejecting background tab "farming."
*   **Knowledge Score (XP):** Rewards both passive studying (5 XP/min) and active content creation (e.g., creating notebooks [50 XP], completing tests [100 XP], AI chats [5 XP/msg]).
*   **Knowledge Growth Chart:** A 30-day dynamic visual representation of XP gain and time spent over time.
*   **Achievements:** Permanent badges (e.g., *Creator*, *Quiz Whiz*, *Focused*) unlocked by reaching active learning milestones.
*   **Leaderboard:** Fosters friendly competition among the user community.

### 🛠️ Platform & User Management
*   **Authentication & Profiles:** Complete login, signup, password reset, and user profile management flow.
*   **Billing / Subscriptions:** Built-in billing capabilities for premium limits/features.
*   **Admin Dashboard:** Dedicated administration portal for maintaining system integrity and reviewing metrics.
*   **Notifications:** Real-time updates and an integrated event log.

---

## 3. Technology Stack

*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, Vanilla CSS (Variables)
*   **Database:** MongoDB Atlas (accessed via Mongoose)
*   **AI Integration:** `@google/generative-ai`, `openai`, `Ollama` 
*   **Key Libraries:** Framer Motion (animations), Zustand (state management), `react-pdf` & `pdf2json` (PDF handling), Lenis (smooth scrolling), Sonner (Toasts), `react-markdown`.
*   **UI/UX:** Futuristic glassmorphism design with responsive elements and smooth transitions.

---

## 4. Potential Improvements

*   **Spaced Repetition System (SRS):** While flashcards exist, integrating a strict spaced repetition algorithm (like Anki) will significantly boost long-term memory retention by showing cards at mathematically optimal intervals.
*   **Detailed Analytics Dashboard:** Go beyond XP and Time Focused to provide granular insights on test performance, heavily missed topics, and recommended study paths based on identified weaknesses.
*   **Collaborative Learning Spaces:** Allow users to share specific notebooks, flashcard decks, or mock tests with friends, or study simultaneously in real-time rooms.
*   **Expanded File Format Support:** Instead of primarily focusing on PDFs, deeply integrate parsing for DOCX, PPTX, EPUB, and potentially direct YouTube URL transcriptions.
*   **RAG (Retrieval-Augmented Generation) Optimization:** If not currently using a dedicated vector database (like Pinecone or Weaviate), migrating document embeddings to a specialized DB could drastically improve the speed and accuracy of the "Chat with PDF" feature for extremely large knowledge bases.
*   **Offline Accessibility:** Implement a Progressive Web App (PWA) methodology to let users review downloaded flashcards or previously generated notes without an active internet connection.

---

## 5. Future Scope

*   **Cross-Platform Mobile Application:** Develop dedicated iOS and Android applications (potentially using React Native) to accommodate strictly mobile-first learners.
*   **LMS Integration:** Integrate deeply with institutional platforms like Canvas, Blackboard, or Google Classroom to automatically fetch syllabi and daily class readings.
*   **Voice-to-Text & Text-to-Speech:** Implement accessibility-first voice interactions allowing users to dictate questions and listen to AI summaries while commuting.
*   **Browser Extension:** Build a Chrome/Edge extension to instantly clip articles, blog posts, or research papers directly into a Nebula Mind notebook.
*   **AI Study Schedules:** Use historical learning data to automatically generate personalized, 30-day study schedules leading up to a specific exam date, dividing the notebook content into manageable daily chunks.
