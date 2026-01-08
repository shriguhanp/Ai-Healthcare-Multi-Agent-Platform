# AI Healthcare Multi-Agent Platform

A full-stack MERN (MongoDB, Express, React, Node.js) healthcare application featuring advanced AI agents for diagnostics and medication adherence coaching.

## 🚀 Features
- **User/Doctor/Admin Roles**: Comprehensive dashboard for all stakeholders.
- **Appointment Booking**: seamless scheduling system.
- **Diagnostic AI Agent**: RAG-based agent to answer symptom/disease questions using a verified medical dataset.
- **MASC Agent (Medication & Side-Effects Coach)**: AI coach for medication adherence and side-effect guidance.
- **Strict Guardrails**: AI agents utilize strict medical datasets and refuse to answer outside their domain.

## 🛠 Tech Stack
- **Frontend**: React, TailwindCSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI/LLM**: internal Node.js RAG Engine (LangChain + Ollama)
- **Datasets**: Custom PDF and CSV medical records

---

## 📋 Prerequisites
1. **Node.js**: [Download & Install](https://nodejs.org/)
2. **MongoDB**: local or Atlas connection string.
3. **Ollama**: [Download & Install](https://ollama.com/) for running local LLMs.
   - Run `ollama pull llama3` (Base model)
   - Run `ollama pull nomic-embed-text` (Optimized for embeddings, optional but recommended)

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/shriguhanp/ai-healthcare-multi-agent-platform.git
cd ai-healthcare-multi-agent-platform
```

### 2. Backend Setup
```bash
cd backend
npm install
```
- Create a `.env` file in `backend/` with the following:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```
- **Run the Server**:
```bash
npm run server
```
> **Note**: On the first run, the server will ingest the datasets (`DIAGNOSTIC.pdf` and `MASC.csv`). This may take a moment. Watch the console for "🚀 Initializing RAG Engine".

### 3. Frontend Setup
```bash
cd frontend
npm install
```
- Create a `.env` file in `frontend/` (optional, defaults to localhost):
```env
VITE_BACKEND_URL=http://localhost:5000
```
- **Run Frontend**:
```bash
npm run dev
```

### 4. Admin Panel Setup
```bash
cd admin
npm install
```
- **Run Admin Panel**:
```bash
npm run dev
```

---

## 🤖 AI System Details
The AI system uses a **Retrieval-Augmented Generation (RAG)** architecture running entirely within Node.js.
- **Engine**: LangChain.js
- **Vector Store**: In-memory (re-indexes on startup for simplicity)
- **Model**: Llama3 (via Ollama)
- **Datasets**:
  - `backend/datasets/DIAGNOSTIC.pdf`
  - `backend/datasets/MASC.csv`

### Troubleshooting AI
- **"Unable to get response"**: Ensure Ollama is running (`ollama serve`).
- **"System is initializing"**: Wait for the "✅ RAG Engine Ready!" message in the backend console.
- **Ollama Models**: If retrieval is poor, ensure you have the models: `ollama pull llama3`.

---

## 📄 License
This project is for educational purposes.
