# RAG Customer Support Chatbot

A Retrieval-Augmented Generation (RAG) chatbot built with **Node.js**, **Pinecone**, and **Google AI (Gemini)**.

---

## 🏗️ High-Level Design (HLD)

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        TWO PIPELINES                            │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────┐
  │       1. INGESTION PIPELINE      │   (Run once / on update)
  └──────────────────────────────────┘

   📄 Documents          🔪 Chunker           🤖 Google AI
  (PDF / TXT)    ──►   Split into      ──►   Embed each
  /documents            small chunks          chunk into
                        (~500 chars)          a vector


   📦 Pinecone
   Store vectors
   + metadata
   in index


  ┌──────────────────────────────────┐
  │        2. QUERY PIPELINE         │   (Every user message)
  └──────────────────────────────────┘

   👤 User              🤖 Google AI          📦 Pinecone
   Types a      ──►    Embed the       ──►   Search top-K
   question             question              similar chunks


   📝 Context           🧠 Gemini LLM         💬 Answer
   Build prompt  ──►   Generate        ──►   Sent back
   with chunks          answer                to user
```

---

## 🧩 Component Breakdown

| Component | Technology | Role |
|-----------|-----------|------|
| **API Server** | Express.js | Handles incoming chat requests |
| **Embedding Model** | Google AI `text-embedding-004` | Converts text → vectors |
| **Vector Database** | Pinecone | Stores & searches document vectors |
| **LLM** | Google Gemini `gemini-1.5-flash` | Generates final answer |
| **Document Loader** | `pdf-parse` / `fs` | Reads `.pdf` and `.txt` files |

---

## 🔁 Request Flow (Simple)

```
User Question
     │
     ▼
Express API  (/api/chat)
     │
     ▼
Embed Question  (Google AI)
     │
     ▼
Search Pinecone  (top-5 chunks)
     │
     ▼
Build Prompt  (question + context)
     │
     ▼
Gemini LLM  (generate answer)
     │
     ▼
Return Answer to User
```

---

## 📁 Project Structure

```
├── src/
│   ├── config/          → Environment & app settings
│   ├── services/        → Embedding, Pinecone, Chat logic
│   ├── routes/          → Express API routes
│   ├── middleware/      → Error handling
│   ├── utils/           → Text chunker
│   └── scripts/         → Data ingestion script
├── documents/           → Your support docs (PDF/TXT)
├── index.js             → Server entry point
└── .env                 → API keys (never commit this)
```

---

## ⚙️ Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Vector DB:** Pinecone
- **AI / Embeddings:** Google Generative AI (`@google/generative-ai`)
- **LLM:** Gemini 1.5 Flash
