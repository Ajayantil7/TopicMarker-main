# Topic Marker

<div align="center">

  <h3>Create, manage, and share lesson plans with AI-powered content generation</h3>
</div>

Topic Marker is a modern web application that leverages AI to help users create, manage, and share lesson plans with rich MDX content. The platform integrates with a RAG (Retrieval Augmented Generation) backend to intelligently generate high-quality content based on topics and subtopics.

## ✨ Features

- **Topic Hierarchy Management**: Create and organize topics and subtopics in a hierarchical structure
- **AI-Powered Content Generation**: Generate MDX content using different methods:
  - RAG-based content generation with web crawling
  - URL-based content generation
  - LLM-only content generation
- **Content Refinement**: Refine generated content using selection, crawling, or URLs
- **MDX Editor with Preview**: Edit MDX content with real-time preview
- **Lesson Plan Management**: Save, load, and manage lesson plans
- **Public Sharing**: Publish lesson plans for others to view
- **User Authentication**: Secure user authentication and authorization via Kinde
- **User Dashboard**: Manage your saved lesson plans

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime & package manager)
- PostgreSQL database
- [TopicMarker-RAG](https://github.com/aryankad1an/TopicMarker-RAG) backend service running on http://127.0.0.1:8000

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/topic_marker
KINDE_DOMAIN=your-kinde-domain
KINDE_CLIENT_ID=your-kinde-client-id
KINDE_CLIENT_SECRET=your-kinde-client-secret
KINDE_REDIRECT_URI=http://localhost:3000/api/callback
KINDE_LOGOUT_REDIRECT_URI=http://localhost:3000
RAG_SERVICE_URL=http://127.0.0.1:8000
```

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/topic-marker.git
cd topic-marker
```

2. Install dependencies:

```bash
bun install
cd frontend && bun install
```

3. Set up the database:

```bash
bun db:migrate
```

### Running the Application

1. Start the backend server:

```bash
bun dev
```

2. In a separate terminal, start the frontend development server:

```bash
cd frontend && bun dev
```

3. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Technologies

### Backend
- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [Hono](https://hono.dev/)
- **Database ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Database**: PostgreSQL
- **Authentication**: [Kinde](https://kinde.com/)

### Frontend
- **Framework**: [React](https://reactjs.org/)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **MDX Rendering**: Custom MDX renderer

### RAG Integration
- **Backend**: [TopicMarker-RAG](https://github.com/aryankad1an/TopicMarker-RAG) - A powerful Retrieval-Augmented Generation backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **LLM**: [Google Gemini](https://ai.google.dev/)
- **Vector Database**: [Pinecone](https://www.pinecone.io/)
- **Web Crawling**: [crawl4ai](https://github.com/crawl4ai/crawl4ai)
- **LLM Framework**: [LangChain](https://www.langchain.com/)

## 📦 Project Structure

```
topic-marker/
├── frontend/             # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── lib/          # Utility functions and API clients
│   │   ├── routes/       # Application routes
│   │   └── stores/       # State management
├── server/               # Bun/Hono backend server
│   ├── db/               # Database configuration and schemas
│   ├── routes/           # API routes
│   └── middleware/       # Server middleware
└── drizzle/              # Database migrations
```

## 🔌 RAG Integration API

The application integrates with the [TopicMarker-RAG](https://github.com/yourusername/TopicMarker-RAG) backend that provides the following key endpoints:

### Topic Generation
- **POST /rag/search-topics** - Generates a structured hierarchy of topics and subtopics

### MDX Generation
- **POST /rag/single-topic** - Generates MDX content using web crawling
- **POST /rag/generate-mdx-llm-only** - Generates MDX content using only LLM knowledge
- **POST /rag/generate-mdx-from-urls** - Generates MDX content from specific URLs

### Content Refinement
- **POST /rag/refine-with-selection** - Refines content using LLM with context
- **POST /rag/refine-with-crawling** - Refines content by crawling relevant websites
- **POST /rag/refine-with-urls** - Refines content using specific URLs

Each endpoint has a corresponding `-raw` version that returns plain text instead of JSON.

## 🚢 Deployment

The application is configured for deployment on [Fly.io](https://fly.io/):

```bash
fly deploy
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
