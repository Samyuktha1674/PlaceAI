"""
Run once: python3 seed_and_train.py
Creates placeai.db and trains the ML model.
"""
import os, sqlite3, json
import numpy as np

DB_PATH    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "placeai.db")
MODEL_DIR  = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

FEATURES = ["cgpa","aptitude_score","technical_score","coding_score",
            "communication_score","resume_quality","consistency_score",
            "internships","projects","attendance"]

np.random.seed(42)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DROP TABLE IF EXISTS past_students")
    c.execute("DROP TABLE IF EXISTS current_students")
    c.execute("""CREATE TABLE past_students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, email TEXT, student_id TEXT,
        cgpa REAL, aptitude_score REAL, technical_score REAL,
        coding_score REAL, communication_score REAL,
        resume_quality REAL, consistency_score REAL,
        internships INTEGER, projects INTEGER, attendance REAL,
        placed INTEGER, company TEXT, package REAL, batch_year INTEGER
    )""")
    c.execute("""CREATE TABLE current_students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, email TEXT, student_id TEXT,
        cgpa REAL, aptitude_score REAL, technical_score REAL,
        coding_score REAL, communication_score REAL,
        resume_quality REAL, consistency_score REAL,
        internships INTEGER, projects INTEGER, attendance REAL,
        readiness_score REAL, risk_level TEXT,
        placement_probability REAL, expected_salary_min REAL, expected_salary_max REAL
    )""")
    conn.commit(); conn.close()
    print("✅ Database tables created")

def clamp(v, lo, hi): return max(lo, min(hi, v))

def gen_past_students(n=300):
    rows = []
    companies = ["TCS","Infosys","Wipro","Accenture","Cognizant","HCL","Tech Mahindra","Capgemini","IBM","Zoho"]
    packages  = [3.5, 3.8, 4.0, 4.5, 5.0, 6.0, 7.0, 8.0, 10.0, 12.0]
    for i in range(n):
        cgpa  = round(np.random.uniform(5.5, 9.8), 1)
        ap    = clamp(int(np.random.normal(65,15)), 30, 100)
        tech  = clamp(int(np.random.normal(63,18)), 30, 100)
        code  = clamp(int(np.random.normal(60,20)), 30, 100)
        comm  = clamp(int(np.random.normal(68,14)), 30, 100)
        res   = clamp(int(np.random.normal(65,15)), 30, 100)
        cons  = clamp(int(np.random.normal(68,12)), 30, 100)
        intern= int(np.random.choice([0,1,2,3], p=[0.25,0.45,0.20,0.10]))
        proj  = int(np.random.choice([0,1,2,3,4,5], p=[0.05,0.15,0.28,0.25,0.17,0.10]))
        att   = round(np.random.uniform(55, 98), 1)
        # Weighted score determines placement
        score = (cgpa*0.15*10 + ap*0.12 + tech*0.18 + code*0.15 +
                 comm*0.12 + res*0.07 + cons*0.07 +
                 intern*33*0.08 + proj*20*0.04 + att*0.02) + np.random.normal(0,4)
        placed = 1 if score > 64 else 0
        co, pkg = "", 0.0
        if placed:
            idx = clamp(int((score-64)/4), 0, len(companies)-1)
            co, pkg = companies[idx], packages[idx]
        rows.append((f"Student_{i+1:03d}", f"student{i+1:03d}@college.edu",
                     f"P{i+1:03d}", cgpa, ap, tech, code, comm, res, cons,
                     intern, proj, att, placed, co, pkg,
                     int(np.random.choice([2022,2023,2024]))))
    return rows

def insert_past(rows):
    conn = sqlite3.connect(DB_PATH)
    conn.executemany("""INSERT INTO past_students
        (name,email,student_id,cgpa,aptitude_score,technical_score,coding_score,
         communication_score,resume_quality,consistency_score,internships,projects,
         attendance,placed,company,package,batch_year) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", rows)
    conn.commit(); conn.close()
    print(f"✅ {len(rows)} past students inserted")

def insert_current():
    students = [
        # name, email, sid, cgpa, apt, tech, code, comm, res, cons, intern, proj, att
        ("Rahul Sharma",  "rahul@university.edu",  "S001", 7.8, 72, 68, 65, 75, 70, 72, 1, 3, 88.0),
        ("Priya Patel",   "priya@university.edu",  "S002", 8.5, 80, 82, 78, 85, 80, 82, 2, 4, 92.0),
        ("Amit Kumar",    "amit@university.edu",   "S003", 7.2, 65, 62, 60, 70, 65, 68, 1, 2, 80.0),
        ("Sneha Reddy",   "sneha@university.edu",  "S004", 8.0, 76, 74, 72, 78, 75, 76, 2, 3, 90.0),
        ("Arjun Singh",   "arjun@university.edu",  "S005", 6.5, 55, 52, 50, 60, 55, 58, 0, 1, 72.0),
        ("Divya Iyer",    "divya@university.edu",  "S006", 8.8, 84, 86, 82, 88, 84, 86, 2, 5, 95.0),
        ("Karan Mehta",   "karan@university.edu",  "S007", 6.8, 58, 55, 52, 62, 58, 60, 0, 2, 75.0),
        ("Anjali Desai",  "anjali@university.edu", "S008", 7.5, 73, 70, 68, 74, 72, 73, 1, 3, 85.0),
    ]
    conn = sqlite3.connect(DB_PATH)
    conn.executemany("""INSERT INTO current_students
        (name,email,student_id,cgpa,aptitude_score,technical_score,coding_score,
         communication_score,resume_quality,consistency_score,internships,projects,attendance)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""", students)
    conn.commit(); conn.close()
    print(f"✅ {len(students)} current students inserted (S001-S008)")

def train_model(rows):
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score
        import joblib

        X = np.array([[r[3],r[4],r[5],r[6],r[7],r[8],r[9],r[10],r[11],r[12]] for r in rows])
        y = np.array([r[13] for r in rows])

        # Check both classes exist
        if len(set(y)) < 2:
            print("⚠️  Only one class in training data — skipping model training")
            return

        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        scaler = StandardScaler()
        X_tr_s = scaler.fit_transform(X_tr)
        X_te_s = scaler.transform(X_te)

        model = RandomForestClassifier(n_estimators=200, max_depth=10,
                                       min_samples_leaf=3, random_state=42,
                                       class_weight="balanced")
        model.fit(X_tr_s, y_tr)
        acc = accuracy_score(y_te, model.predict(X_te_s))
        print(f"✅ Model trained | Accuracy: {acc:.1%}")

        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(model,  os.path.join(MODEL_DIR,"placement_model.pkl"))
        joblib.dump(scaler, os.path.join(MODEL_DIR,"scaler.pkl"))

        fi = dict(zip(FEATURES, model.feature_importances_.tolist()))
        with open(os.path.join(MODEL_DIR,"feature_importances.json"),"w") as f:
            json.dump(fi, f, indent=2)
        print("✅ Model, scaler, and feature importances saved")
    except ImportError:
        print("⚠️  scikit-learn not installed — formula-based prediction will be used")

if __name__ == "__main__":
    print("🚀 Setting up PlaceAI database and training ML model...")
    init_db()
    rows = gen_past_students(300)
    insert_past(rows)
    insert_current()
    train_model(rows)
    print("\n✅ Setup complete! Now run: python3 app.py")
