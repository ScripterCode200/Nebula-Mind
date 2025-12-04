# Nebula Mind 🌌

**Nebula Mind** is an advanced AI-powered "AI Powered Learning" application designed to revolutionize how you learn and organize information. Built with Next.js 15 and powered by cutting-edge AI models (Gemini, OpenAI, Ollama), it transforms your static documents into interactive knowledge bases.

> **Created by Shivam Saini as collage Assignment** 🎓

---

## 🚀 Key Features

### 🧠 AI-Powered Workspace
- **Chat with PDF**: Upload any document and have a natural conversation with it. Ask questions, get summaries, and clarify doubts instantly.
- **Context-Aware**: The AI understands the full context of your uploaded materials.

### ⚡ Smart Study Tools
- **Flashcard Generator**: Automatically generate high-quality flashcards from your notes to reinforce memory. Supports iterative generation for precision.
- **Mock Test Generator**: Create adaptive quizzes with mixed question types (MCQ, True/False, Short Answer) to test your knowledge.
- **AI Note Taker**: Generate structured study notes from your documents in seconds.

### 🛠️ Advanced Capabilities
- **Multi-Model Support**: Switch between **Google Gemini**, **OpenAI GPT-4o**, and **Ollama** (Local LLMs) seamlessly.
- **Real-time Streaming**: Experience instant feedback with character-by-character streaming responses.
- **Data Persistence**: All your chats, notes, flashcards, and test results are securely saved to the database.
- **Newsletter Subscription**: Stay updated with the built-in newsletter subscription feature.

### 🎨 Futuristic UI/UX
- **Glassmorphism Design**: A stunning, modern interface with glass effects and neon accents.
- **Responsive**: Fully optimized for all devices.
- **Smooth Animations**: Powered by Framer Motion for a fluid user experience.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Vanilla CSS (Variables)
- **Database**: MongoDB Atlas (Mongoose)
- **AI Integration**:
    - Google Generative AI SDK (Gemini)
    - OpenAI Node SDK
    - Ollama (Local LLMs)
- **UI Libraries**: Framer Motion, Lucide React, Sonner (Toasts)
- **PDF Handling**: pdf-parse, react-pdf

### 📦 Key Libraries Used

| Category | Library | Purpose |
|----------|---------|---------|
| **Core** | `next`, `react` | Framework and UI library |
| **AI** | `@google/generative-ai` | Google Gemini API integration |
| **AI** | `openai` | OpenAI API integration |
| **Database** | `mongoose` | MongoDB object modeling |
| **Animation** | `framer-motion` | Complex animations and transitions |
| **Icons** | `lucide-react` | Beautiful, consistent icons |
| **State** | `zustand` | Lightweight state management |
| **PDF** | `react-pdf`, `pdf2json` | Rendering and parsing PDF files |
| **Markdown** | `react-markdown` | Rendering AI responses |
| **Styling** | `tailwind-merge`, `clsx` | Utility for dynamic classes |
| **UI** | `sonner` | Toast notifications |
| **Scroll** | `lenis` | Smooth scrolling experience |
| **Upload** | `react-dropzone` | Drag and drop file uploads |

---

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ installed.
- A MongoDB Atlas account.
- API Keys for Google Gemini and/or OpenAI.
- (Optional) Ollama installed locally for local model support.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/nebula-mind.git
    cd nebula-mind
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add the following:
    ```env
    MONGODB_URI=your_mongodb_connection_string
    GEMINI_API_KEY=your_gemini_api_key
    OPENAI_API_KEY=your_openai_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under Shivam Saini.

---

*Build with ❤️ by Shivam Saini*
