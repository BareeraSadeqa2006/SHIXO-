"""
SHIXO - AI-Powered Government Teacher Transfer & Workforce Management Platform
FastAPI Backend
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import uuid
import ast
import hashlib
from datetime import datetime

import pandas as pd
import numpy as np
import joblib

from database import get_db, init_db, seed_db, DB_PATH, hash_password

app = FastAPI(title="SHIXO API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
PDF_DIR = os.path.join(os.path.dirname(__file__), "pdfs")
model = None
le_subject = None
feature_cols = None


# ── Pydantic Models ──────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    user_id: str
    password: str
    role: str

class PredictRequest(BaseModel):
    teacher_id: str

class ApplyTransferRequest(BaseModel):
    teacher_id: str
    requested_school: str
    transfer_reason: str

class ApproveTransferRequest(BaseModel):
    request_id: str
    meo_id: str

class RejectTransferRequest(BaseModel):
    request_id: str
    meo_id: str
    rejection_reason: str

class RecommendSchoolRequest(BaseModel):
    teacher_id: str


# ── Startup ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    global model, le_subject, feature_cols
    init_db()
    seed_db()
    os.makedirs(MODEL_DIR, exist_ok=True)
    os.makedirs(PDF_DIR, exist_ok=True)

    model_path = os.path.join(MODEL_DIR, "transfer_model.pkl")
    if not os.path.exists(model_path):
        train_model_from_db()

    if os.path.exists(model_path):
        model = joblib.load(model_path)
        le_subject = joblib.load(os.path.join(MODEL_DIR, "label_encoder_subject.pkl"))
        feature_cols = joblib.load(os.path.join(MODEL_DIR, "feature_cols.pkl"))


def train_model_from_db():
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder
    from sklearn.metrics import accuracy_score, confusion_matrix

    conn = get_db()
    rows = conn.execute("SELECT * FROM teachers").fetchall()
    conn.close()

    data = []
    for r in rows:
        score = compute_priority(dict(r))
        recommended = 1 if score >= 45 else 0
        data.append({
            "years_of_service": r["years_of_service"],
            "rural_service_years": r["rural_service_years"],
            "transfer_request": r["transfer_request"],
            "medical_condition": r["medical_condition"],
            "spouse_distance": r["spouse_distance"],
            "promotion_due": r["promotion_due"],
            "subject": r["subject"],
            "recommended": recommended
        })

    df = pd.DataFrame(data)
    le = LabelEncoder()
    df["subject_encoded"] = le.fit_transform(df["subject"])

    cols = [
        "years_of_service", "rural_service_years", "transfer_request",
        "medical_condition", "spouse_distance", "promotion_due", "subject_encoded"
    ]

    X = df[cols]
    y = df["recommended"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(clf, os.path.join(MODEL_DIR, "transfer_model.pkl"))
    joblib.dump(le, os.path.join(MODEL_DIR, "label_encoder_subject.pkl"))
    joblib.dump(cols, os.path.join(MODEL_DIR, "feature_cols.pkl"))

    metrics = {
        "accuracy": round(acc * 100, 2),
        "confusion_matrix": cm.tolist(),
        "feature_importance": dict(zip(cols, clf.feature_importances_.tolist()))
    }
    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f)

    print(f"Model trained. Accuracy: {acc*100:.2f}%")


# ── Helpers ──────────────────────────────────────────────────────────────────

def compute_priority(row: dict) -> float:
    score = 0
    if row.get("transfer_request", 0) == 1:
        score += 30
    if row.get("medical_condition", 0) == 1:
        score += 25
    if row.get("years_of_service", 0) >= 5:
        score += 20
    if row.get("rural_service_years", 0) >= 3:
        score += 15
    if row.get("promotion_due", 0) == 1:
        score += 10
    if row.get("years_of_service", 0) >= 10:
        score += 10
    if row.get("spouse_distance", 0) > 200:
        score += 20
    return min(score, 100)


def get_transfer_reasons(row: dict) -> list:
    reasons = []
    if row.get("transfer_request", 0) == 1:
        reasons.append("Teacher has submitted a formal transfer request")
    if row.get("medical_condition", 0) == 1:
        reasons.append("Medical condition requires transfer consideration")
    if row.get("years_of_service", 0) >= 5:
        reasons.append(f"Completed {row['years_of_service']} years of service (≥5 years)")
    if row.get("rural_service_years", 0) >= 3:
        reasons.append(f"Completed {row['rural_service_years']} years of rural service")
    if row.get("promotion_due", 0) == 1:
        reasons.append("Promotion due — eligible for upgraded posting")
    if row.get("spouse_distance", 0) > 200:
        reasons.append(f"Spouse located {row['spouse_distance']} km away")
    if not reasons:
        reasons.append("Routine transfer cycle review")
    return reasons


def add_notification(teacher_id: str, message: str, ntype: str = "info"):
    conn = get_db()
    conn.execute(
        "INSERT INTO notifications (teacher_id, message, type) VALUES (?, ?, ?)",
        (teacher_id, message, ntype)
    )
    conn.commit()
    conn.close()


def generate_transfer_pdf(request_id: str) -> str:
    conn = get_db()
    req = conn.execute(
        "SELECT * FROM transfer_requests WHERE request_id = ?", (request_id,)
    ).fetchone()
    if not req:
        conn.close()
        return ""

    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (req["teacher_id"],)
    ).fetchone()

    old_school = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (req["current_school"],)
    ).fetchone()

    new_school = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (req["requested_school"],)
    ).fetchone()
    conn.close()

    if not teacher or not old_school or not new_school:
        return ""

    pdf_filename = f"transfer_order_{request_id}.txt"
    pdf_path = os.path.join(PDF_DIR, pdf_filename)

    now = datetime.now().strftime("%d-%m-%Y")
    content = f"""
================================================================================
                    GOVERNMENT OF TELANGANA
              DEPARTMENT OF SCHOOL EDUCATION
                  TRANSFER ORDER
================================================================================

Order No: SHIXO/TO/{request_id}
Date: {now}

TRANSFER ORDER

This is to certify that the following transfer has been approved under the
Government Teacher Transfer Management System (SHIXO).

TEACHER DETAILS:
─────────────────────────────────────────────────────────
Name            : {teacher['name']}
Teacher ID      : {teacher['teacher_id']}
Subject         : {teacher['subject']}
Gender          : {teacher['gender']}
Years of Service: {teacher['years_of_service']}

TRANSFER DETAILS:
─────────────────────────────────────────────────────────
From School     : {old_school['school_name']}
                  Mandal: {old_school['mandal']}
                  District: {old_school['district']}

To School       : {new_school['school_name']}
                  Mandal: {new_school['mandal']}
                  District: {new_school['district']}

Transfer Reason : {req['transfer_reason']}
Priority Score  : {req['priority_score']}
Request Date    : {req['request_date']}
Approval Date   : {req['approval_date']}

APPROVED BY:
─────────────────────────────────────────────────────────
MEO ID          : {req['assigned_meo']}
Status          : APPROVED

This order is generated electronically through the SHIXO platform.
No physical signature is required.

─────────────────────────────────────────────────────────
                    [OFFICIAL SEAL]
          Mandal Education Officer
          Department of School Education
          Government of Telangana
================================================================================
"""
    with open(pdf_path, "w") as f:
        f.write(content)

    conn2 = get_db()
    conn2.execute(
        "UPDATE transfer_requests SET generated_pdf_path = ? WHERE request_id = ?",
        (pdf_path, request_id)
    )
    conn2.commit()
    conn2.close()

    return pdf_path


# ── Auth Endpoints ───────────────────────────────────────────────────────────

@app.post("/login")
def login(req: LoginRequest):
    conn = get_db()
    hashed = hash_password(req.password)

    if req.role == "teacher":
        user = conn.execute(
            "SELECT * FROM teachers WHERE teacher_id = ? AND password = ?",
            (req.user_id, hashed)
        ).fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        conn.close()
        return {
            "success": True,
            "role": "teacher",
            "user_id": user["teacher_id"],
            "name": user["name"],
            "mandal": user["mandal"],
        }
    elif req.role == "meo":
        user = conn.execute(
            "SELECT * FROM meos WHERE meo_id = ? AND password = ?",
            (req.user_id, hashed)
        ).fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid credentials")
        conn.close()
        return {
            "success": True,
            "role": "meo",
            "user_id": user["meo_id"],
            "name": user["name"],
            "assigned_mandal": user["assigned_mandal"],
        }
    else:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid role")


# ── Teacher Endpoints ────────────────────────────────────────────────────────

@app.get("/teacher/{teacher_id}")
def get_teacher_profile(teacher_id: str):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")

    school = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (teacher["current_school"],)
    ).fetchone()
    conn.close()

    t = dict(teacher)
    del t["password"]
    t["school_name"] = school["school_name"] if school else "N/A"
    t["school_district"] = school["district"] if school else "N/A"
    t["school_student_strength"] = school["student_strength"] if school else 0
    t["school_teacher_count"] = school["current_teacher_count"] if school else 0
    return t


@app.post("/predict_transfer")
def predict_transfer(req: PredictRequest):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (req.teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")
    conn.close()

    t = dict(teacher)
    priority = compute_priority(t)
    reasons = get_transfer_reasons(t)

    prediction = False
    confidence = 0.0

    if model and le_subject and feature_cols:
        try:
            subj_enc = le_subject.transform([t["subject"]])[0]
        except Exception:
            subj_enc = 0

        feat_map = {
            "years_of_service": t["years_of_service"],
            "rural_service_years": t["rural_service_years"],
            "transfer_request": t["transfer_request"],
            "medical_condition": t["medical_condition"],
            "spouse_distance": t["spouse_distance"],
            "promotion_due": t["promotion_due"],
            "subject_encoded": subj_enc,
        }
        X = pd.DataFrame([[feat_map.get(c, 0) for c in feature_cols]], columns=feature_cols)
        pred = int(model.predict(X)[0])
        proba = model.predict_proba(X)[0]
        prediction = bool(pred)
        confidence = round(float(proba[pred]) * 100, 1)
    else:
        prediction = priority >= 45
        confidence = min(priority + 20, 95)

    return {
        "teacher_id": req.teacher_id,
        "name": t["name"],
        "subject": t["subject"],
        "transfer_recommended": prediction,
        "confidence": confidence,
        "priority_score": priority,
        "reasons": reasons,
        "details": {
            "years_of_service": t["years_of_service"],
            "rural_service_years": t["rural_service_years"],
            "transfer_request": t["transfer_request"],
            "medical_condition": t["medical_condition"],
            "spouse_distance": t["spouse_distance"],
            "promotion_due": t["promotion_due"],
        }
    }


@app.post("/recommend_school")
def recommend_school(req: RecommendSchoolRequest):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (req.teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")

    t = dict(teacher)
    subject = t["subject"]
    current_school = t["current_school"]

    schools = conn.execute(
        "SELECT * FROM schools WHERE school_id != ?", (current_school,)
    ).fetchall()
    conn.close()

    results = []
    for s in schools:
        sd = dict(s)
        shortage = sd["required_teacher_count"] - sd["current_teacher_count"]
        if shortage < 0:
            continue

        subj_vacancy = 0
        try:
            vac = json.loads(sd["subject_wise_vacancy"])
            subj_vacancy = vac.get(subject, 0)
        except Exception:
            pass

        score = shortage * 2 + subj_vacancy * 5 - sd["student_teacher_ratio"] * 0.1
        sd["shortage"] = shortage
        sd["subject_vacancy"] = subj_vacancy
        sd["allocation_score"] = round(score, 2)
        results.append(sd)

    results.sort(key=lambda x: x["allocation_score"], reverse=True)
    top = results[:5]

    return {
        "teacher_id": req.teacher_id,
        "name": t["name"],
        "subject": subject,
        "recommended_schools": top
    }


@app.post("/apply_transfer")
def apply_transfer(req: ApplyTransferRequest):
    conn = get_db()
    teacher = conn.execute(
        "SELECT * FROM teachers WHERE teacher_id = ?", (req.teacher_id,)
    ).fetchone()
    if not teacher:
        conn.close()
        raise HTTPException(status_code=404, detail="Teacher not found")

    existing = conn.execute(
        "SELECT * FROM transfer_requests WHERE teacher_id = ? AND status = 'Pending'",
        (req.teacher_id,)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="You already have a pending transfer request")

    school = conn.execute(
        "SELECT * FROM schools WHERE school_id = ?", (req.requested_school,)
    ).fetchone()
    if not school:
        conn.close()
        raise HTTPException(status_code=404, detail="Requested school not found")

    t = dict(teacher)
    priority = compute_priority(t)
    request_id = f"REQ{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now().strftime("%Y-%m-%d")

    conn.execute(
        """INSERT INTO transfer_requests
        (request_id, teacher_id, current_school, requested_school, mandal,
         request_date, transfer_reason, priority_score, status, assigned_meo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)""",
        (request_id, req.teacher_id, t["current_school"], req.requested_school,
         t["mandal"], now, req.transfer_reason, priority, t["assigned_meo"])
    )

    conn.execute(
        "UPDATE teachers SET transfer_status = 'Pending', requested_school = ? WHERE teacher_id = ?",
        (req.requested_school, req.teacher_id)
    )
    conn.commit()
    conn.close()

    add_notification(
        req.teacher_id,
        f"Your transfer request ({request_id}) has been submitted and is pending review.",
        "info"
    )

    return {
        "success": True,
        "request_id": request_id,
        "message": "Transfer request submitted successfully"
    }


@app.get("/transfer_history/{teacher_id}")
def transfer_history(teacher_id: str):
    conn = get_db()
    requests = conn.execute(
        "SELECT * FROM transfer_requests WHERE teacher_id = ? ORDER BY request_date DESC",
        (teacher_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in requests]


@app.get("/notifications/{teacher_id}")
def get_notifications(teacher_id: str):
    conn = get_db()
    notifs = conn.execute(
        "SELECT * FROM notifications WHERE teacher_id = ? ORDER BY created_at DESC",
        (teacher_id,)
    ).fetchall()
    conn.close()
    return [dict(n) for n in notifs]


@app.put("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    conn = get_db()
    conn.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"success": True}


# ── MEO Endpoints ────────────────────────────────────────────────────────────

@app.get("/meo/{meo_id}/dashboard")
def meo_dashboard(meo_id: str):
    conn = get_db()
    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    mandal = meo["assigned_mandal"]

    schools = conn.execute(
        "SELECT * FROM schools WHERE mandal = ?", (mandal,)
    ).fetchall()

    teachers = conn.execute(
        "SELECT * FROM teachers WHERE mandal = ?", (mandal,)
    ).fetchall()

    pending = conn.execute(
        "SELECT * FROM transfer_requests WHERE mandal = ? AND status = 'Pending' ORDER BY priority_score DESC",
        (mandal,)
    ).fetchall()

    approved = conn.execute(
        "SELECT * FROM transfer_requests WHERE mandal = ? AND status = 'Approved' ORDER BY approval_date DESC",
        (mandal,)
    ).fetchall()

    rejected = conn.execute(
        "SELECT * FROM transfer_requests WHERE mandal = ? AND status = 'Rejected' ORDER BY approval_date DESC",
        (mandal,)
    ).fetchall()
    conn.close()

    schools_list = [dict(s) for s in schools]
    teachers_list = [dict(t) for t in teachers]

    total_teachers = len(teachers_list)
    total_schools = len(schools_list)
    shortage_schools = sum(1 for s in schools_list if s["current_teacher_count"] < s["required_teacher_count"])
    surplus_schools = sum(1 for s in schools_list if s["current_teacher_count"] > s["required_teacher_count"])

    subject_dist = {}
    for t in teachers_list:
        subject_dist[t["subject"]] = subject_dist.get(t["subject"], 0) + 1

    avg_ratio = round(
        sum(s["student_teacher_ratio"] for s in schools_list) / max(len(schools_list), 1), 2
    )

    return {
        "meo_name": meo["name"],
        "mandal": mandal,
        "total_teachers": total_teachers,
        "total_schools": total_schools,
        "shortage_schools": shortage_schools,
        "surplus_schools": surplus_schools,
        "avg_student_teacher_ratio": avg_ratio,
        "pending_requests": [dict(r) for r in pending],
        "approved_requests": [dict(r) for r in approved],
        "rejected_requests": [dict(r) for r in rejected],
        "subject_distribution": subject_dist,
        "schools": schools_list,
        "teachers": teachers_list,
    }


@app.get("/meo/{meo_id}/schools")
def meo_schools(meo_id: str):
    conn = get_db()
    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    schools = conn.execute(
        "SELECT * FROM schools WHERE mandal = ?", (meo["assigned_mandal"],)
    ).fetchall()
    conn.close()
    return [dict(s) for s in schools]


@app.post("/approve_transfer")
def approve_transfer(req: ApproveTransferRequest):
    conn = get_db()
    request = conn.execute(
        "SELECT * FROM transfer_requests WHERE request_id = ?", (req.request_id,)
    ).fetchone()
    if not request:
        conn.close()
        raise HTTPException(status_code=404, detail="Transfer request not found")

    if request["status"] != "Pending":
        conn.close()
        raise HTTPException(status_code=400, detail="Request is not pending")

    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (req.meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    if meo["assigned_mandal"] != request["mandal"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized for this mandal")

    now = datetime.now().strftime("%Y-%m-%d")
    teacher_id = request["teacher_id"]
    old_school = request["current_school"]
    new_school = request["requested_school"]

    # Update request status
    conn.execute(
        "UPDATE transfer_requests SET status = 'Approved', approval_date = ? WHERE request_id = ?",
        (now, req.request_id)
    )

    # Update teacher record
    conn.execute(
        """UPDATE teachers SET current_school = ?, transfer_status = 'Approved',
           requested_school = NULL, transfer_request = 0 WHERE teacher_id = ?""",
        (new_school, teacher_id)
    )

    # Update old school count
    conn.execute(
        """UPDATE schools SET current_teacher_count = MAX(0, current_teacher_count - 1)
           WHERE school_id = ?""",
        (old_school,)
    )

    # Update new school count
    conn.execute(
        "UPDATE schools SET current_teacher_count = current_teacher_count + 1 WHERE school_id = ?",
        (new_school,)
    )

    # Recalculate ratios
    for sid in [old_school, new_school]:
        s = conn.execute("SELECT * FROM schools WHERE school_id = ?", (sid,)).fetchone()
        if s:
            ratio = round(s["student_strength"] / max(s["current_teacher_count"], 1), 2)
            conn.execute(
                "UPDATE schools SET student_teacher_ratio = ? WHERE school_id = ?",
                (ratio, sid)
            )

    conn.commit()
    conn.close()

    pdf_path = generate_transfer_pdf(req.request_id)

    add_notification(
        teacher_id,
        f"Your transfer request ({req.request_id}) has been APPROVED. Transfer order is ready for download.",
        "success"
    )

    return {
        "success": True,
        "message": "Transfer approved successfully",
        "pdf_path": pdf_path
    }


@app.post("/reject_transfer")
def reject_transfer(req: RejectTransferRequest):
    conn = get_db()
    request = conn.execute(
        "SELECT * FROM transfer_requests WHERE request_id = ?", (req.request_id,)
    ).fetchone()
    if not request:
        conn.close()
        raise HTTPException(status_code=404, detail="Transfer request not found")

    if request["status"] != "Pending":
        conn.close()
        raise HTTPException(status_code=400, detail="Request is not pending")

    meo = conn.execute("SELECT * FROM meos WHERE meo_id = ?", (req.meo_id,)).fetchone()
    if not meo:
        conn.close()
        raise HTTPException(status_code=404, detail="MEO not found")

    if meo["assigned_mandal"] != request["mandal"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Not authorized for this mandal")

    now = datetime.now().strftime("%Y-%m-%d")
    conn.execute(
        """UPDATE transfer_requests SET status = 'Rejected', approval_date = ?,
           rejection_reason = ? WHERE request_id = ?""",
        (now, req.rejection_reason, req.request_id)
    )

    conn.execute(
        "UPDATE teachers SET transfer_status = 'Rejected', requested_school = NULL WHERE teacher_id = ?",
        (request["teacher_id"],)
    )
    conn.commit()
    conn.close()

    add_notification(
        request["teacher_id"],
        f"Your transfer request ({req.request_id}) has been REJECTED. Reason: {req.rejection_reason}",
        "error"
    )

    return {"success": True, "message": "Transfer rejected"}


# ── Dashboard Stats ──────────────────────────────────────────────────────────

@app.get("/dashboard_stats")
def dashboard_stats():
    conn = get_db()
    teachers = conn.execute("SELECT * FROM teachers").fetchall()
    schools = conn.execute("SELECT * FROM schools").fetchall()
    requests = conn.execute("SELECT * FROM transfer_requests").fetchall()
    conn.close()

    total_teachers = len(teachers)
    total_schools = len(schools)
    pending_requests = sum(1 for r in requests if r["status"] == "Pending")
    approved_requests = sum(1 for r in requests if r["status"] == "Approved")
    rejected_requests = sum(1 for r in requests if r["status"] == "Rejected")

    shortage = sum(1 for s in schools if s["current_teacher_count"] < s["required_teacher_count"])
    surplus = sum(1 for s in schools if s["current_teacher_count"] > s["required_teacher_count"])
    avg_ratio = round(sum(s["student_teacher_ratio"] for s in schools) / max(len(schools), 1), 2)

    subject_dist = {}
    for t in teachers:
        subject_dist[t["subject"]] = subject_dist.get(t["subject"], 0) + 1

    mandal_dist = {}
    for t in teachers:
        mandal_dist[t["mandal"]] = mandal_dist.get(t["mandal"], 0) + 1

    metrics = {}
    metrics_path = os.path.join(MODEL_DIR, "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics = json.load(f)

    return {
        "total_teachers": total_teachers,
        "total_schools": total_schools,
        "pending_requests": pending_requests,
        "approved_requests": approved_requests,
        "rejected_requests": rejected_requests,
        "shortage_schools": shortage,
        "surplus_schools": surplus,
        "avg_student_teacher_ratio": avg_ratio,
        "subject_distribution": subject_dist,
        "mandal_distribution": mandal_dist,
        "model_accuracy": metrics.get("accuracy", 0),
    }


@app.get("/download_transfer_pdf/{request_id}")
def download_pdf(request_id: str):
    conn = get_db()
    req = conn.execute(
        "SELECT * FROM transfer_requests WHERE request_id = ?", (request_id,)
    ).fetchone()
    conn.close()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req["status"] != "Approved":
        raise HTTPException(status_code=400, detail="Transfer not yet approved")

    pdf_path = req["generated_pdf_path"]
    if not pdf_path or not os.path.exists(pdf_path):
        pdf_path = generate_transfer_pdf(request_id)

    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF not found")

    return FileResponse(
        pdf_path,
        media_type="text/plain",
        filename=f"transfer_order_{request_id}.txt"
    )


@app.get("/schools")
def list_schools(mandal: Optional[str] = None):
    conn = get_db()
    if mandal:
        schools = conn.execute("SELECT * FROM schools WHERE mandal = ?", (mandal,)).fetchall()
    else:
        schools = conn.execute("SELECT * FROM schools").fetchall()
    conn.close()
    return [dict(s) for s in schools]


@app.get("/workforce_stats")
def workforce_stats():
    conn = get_db()
    schools = conn.execute("SELECT * FROM schools").fetchall()
    teachers = conn.execute("SELECT * FROM teachers").fetchall()
    conn.close()

    schools_list = [dict(s) for s in schools]
    teachers_list = [dict(t) for t in teachers]

    mandal_stats = {}
    for s in schools_list:
        m = s["mandal"]
        if m not in mandal_stats:
            mandal_stats[m] = {
                "mandal": m, "district": s["district"],
                "schools": 0, "teachers": 0, "required": 0,
                "shortage": 0, "surplus": 0
            }
        mandal_stats[m]["schools"] += 1
        mandal_stats[m]["teachers"] += s["current_teacher_count"]
        mandal_stats[m]["required"] += s["required_teacher_count"]
        diff = s["current_teacher_count"] - s["required_teacher_count"]
        if diff < 0:
            mandal_stats[m]["shortage"] += 1
        elif diff > 0:
            mandal_stats[m]["surplus"] += 1

    for m in mandal_stats:
        mandal_stats[m]["gap"] = mandal_stats[m]["required"] - mandal_stats[m]["teachers"]

    top_shortage = sorted(schools_list, key=lambda s: s["current_teacher_count"] - s["required_teacher_count"])[:10]
    top_surplus = sorted(schools_list, key=lambda s: s["current_teacher_count"] - s["required_teacher_count"], reverse=True)[:10]

    return {
        "mandal_stats": list(mandal_stats.values()),
        "top_shortage_schools": top_shortage,
        "top_surplus_schools": top_surplus,
        "total_teachers": len(teachers_list),
        "total_schools": len(schools_list),
    }


@app.get("/test_credentials")
def test_credentials():
    """Returns sample credentials for testing/demo purposes"""
    conn = get_db()
    teachers = conn.execute("SELECT teacher_id FROM teachers LIMIT 5").fetchall()
    meos = conn.execute("SELECT meo_id, assigned_mandal FROM meos LIMIT 5").fetchall()
    conn.close()

    return {
        "teachers": [
            {"id": t["teacher_id"], "password": f"tch{t['teacher_id'][3:]}", "role": "teacher"}
            for t in teachers
        ],
        "meos": [
            {"id": m["meo_id"], "password": f"meo{m['meo_id'][3:]}", "role": "meo",
             "mandal": m["assigned_mandal"]}
            for m in meos
        ]
    }
