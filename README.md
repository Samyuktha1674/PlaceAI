# PlaceAI – Explainable AI-Driven Placement Readiness System

> Final Year Project | Computer Science & Engineering
> An intelligent decision support platform for students and institutions.

---

## 🗂️ Project Structure

```
placeai/
├── backend/           ← Python Flask API + ML
│   ├── app.py
│   ├── ml_engine.py
│   ├── seed_and_train.py
│   ├── requirements.txt
│   └── models/        ← auto-created
├── frontend/          ← React (Vite)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚡ Local Setup (VS Code)

### Prerequisites
- Python 3.10+
- Node.js 18+

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed database + train model (run ONCE)
python seed_and_train.py

# Start the backend server
python app.py
```

Backend runs at: **http://localhost:5000**

---

### 2. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

### 3. Demo Login

Go to http://localhost:5173 → Enter as Student → Use any demo ID:

| Student ID | Name         |
|------------|--------------|
| S001       | Rahul Sharma |
| S002       | Priya Patel  |
| S003       | Amit Kumar   |
| S004       | Sneha Reddy  |
| S005       | Arjun Singh  |
| S006       | Divya Iyer   |
| S007       | Karan Mehta  |
| S008       | Anjali Desai |

Institution portal: http://localhost:5173 → Enter as Institution

---

## 🚀 Deployment

### Backend → Render (free tier)

1. Push `backend/` folder to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. **Settings:**
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt && python seed_and_train.py`
   - Start command: `gunicorn app:app`
   - Environment: Python 3
5. Deploy → copy the URL (e.g. `https://placeai-backend.onrender.com`)

### Frontend → Vercel

1. Create file `frontend/.env.production`:
   ```
   VITE_API_URL=https://YOUR-RENDER-URL.onrender.com/api
   ```
2. Push `frontend/` to GitHub
3. Go to [vercel.com](https://vercel.com) → New Project → Import repo
4. **Settings:**
   - Framework: Vite
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Output directory: `dist`
5. Add environment variable: `VITE_API_URL` = your Render URL + `/api`
6. Deploy!

---

## 🧠 ML Architecture

| Component | Technology |
|-----------|-----------|
| Model | Random Forest (scikit-learn) |
| XAI | SHAP-inspired Feature Importance |
| Training data | 200 synthetic student records |
| Features | CGPA, Aptitude, Technical, Coding, Communication, Resume, Consistency, Internships, Projects, Attendance |
| Output | Readiness %, Risk Level, Salary Range, Company Matches |

---

## 📄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/student/login` | Student login |
| GET | `/api/student/:id/dashboard` | Dashboard data |
| GET | `/api/student/:id/analysis` | AI analysis + SHAP |
| GET | `/api/student/:id/skill-gaps` | Skill gap analysis |
| GET | `/api/student/:id/learning-path` | Learning path |
| POST | `/api/student/:id/what-if` | What-if simulation |
| GET | `/api/institution/dashboard` | Institution dashboard |
| GET | `/api/institution/students` | All students |
| GET | `/api/institution/batch-analytics` | Batch analytics |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Charts | Recharts |
| HTTP | Axios |
| Backend | Python Flask |
| ML | Scikit-learn (Random Forest) |
| Database | SQLite |
| Deployment | Vercel (frontend) + Render (backend) |

---

*This system focuses on decision support and transparent AI explanations. It does not guarantee placements.*
