# MentalWell — Project Architecture & Structure

**MentalWell** is an AI-powered student mental health prediction and wellness platform. The project is organized into clean, separated tiers: machine learning core, FastAPI backend, and modern React frontend.

---

## High-Level Overview

```
Mental-Health-Score/
├── Mental_Health_Model.pkl                     # Pre-trained ML pipeline (RandomForestRegressor)
├── ML_Project.ipynb                            # Training notebook & exploratory data analysis
├── Student Social Media And Mental Health...   # Benchmark dataset (CSV)
├── main.py                                     # Lightweight legacy root FastAPI server
├── requirements.txt                            # Root Python dependencies
├── README.md                                   # Repository introduction
├── PROJECT_STRUCTURE.md                        # Architectural documentation (this file)
│
├── backend/                                    # Active FastAPI backend service
│   ├── app/
│   │   ├── core/                               # Config, DB manager, security, ML loader
│   │   ├── db/                                 # Indexes and database lifecycle
│   │   ├── routers/                            # API routes (Auth, ML, Journal, Chat, Community, Dashboard)
│   │   ├── schemas/                            # Pydantic v2 validation models
│   │   ├── services/                           # Business logic layer
│   │   └── main.py                             # FastAPI application entry point
│   ├── scripts/                                # Maintenance scripts (e.g. reset_password.py)
│   ├── tests/                                  # Pytest automated test suites
│   ├── requirements.txt                        # Backend dependencies
│   └── .env                                    # Backend environment configuration
│
└── frontend/                                   # Active React 18 + Vite frontend
    ├── public/                                 # Static assets (favicons, SVG)
    ├── src/
    │   ├── api/                                # Axios/fetch API client modules
    │   ├── components/                         # UI components (Navbar, Footer, Modals, Cards)
    │   ├── context/                            # React AuthContext (JWT state & persistence)
    │   ├── pages/                              # Routed pages (Dashboard, Assessment, Journal, Chat, Community)
    │   ├── App.jsx                             # Router setup & protected route guards
    │   ├── main.jsx                            # React DOM entry point
    │   └── index.css                           # Tailwind CSS & design system tokens
    ├── package.json                            # Frontend npm scripts & dependencies
    ├── vite.config.js                          # Vite configuration & API proxy
    └── tailwind.config.js                      # Tailwind styling configuration
```

---

## Directory Responsibilities

### 1. Root Directory (`/`)
* **`Mental_Health_Model.pkl`**: Serialized scikit-learn ML pipeline (`Pipeline` with imputation, one-hot encoding, and `RandomForestRegressor`) predicting student mental health score (0.0 to 10.0).
* **`ML_Project.ipynb`**: Complete Jupyter notebook containing feature engineering, correlation analysis, and model training.
* **`Student Social Media And Mental Health Impact.csv`**: Source dataset used for model training and benchmarking.
* **`main.py`**: Original standalone FastAPI script used for early model inspection and direct `/predict` inference.
* **`requirements.txt`**: Minimal requirements for running root training and standalone inference scripts.

### 2. Backend Service (`backend/`)
Built with **FastAPI**, **PyMongo Async**, **Pydantic v2**, and **Argon2id (pwdlib)**.

* **`app/main.py`**: Initializes FastAPI, configures CORS, handles MongoDB connection lifecycle, and mounts all v1 routers under `/api/v1`.
* **`app/core/`**:
  * `config.py`: Environment-driven settings (MongoDB URI, JWT secrets, Gemini API key, model path).
  * `database.py`: Async MongoDB connection pool management (`DatabaseManager`).
  * `model_loader.py`: Cached in-memory singleton for the scikit-learn ML pipeline.
  * `security.py`: Argon2id password hashing and PyJWT access token generation/validation.
* **`app/routers/`**:
  * `auth.py`: Registration, login, and current-user profile endpoints (`/auth/register`, `/auth/login`, `/auth/me`).
  * `predictions.py`: Authenticated ML assessments with history tracking (`/predictions`).
  * `prediction.py`: Backward-compatible public inference (`/predict`).
  * `dashboard.py`: Aggregated wellness summary metrics for the user dashboard (`/dashboard/summary`).
  * `journals.py`: Daily mood and journal CRUD entries (`/journals`).
  * `chat.py`: Gemini AI conversational wellness assistant with session history (`/chat`).
  * `community.py`: Peer support community feed, comments, reactions, and anonymous posting (`/community`).
  * `health.py`: Healthcheck endpoint reporting database, model, and server status (`/health`).
* **`app/services/`**: Business logic implementations isolated from HTTP transport.
* **`app/db/indexes.py`**: Automated creation of MongoDB indexes (unique emails, user timestamps, community indexes).

### 3. Frontend Application (`frontend/`)
Built with **React 18**, **Vite**, **Tailwind CSS**, and **Lucide React**.

* **`src/pages/`**:
  * `HomePage.jsx`: Landing page explaining features, score metrics, and science.
  * `LoginPage.jsx` / `RegisterPage.jsx`: Authentication views with validation and error feedback.
  * `DashboardPage.jsx`: Authenticated overview of user's latest score, streak, journal quick-entry, and insights.
  * `AssessmentPage.jsx`: 12-question wellness survey feeding directly into the scikit-learn model.
  * `JournalPage.jsx`: Personal reflection log with mood tagging and entry history.
  * `ChatPage.jsx`: Real-time conversational AI wellness coach powered by Google Gemini.
  * `CommunityPage.jsx`: Student peer support forum with category filtering, heart reactions, comments, and anonymous posting.
  * `ResourcesPage.jsx`: Verified student mental health helplines and crisis contacts.
  * `ProfilePage.jsx`: User profile settings and assessment history log.
* **`src/context/AuthContext.jsx`**: Global authentication state, JWT storage, automatic login persistence, and logout handlers.
* **`src/api/`**: Modular API service clients forwarding requests through Vite's `/api` proxy.

---

## Running the Application

### Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Frontend
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Web application will be accessible at: [http://127.0.0.1:5173](http://127.0.0.1:5173)
