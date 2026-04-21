"""
PlaceAI - Complete Flask Backend
Run: python3 app.py
"""
import os, sqlite3, json, math, random
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["*"])

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "placeai.db")

# ── JSON serialiser (handles numpy types) ────────────────────────────────────
def clean(obj):
    if isinstance(obj, dict):   return {k: clean(v) for k, v in obj.items()}
    if isinstance(obj, list):   return [clean(v) for v in obj]
    if isinstance(obj, (np.integer,)):  return int(obj)
    if isinstance(obj, (np.floating,)): 
        v = float(obj)
        return 0.0 if (v != v) else round(v, 2)  # NaN → 0
    if isinstance(obj, np.ndarray): return clean(obj.tolist())
    return obj

def jresp(data, code=200):
    return app.response_class(
        response=json.dumps(clean(data), ensure_ascii=False),
        status=code, mimetype='application/json'
    )

# ── Database ──────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def row2dict(row):
    return {k: row[k] for k in row.keys()}

def get_student(sid):
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM current_students WHERE UPPER(student_id)=?",
        (str(sid).upper(),)
    ).fetchone()
    conn.close()
    return row2dict(row) if row else None

# ── ML Engine (inline, no imports needed) ─────────────────────────────────────
FEATURES = ["cgpa","aptitude_score","technical_score","coding_score",
            "communication_score","resume_quality","consistency_score",
            "internships","projects","attendance"]

LABELS = {
    "cgpa":"CGPA","aptitude_score":"Aptitude Score",
    "technical_score":"Technical Skills","coding_score":"Coding Score",
    "communication_score":"Communication Skills","resume_quality":"Resume Quality",
    "consistency_score":"Consistency Score","internships":"Internships",
    "projects":"Projects","attendance":"Attendance"
}

WEIGHTS = {
    "cgpa":0.15,"aptitude_score":0.12,"technical_score":0.18,"coding_score":0.15,
    "communication_score":0.12,"resume_quality":0.07,"consistency_score":0.07,
    "internships":0.08,"projects":0.04,"attendance":0.02
}

INDUSTRY_AVG = {
    "cgpa":75,"aptitude_score":72,"technical_score":70,"coding_score":70,
    "communication_score":72,"resume_quality":70,"consistency_score":70,
    "internships":50,"projects":60,"attendance":80
}

BENCHMARKS = {
    "TCS":     {"cgpa":60,"aptitude_score":70,"technical_score":65,"coding_score":65,"communication_score":70,"resume_quality":70,"consistency_score":65,"internships":33,"projects":60,"attendance":75},
    "Infosys": {"cgpa":60,"aptitude_score":72,"technical_score":68,"coding_score":68,"communication_score":72,"resume_quality":72,"consistency_score":68,"internships":33,"projects":60,"attendance":75},
    "Wipro":   {"cgpa":55,"aptitude_score":65,"technical_score":62,"coding_score":62,"communication_score":65,"resume_quality":65,"consistency_score":62,"internships":0, "projects":40,"attendance":70},
    "Zoho":    {"cgpa":65,"aptitude_score":80,"technical_score":82,"coding_score":85,"communication_score":70,"resume_quality":75,"consistency_score":75,"internships":33,"projects":80,"attendance":80},
    "Accenture":{"cgpa":58,"aptitude_score":70,"technical_score":70,"coding_score":68,"communication_score":75,"resume_quality":70,"consistency_score":68,"internships":33,"projects":60,"attendance":75},
}

def sf(v):
    try: return float(v)
    except: return 0.0

def norm(key, val):
    v = sf(val)
    if key == "cgpa":        return min(v * 10, 100.0)
    if key == "internships": return min(v / 3 * 100, 100.0)
    if key == "projects":    return min(v / 5 * 100, 100.0)
    return min(max(v, 0.0), 100.0)

# Try to load trained sklearn model
_model = _scaler = None
def _load_model():
    global _model, _scaler
    if _model is not None: return
    try:
        import joblib
        mp = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "placement_model.pkl")
        sp = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "scaler.pkl")
        if os.path.exists(mp) and os.path.exists(sp):
            _model  = joblib.load(mp)
            _scaler = joblib.load(sp)
            print("✅ Sklearn model loaded")
    except Exception as e:
        print(f"⚠️ Could not load model: {e}, using formula")

def predict(student):
    _load_model()
    data = {k: sf(student.get(k, 0)) for k in FEATURES}
    n    = {k: norm(k, data[k]) for k in FEATURES}

    # Placement probability
    prob = None
    if _model and _scaler:
        try:
            feats = np.array([[data[k] for k in FEATURES]])
            fs    = _scaler.transform(feats)
            pr    = _model.predict_proba(fs)[0]
            classes = list(_model.classes_)
            if 1 in classes:
                prob = float(pr[classes.index(1)])
            elif len(pr) >= 2:
                prob = float(pr[1])
        except Exception as e:
            print(f"Model predict error: {e}")
            prob = None

    if prob is None:
        raw  = sum(n[k] * WEIGHTS[k] for k in FEATURES)
        # Sigmoid centred at 65 → good scores give high probability
        prob = 1.0 / (1.0 + math.exp(-(raw - 65.0) / 10.0))

    prob = max(0.01, min(0.99, prob))

    # Readiness score (0-100)
    wn       = sum(n[k] * WEIGHTS[k] for k in FEATURES)
    readiness = round(min(max(0.5 * prob * 100 + 0.5 * wn, 5.0), 95.0), 1)

    risk = ("Low Risk" if readiness >= 72 else
            "Medium Risk" if readiness >= 52 else "High Risk")

    if readiness >= 80:   sal = (6.0, 12.0)
    elif readiness >= 65: sal = (4.0, 7.0)
    elif readiness >= 50: sal = (3.5, 5.0)
    else:                 sal = (2.5, 4.0)

    # Company matches
    companies = []
    for co, bench in BENCHMARKS.items():
        hits = sum(1 for k in FEATURES if n[k] >= bench.get(k, 0) * 0.85)
        companies.append((co, round(hits / len(FEATURES) * 100)))
    companies.sort(key=lambda x: -x[1])

    # Feature importance (SHAP-like)
    fi = []
    for k in FEATURES:
        w   = WEIGHTS[k]
        s   = n[k]
        avg = INDUSTRY_AVG[k]
        fi.append({
            "feature": k, "label": LABELS[k],
            "weight": round(w * 100, 1),
            "your_score": round(s, 1),
            "industry_avg": avg,
            "impact": round(w * 20, 2),
            "direction": "positive" if s >= avg else "negative",
            "raw_value": data[k],
        })
    fi.sort(key=lambda x: -x["impact"])

    # Detailed breakdown
    breakdown = []
    for item in fi:
        s = item["your_score"]
        if s >= 78:   st, adv = "Strong",            "This is one of your strengths. Keep maintaining this level."
        elif s >= 60: st, adv = "Moderate",          "You are at an average level. Small improvements can make a difference."
        else:         st, adv = "Needs Improvement", "This area needs attention. Consider focusing on improvement here."
        breakdown.append({**item, "status": st, "advice": adv})

    # Areas below industry average
    attention = [
        {"label": i["label"], "gap": round(INDUSTRY_AVG[i["feature"]] - i["your_score"], 1)}
        for i in fi if i["your_score"] < INDUSTRY_AVG[i["feature"]]
    ][:3]

    return {
        "readiness_score":         readiness,
        "risk_level":              risk,
        "placement_probability":   round(prob * 100, 1),
        "expected_salary_min":     sal[0],
        "expected_salary_max":     sal[1],
        "top_companies":           [{"name": c, "rank": i+1} for i,(c,_) in enumerate(companies[:3])],
        "feature_importance":      fi,
        "detailed_breakdown":      breakdown,
        "areas_needing_attention": attention,
    }

def skill_gaps(student):
    data = {k: sf(student.get(k, 0)) for k in FEATURES}
    n    = {k: norm(k, data[k]) for k in FEATURES}
    req  = {k: round(float(np.mean([b[k] for b in BENCHMARKS.values()])), 1) for k in FEATURES}

    ACTIONS = {
        "cgpa":               "Study consistently. Attend all classes and revise previous topics regularly.",
        "aptitude_score":     "Practice 20 aptitude questions daily. Use IndiaBix or RS Aggarwal book.",
        "technical_score":    "Study OS, DBMS, CN, OOPs concepts. Watch Gate Smashers on YouTube.",
        "coding_score":       "Solve 2 LeetCode problems daily. Follow Striver's DSA sheet (180 problems).",
        "communication_score":"Join Toastmasters or college debate club. Practice mock interviews weekly.",
        "resume_quality":     "Use a clean ATS-friendly template. Quantify achievements and add GitHub links.",
        "consistency_score":  "Set a daily study schedule. Use Notion or Google Calendar to track progress.",
        "internships":        "Apply on Internshala, LinkedIn, and company career pages immediately.",
        "projects":           "Build 2-3 full-stack projects. Host on GitHub. Add to your resume.",
        "attendance":         "Attend all classes. Most companies have 75% attendance cutoff.",
    }

    gaps = []
    for k in FEATURES:
        s, r = n[k], req[k]
        gap  = round(r - s, 1)
        mag  = abs(gap)
        pri  = "High" if mag > 15 else ("Medium" if mag > 5 else "Low")
        gaps.append({
            "skill": LABELS[k], "feature": k,
            "current": round(s, 1), "required": r,
            "industry_avg": INDUSTRY_AVG[k],
            "gap": gap, "gap_magnitude": round(mag, 1),
            "priority": pri,
            "color": "red" if pri=="High" else ("orange" if pri=="Medium" else "green"),
            "your_progress": round(min(s / max(r, 1) * 100, 100), 1),
            "recommended_action": ACTIONS.get(k, "Focus on this area."),
        })
    gaps.sort(key=lambda x: -x["gap_magnitude"])

    return {
        "total_skills":         len(gaps),
        "high_priority_gaps":   sum(1 for g in gaps if g["priority"]=="High"),
        "medium_priority_gaps": sum(1 for g in gaps if g["priority"]=="Medium"),
        "average_gap_score":    round(float(np.mean([g["gap_magnitude"] for g in gaps])), 1),
        "gaps": gaps,
    }

def learning_path(student, gaps_data):
    MODULES = {
        "coding_score":        {"title":"Data Structures & Algorithms","description":"Arrays, linked lists, trees, graphs, DP — 200+ problems on LeetCode & Striver sheet","duration":"8 weeks","resources":3,"progress":35},
        "technical_score":     {"title":"Core CS Subjects (OS, DBMS, CN, OOPs)","description":"Complete revision of all core subjects asked in technical interviews","duration":"6 weeks","resources":3,"progress":20},
        "aptitude_score":      {"title":"Aptitude & Logical Reasoning","description":"Quantitative, verbal, logical — using RS Aggarwal and IndiaBix practice","duration":"5 weeks","resources":3,"progress":40},
        "communication_score": {"title":"Communication & Interview Skills","description":"Group discussions, HR interviews, presentation skills, body language","duration":"4 weeks","resources":3,"progress":50},
        "projects":            {"title":"Real-World Project Building","description":"Build 3 full-stack projects: E-commerce, Dashboard, Chat App — host on GitHub","duration":"10 weeks","resources":3,"progress":15},
        "resume_quality":      {"title":"Resume & LinkedIn Optimisation","description":"ATS-friendly resume, LinkedIn profile, personal branding, portfolio website","duration":"2 weeks","resources":3,"progress":60},
    }

    high   = [g["feature"] for g in gaps_data["gaps"] if g["priority"]=="High"]
    medium = [g["feature"] for g in gaps_data["gaps"] if g["priority"]=="Medium"]
    order  = high + medium + [k for k in MODULES if k not in high+medium]

    mods, used, num = [], set(), 1
    for feat in order:
        if feat in MODULES and feat not in used and num <= 5:
            m = {**MODULES[feat], "module_num": num, "feature": feat,
                 "priority": "High" if feat in high else "Medium",
                 "skills_covered": 2}
            mods.append(m); used.add(feat); num += 1

    weeks = sum(int(m["duration"].split()[0]) for m in mods)
    prog  = round(float(np.mean([m["progress"] for m in mods]))) if mods else 0

    return {
        "total_modules": len(mods), "in_progress": len(mods),
        "completed": 0, "overall_progress": prog,
        "estimated_weeks": weeks, "modules": mods,
        "study_schedule": {
            "weekdays": "2-3 hours daily on High Priority modules",
            "weekends": "4-5 hours on projects and coding practice",
            "daily":    "Solve at least 2 coding problems",
            "weekly":   "Take 1 mock test and review mistakes",
        },
        "success_tips": [
            "Focus on High Priority modules first",
            "Track progress weekly and adjust study plan",
            "Practice consistently — avoid last-minute cramming",
            "Build projects while learning — theory + practice together",
        ],
    }

def what_if(student, changes):
    mod = {**student, **{k: sf(v) for k,v in changes.items() if k in FEATURES}}
    orig = predict(student)
    sim  = predict(mod)
    keys = ["cgpa","aptitude_score","technical_score","communication_score","coding_score"]
    return {
        "original": orig, "simulated": sim,
        "readiness_change":   round(sim["readiness_score"]   - orig["readiness_score"],   1),
        "probability_change": round(sim["placement_probability"] - orig["placement_probability"], 1),
        "salary_impact":      round(sim["expected_salary_max"]   - orig["expected_salary_max"],   1),
        "new_risk_level":     sim["risk_level"],
        "simulation_data": [
            {"label": LABELS[k], "feature": k,
             "current":   round(norm(k, sf(student.get(k,0))), 1),
             "simulated": round(norm(k, sf(mod.get(k,0))),     1)}
            for k in keys
        ],
    }

def batch_analytics(students):
    if not students:
        return {
            "total_students":0,"avg_readiness":0,"predicted_placement":0,"at_risk_students":0,
            "risk_distribution":{"Low Risk":{"count":0,"pct":0},"Medium Risk":{"count":0,"pct":0},"High Risk":{"count":0,"pct":0}},
            "score_distribution":{"50-60":0,"60-70":0,"70-80":0,"80-90":0,"90-100":0},
            "common_weakness":[{"skill":"Coding & DSA","percentage":45},{"skill":"Technical Skills","percentage":38},{"skill":"Projects","percentage":35},{"skill":"Aptitude","percentage":30},{"skill":"Communication","percentage":25}],
            "historical_trends":[{"year":"2023","avg_readiness":68,"placement_rate":62},{"year":"2024","avg_readiness":70,"placement_rate":65},{"year":"2025","avg_readiness":71,"placement_rate":67},{"year":"2026 (Pred)","avg_readiness":72,"placement_rate":68}],
            "training_recommendations":["DSA Boot Camp (45% need it)","Technical Skills Workshop (38%)","Project Guidance Program (35%)"],
            "students_on_track":0,"avg_skill_improvement":12.0,"year_growth":5.9,"placement_growth":9.7,
        }

    rc = {"Low Risk":0,"Medium Risk":0,"High Risk":0}
    rs, pp = [], []
    for s in students:
        try:
            p = predict(s)
            rc[p["risk_level"]] += 1
            rs.append(p["readiness_score"])
            pp.append(p["placement_probability"])
        except Exception as e:
            print(f"Batch predict error: {e}")

    total = len(students)
    bins  = {"50-60":0,"60-70":0,"70-80":0,"80-90":0,"90-100":0}
    for r in rs:
        if   r < 60: bins["50-60"]  += 1
        elif r < 70: bins["60-70"]  += 1
        elif r < 80: bins["70-80"]  += 1
        elif r < 90: bins["80-90"]  += 1
        else:        bins["90-100"] += 1

    return {
        "total_students":      total,
        "avg_readiness":       round(float(np.mean(rs)), 1) if rs else 0,
        "predicted_placement": round(float(np.mean(pp)), 1) if pp else 0,
        "at_risk_students":    rc["High Risk"] + rc["Medium Risk"],
        "risk_distribution":   {k:{"count":v,"pct":round(v/max(total,1)*100)} for k,v in rc.items()},
        "score_distribution":  bins,
        "common_weakness":[{"skill":"Coding & DSA","percentage":45},{"skill":"Technical Skills","percentage":38},{"skill":"Projects","percentage":35},{"skill":"Aptitude","percentage":30},{"skill":"Communication","percentage":25}],
        "historical_trends":[{"year":"2023","avg_readiness":68,"placement_rate":62},{"year":"2024","avg_readiness":70,"placement_rate":65},{"year":"2025","avg_readiness":71,"placement_rate":67},{"year":"2026 (Pred)","avg_readiness":72,"placement_rate":68}],
        "training_recommendations":["DSA Boot Camp (45% need it)","Technical Skills Workshop (38%)","Project Guidance Program (35%)"],
        "students_on_track":    round(rc["Low Risk"]/max(total,1)*100),
        "avg_skill_improvement":12.0,"year_growth":5.9,"placement_growth":9.7,
    }

def save_pred(sid, pred):
    conn = get_db()
    conn.execute("""UPDATE current_students SET
        readiness_score=?, risk_level=?, placement_probability=?,
        expected_salary_min=?, expected_salary_max=?
        WHERE UPPER(student_id)=?""",
        (pred["readiness_score"], pred["risk_level"], pred["placement_probability"],
         pred["expected_salary_min"], pred["expected_salary_max"], str(sid).upper()))
    conn.commit(); conn.close()

# ── ROUTES ────────────────────────────────────────────────────────────────────
@app.route("/api/health")
def health():
    return jresp({"status":"ok","message":"PlaceAI backend is running"})

@app.route("/api/student/login", methods=["POST","GET"])
def student_login():
    if request.method == "POST":
        d   = request.get_json(silent=True) or {}
        sid = str(d.get("student_id","")).strip().upper()
    else:
        sid = request.args.get("student_id","").strip().upper()
    if not sid: return jresp({"error":"student_id required"},400)
    s = get_student(sid)
    if not s: return jresp({"error":f"Student {sid} not found"},404)
    return jresp(s)

@app.route("/api/student/<sid>/profile", methods=["GET"])
def profile_get(sid):
    s = get_student(sid)
    if not s: return jresp({"error":"Not found"},404)
    return jresp(s)

@app.route("/api/student/<sid>/profile", methods=["PUT"])
def profile_update(sid):
    d = request.get_json(silent=True) or {}
    conn = get_db()
    conn.execute("""UPDATE current_students SET
        cgpa=?,aptitude_score=?,technical_score=?,coding_score=?,
        communication_score=?,resume_quality=?,consistency_score=?,
        internships=?,projects=?,attendance=?
        WHERE UPPER(student_id)=?""",
        (sf(d.get("cgpa")),sf(d.get("aptitude_score")),sf(d.get("technical_score")),
         sf(d.get("coding_score")),sf(d.get("communication_score")),sf(d.get("resume_quality")),
         sf(d.get("consistency_score")),sf(d.get("internships")),sf(d.get("projects")),
         sf(d.get("attendance")),str(sid).upper()))
    conn.commit(); conn.close()
    s = get_student(sid)
    if s:
        try: save_pred(sid, predict(s))
        except: pass
    return jresp({"message":"Profile updated and prediction recomputed"})

@app.route("/api/student/<sid>/dashboard")
def dashboard(sid):
    s = get_student(sid)
    if not s: return jresp({"error":"Not found"},404)
    try:
        p = predict(s)
        save_pred(sid, p)
        return jresp({"student":s,**{k:p[k] for k in ["readiness_score","risk_level","placement_probability","expected_salary_min","expected_salary_max","top_companies","areas_needing_attention"]}})
    except Exception as e:
        import traceback; traceback.print_exc()
        return jresp({"error":str(e)},500)

@app.route("/api/student/<sid>/analysis")
def analysis(sid):
    s = get_student(sid)
    if not s: return jresp({"error":"Not found"},404)
    try:
        p = predict(s)
        save_pred(sid, p)
        return jresp({**p,"student_name":s["name"]})
    except Exception as e:
        import traceback; traceback.print_exc()
        return jresp({"error":str(e)},500)

@app.route("/api/student/<sid>/skill-gaps")
def skill_gaps_route(sid):
    s = get_student(sid)
    if not s: return jresp({"error":"Not found"},404)
    try:    return jresp(skill_gaps(s))
    except Exception as e: return jresp({"error":str(e)},500)

@app.route("/api/student/<sid>/learning-path")
def learning_path_route(sid):
    s = get_student(sid)
    if not s: return jresp({"error":"Not found"},404)
    try:
        g = skill_gaps(s)
        return jresp(learning_path(s, g))
    except Exception as e: return jresp({"error":str(e)},500)

@app.route("/api/student/<sid>/what-if", methods=["POST"])
def what_if_route(sid):
    s = get_student(sid)
    if not s: return jresp({"error":"Not found"},404)
    d = request.get_json(silent=True) or {}
    try:    return jresp(what_if(s, d.get("changes",{})))
    except Exception as e: return jresp({"error":str(e)},500)

@app.route("/api/predict/live", methods=["POST"])
def predict_live():
    d = request.get_json(silent=True) or {}
    if not str(d.get("name","")).strip():
        return jresp({"error":"Name is required"},400)
    for f in FEATURES:
        if str(d.get(f,"")).strip() == "":
            return jresp({"error":f"Missing field: {f}"},400)
        d[f] = sf(d[f])
    try:
        p = predict(d)
        g = skill_gaps(d)
        lp= learning_path(d, g)
        return jresp({
            "student_name": d["name"], **p,
            "skill_gaps": g,
            "learning_path_summary": {
                "total_modules":   lp["total_modules"],
                "estimated_weeks": lp["estimated_weeks"],
                "top_module":      lp["modules"][0]["title"] if lp["modules"] else "",
            }
        })
    except Exception as e:
        import traceback; traceback.print_exc()
        return jresp({"error":str(e)},500)

@app.route("/api/student/register", methods=["POST"])
def register():
    d    = request.get_json(silent=True) or {}
    name = str(d.get("name","")).strip()
    if not name: return jresp({"error":"Name required"},400)
    for f in FEATURES: d[f] = sf(d.get(f,0))
    conn = get_db()
    count  = conn.execute("SELECT COUNT(*) FROM current_students").fetchone()[0]
    new_id = f"S{count+1:03d}"
    conn.execute("""INSERT INTO current_students
        (name,email,student_id,cgpa,aptitude_score,technical_score,coding_score,
         communication_score,resume_quality,consistency_score,internships,projects,attendance)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (name, str(d.get("email","")), new_id,
         d["cgpa"],d["aptitude_score"],d["technical_score"],d["coding_score"],
         d["communication_score"],d["resume_quality"],d["consistency_score"],
         d["internships"],d["projects"],d["attendance"]))
    conn.commit(); conn.close()
    d["student_id"] = new_id
    try:
        p  = predict(d)
        g  = skill_gaps(d)
        lp = learning_path(d, g)
        save_pred(new_id, p)
        return jresp({"student_id":new_id,"student_name":name,**p,"skill_gaps":g,
            "learning_path_summary":{"total_modules":lp["total_modules"],"estimated_weeks":lp["estimated_weeks"],"top_module":lp["modules"][0]["title"] if lp["modules"] else ""}})
    except Exception as e: return jresp({"error":str(e)},500)

@app.route("/api/institution/dashboard")
def inst_dashboard():
    conn = get_db()
    rows = [row2dict(r) for r in conn.execute("SELECT * FROM current_students").fetchall()]
    conn.close()
    try:
        a = batch_analytics(rows)
        return jresp({**a,"students":rows})
    except Exception as e: return jresp({"error":str(e)},500)

@app.route("/api/institution/students")
def inst_students():
    conn = get_db()
    rows = [row2dict(r) for r in conn.execute("SELECT * FROM current_students").fetchall()]
    conn.close()
    result = []
    for s in rows:
        try:
            p = predict(s)
            s["readiness_score"]       = p["readiness_score"]
            s["risk_level"]            = p["risk_level"]
            s["placement_probability"] = p["placement_probability"]
            att = p.get("areas_needing_attention",[])
            s["top_weakness"] = att[0]["label"] if att else "None"
        except: pass
        result.append(s)
    return jresp(result)

@app.route("/api/institution/batch-analytics")
def batch_analytics_route():
    conn = get_db()
    rows = [row2dict(r) for r in conn.execute("SELECT * FROM current_students").fetchall()]
    conn.close()
    try:    return jresp(batch_analytics(rows))
    except Exception as e: return jresp({"error":str(e)},500)

@app.route("/api/institution/upload-batch", methods=["POST"])
def upload_batch():
    d        = request.get_json(silent=True) or {}
    students = d.get("students",[])
    if not students: return jresp({"error":"No student data"},400)
    conn = get_db()
    saved, errors = [], []
    for i, row in enumerate(students):
        try:
            name  = str(row.get("name","")).strip() or f"Student_{i+1}"
            email = str(row.get("email","")).strip() or f"s{i+1}@batch.edu"
            for f in FEATURES: row[f] = sf(row.get(f,0))
            count  = conn.execute("SELECT COUNT(*) FROM current_students").fetchone()[0]
            new_id = f"B{count+1:03d}"
            conn.execute("""INSERT INTO current_students
                (name,email,student_id,cgpa,aptitude_score,technical_score,coding_score,
                 communication_score,resume_quality,consistency_score,internships,projects,attendance)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (name,email,new_id,row["cgpa"],row["aptitude_score"],row["technical_score"],
                 row["coding_score"],row["communication_score"],row["resume_quality"],
                 row["consistency_score"],row["internships"],row["projects"],row["attendance"]))
            conn.commit()
            row["student_id"]=new_id; row["name"]=name; saved.append(row)
        except Exception as e:
            errors.append({"row":i+1,"error":str(e)})
    conn.close()
    try:    a = batch_analytics(saved)
    except: a = {}
    return jresp({"saved_count":len(saved),"error_count":len(errors),"errors":errors,"analytics":a})

@app.route("/api/students")
def list_students():
    conn = get_db()
    rows = [row2dict(r) for r in conn.execute("SELECT student_id,name,email FROM current_students").fetchall()]
    conn.close()
    return jresp(rows)

@app.route("/api/past-students")
def past_students():
    conn = get_db()
    rows = [row2dict(r) for r in conn.execute("SELECT * FROM past_students LIMIT 50").fetchall()]
    conn.close()
    return jresp(rows)

if __name__ == "__main__":
    port = int(os.environ.get("PORT",5000))
    print(f"🚀 PlaceAI Backend starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
