# MentalWell Backend API

FastAPI backend service integrating the trained scikit-learn Random Forest regression model pipeline for student mental health score predictions.

## Architecture

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI instance, Lifespan handler, and CORS middleware
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Environment configuration via Pydantic BaseSettings
│   │   └── model_loader.py      # Singleton model manager (cached at startup)
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── health.py            # GET /api/v1/health
│   │   └── prediction.py        # POST /api/v1/predict
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── prediction.py        # Strict Pydantic input and output validation
│   └── services/
│       ├── __init__.py
│       └── prediction_service.py # Feature transformation and model inference
├── .env.example                 # Example environment variables
├── requirements.txt             # Dependency definitions
└── README.md
```

## Setup & Running

1. **Create and activate a virtual environment:**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start development server:**
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

4. **Interactive Documentation:**
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

## Endpoints

- `GET /` — API service details
- `GET /api/v1/health` — Service health & model load verification
- `POST /api/v1/predict` — Score prediction with Pydantic validation
