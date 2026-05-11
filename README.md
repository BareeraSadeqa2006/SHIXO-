# SHIXO — AI-Powered Government Teacher Transfer & Workforce Management Platform

A full-stack, enterprise-grade government portal for managing teacher transfer requests, AI-based transfer prediction, workforce monitoring, and intelligent allocation of government teachers.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router, Recharts
- **Backend**: FastAPI (Python)
- **Machine Learning**: Scikit-learn (Random Forest Classifier)
- **Database**: SQLite

## Features

- Role-based login (Teacher / MEO)
- AI transfer eligibility prediction with explainable reasons
- Smart school recommendation engine
- Priority-based transfer workflow
- Mandal-level workforce analytics
- Automatic transfer order generation
- Real-time notification system
- Responsive government-style UI

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend initializes the SQLite database and trains the ML model automatically on first startup.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Demo Credentials

After the backend starts, visit `http://localhost:8000/test_credentials` for demo login credentials. Passwords follow the format:
- Teachers: ID `TCH00001`, password `tch00001`
- MEOs: ID `MEO001`, password `meo001`

## Project Structure

```
SHIXO-/
├── backend/
│   ├── main.py              # FastAPI application with all endpoints
│   ├── database.py           # SQLite database setup and seed data
│   ├── generate_data.py      # Legacy data generator
│   ├── train_model.py        # Legacy ML training script
│   ├── requirements.txt
│   └── data/                 # Generated CSV data
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main app with React Router
│   │   ├── api.js            # API client
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   └── MEODashboard.jsx
│   │   └── index.css         # Tailwind + theme config
│   ├── package.json
│   └── vite.config.js
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | POST | Authenticate teacher or MEO |
| `/teacher/{id}` | GET | Get teacher profile |
| `/predict_transfer` | POST | AI transfer prediction |
| `/recommend_school` | POST | Smart school recommendations |
| `/apply_transfer` | POST | Submit transfer request |
| `/approve_transfer` | POST | MEO approves transfer |
| `/reject_transfer` | POST | MEO rejects transfer |
| `/meo/{id}/dashboard` | GET | MEO dashboard data |
| `/notifications/{id}` | GET | Teacher notifications |
| `/dashboard_stats` | GET | Global statistics |
| `/workforce_stats` | GET | Workforce analytics |
| `/download_transfer_pdf/{id}` | GET | Download transfer order |
