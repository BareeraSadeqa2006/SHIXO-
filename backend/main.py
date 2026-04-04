"""
FastAPI Backend - AI Government Teacher Management Control Room
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
import numpy as np
import joblib
import json
import os
import ast

app = FastAPI(title="Teacher Management Control Room API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global state ────────────────────────────────────────────────────────────────
teachers_df: pd.DataFrame = None
schools_df: pd.DataFrame = None
model = None
le_subject = None
feature_cols: list = None


def load_all():
    global teachers_df, schools_df, model, le_subject, feature_cols

    if not os.path.exists("data/teachers.csv"):
        import generate_data
        generate_data.generate_schools()  # regenerate
        # run as script
        import subprocess, sys
        subprocess.run([sys.executable, "generate_data.py"], check=True)

    if not os.path.exists("models/transfer_model.pkl"):
        import subprocess, sys
        subprocess.run([sys.executable, "train_model.py"], check=True)

    teachers_df = pd.read_csv("data/teachers.csv")
    schools_df = pd.read_csv("data/schools.csv")
    model = joblib.load("models/transfer_model.pkl")
    le_subject = joblib.load("models/label_encoder_subject.pkl")
    feature_cols = joblib.load("models/feature_cols.pkl")
    print("✅ Data and model loaded successfully")


@app.on_event("startup")
def startup():
    load_all()


def reload_data():
    global teachers_df, schools_df
    teachers_df = pd.read_csv("data/teachers.csv")
    schools_df = pd.read_csv("data/schools.csv")


# ── Models ───────────────────────────────────────────────────────────────────────

class TransferPredictRequest(BaseModel):
    teacher_id: str

class SchoolRecommendRequest(BaseModel):
    teacher_id: str

class TransferExecuteRequest(BaseModel):
    teacher_id: str
    target_school_id: str


# ── Helpers ──────────────────────────────────────────────────────────────────────

def compute_priority_score(row) -> float:
    score = 0
    if row.get("Transfer_Request", 0) == 1: score += 30
    if row.get("Years_in_Current_School", 0) >= 5: score += 20
    if row.get("Rural_Service_Years", 0) >= 3: score += 15
    if row.get("Medical_Ground", 0) == 1: score += 25
    if row.get("Spouse_Location_Distance", 0) > 200: score += 20
    if row.get("Promotion_Due", 0) == 1: score += 10
    if row.get("Years_of_Service", 0) >= 10: score += 10
    return min(score, 100)


def get_transfer_reasons(row) -> List[str]:
    reasons = []
    if row.get("Transfer_Request", 0) == 1:
        reasons.append("Teacher has submitted a transfer request")
    if row.get("Years_in_Current_School", 0) >= 5:
        reasons.append(f"Served {row['Years_in_Current_School']} years in current school (≥5 years policy)")
    if row.get("Rural_Service_Years", 0) >= 3:
        reasons.append(f"Completed {row['Rural_Service_Years']} years of rural service")
    if row.get("Medical_Ground", 0) == 1:
        reasons.append("Medical ground transfer requested")
    if row.get("Spouse_Location_Distance", 0) > 200:
        reasons.append(f"Spouse located {row['Spouse_Location_Distance']} km away")
    if row.get("Promotion_Due", 0) == 1:
        reasons.append("Promotion due – eligible for upgraded posting")
    if not reasons:
        reasons.append("Routine transfer cycle")
    return reasons


# ── Endpoints ─────────────────────────────────────────────────────────────────────

@app.get("/dashboard_stats")
def dashboard_stats():
    reload_data()
    total_teachers = len(teachers_df)
    total_schools = len(schools_df)
    transfers_recommended = int(teachers_df["Transfer_Recommended"].sum())

    schools_df["Surplus"] = schools_df["Current_Teacher_Count"] - schools_df["Required_Teacher_Count"]
    surplus_schools = int((schools_df["Surplus"] > 0).sum())
    shortage_schools = int((schools_df["Surplus"] < 0).sum())
    avg_ratio = round(float(schools_df["Student_Teacher_Ratio"].mean()), 2)

    # Top 10 schools by student strength
    top_schools = schools_df.nlargest(10, "Student_Strength")[
        ["School_Name", "District", "Student_Strength",
         "Current_Teacher_Count", "Required_Teacher_Count", "Student_Teacher_Ratio"]
    ].to_dict(orient="records")

    # District-wise teacher distribution
    district_counts = {}
    for _, row in schools_df.iterrows():
        d = row["District"]
        district_counts[d] = district_counts.get(d, 0) + row["Current_Teacher_Count"]
    district_data = [{"district": k, "teachers": int(v)} for k, v in
                     sorted(district_counts.items(), key=lambda x: -x[1])[:15]]

    # Ratio distribution buckets
    bins = [0, 20, 30, 40, 50, 200]
    labels = ["<20", "20-30", "30-40", "40-50", ">50"]
    schools_df["Ratio_Bucket"] = pd.cut(schools_df["Student_Teacher_Ratio"], bins=bins, labels=labels)
    ratio_dist = schools_df["Ratio_Bucket"].value_counts().sort_index()
    ratio_data = [{"range": str(k), "schools": int(v)} for k, v in ratio_dist.items()]

    # Subject distribution
    subj_counts = teachers_df["Subject"].value_counts().head(10)
    subject_data = [{"subject": k, "count": int(v)} for k, v in subj_counts.items()]

    # Model metrics
    metrics = {}
    if os.path.exists("models/metrics.json"):
        with open("models/metrics.json") as f:
            metrics = json.load(f)

    return {
        "total_teachers": total_teachers,
        "total_schools": total_schools,
        "transfers_recommended": transfers_recommended,
        "surplus_schools": surplus_schools,
        "shortage_schools": shortage_schools,
        "avg_student_teacher_ratio": avg_ratio,
        "top_schools": top_schools,
        "district_data": district_data,
        "ratio_data": ratio_data,
        "subject_data": subject_data,
        "model_accuracy": metrics.get("accuracy", 0),
    }


@app.get("/teachers")
def get_teachers(search: str = "", page: int = 1, limit: int = 20):
    reload_data()
    df = teachers_df.copy()
    if search:
        mask = (
            df["Teacher_Name"].str.contains(search, case=False, na=False) |
            df["Teacher_ID"].str.contains(search, case=False, na=False) |
            df["Subject"].str.contains(search, case=False, na=False) |
            df["Current_School_Name"].str.contains(search, case=False, na=False)
        )
        df = df[mask]
    total = len(df)
    start = (page - 1) * limit
    end = start + limit
    records = df.iloc[start:end].to_dict(orient="records")
    return {"total": total, "page": page, "limit": limit, "teachers": records}


@app.get("/schools")
def get_schools(search: str = "", page: int = 1, limit: int = 20):
    reload_data()
    df = schools_df.copy()
    df["Surplus_Shortage"] = df["Current_Teacher_Count"] - df["Required_Teacher_Count"]
    if search:
        mask = (
            df["School_Name"].str.contains(search, case=False, na=False) |
            df["District"].str.contains(search, case=False, na=False)
        )
        df = df[mask]
    total = len(df)
    start = (page - 1) * limit
    end = start + limit
    records = df.iloc[start:end].to_dict(orient="records")
    return {"total": total, "page": page, "limit": limit, "schools": records}


@app.post("/predict_transfer")
def predict_transfer(req: TransferPredictRequest):
    reload_data()
    row = teachers_df[teachers_df["Teacher_ID"] == req.teacher_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Teacher not found")

    r = row.iloc[0]

    # Encode subject
    try:
        subject_enc = le_subject.transform([r["Subject"]])[0]
    except Exception:
        subject_enc = 0

    feat_map = {
        "Age": r["Age"],
        "Years_of_Service": r["Years_of_Service"],
        "Years_in_Current_School": r["Years_in_Current_School"],
        "Rural_Service_Years": r["Rural_Service_Years"],
        "Transfer_Request": r["Transfer_Request"],
        "Medical_Ground": r["Medical_Ground"],
        "Spouse_Location_Distance": r["Spouse_Location_Distance"],
        "Promotion_Due": r["Promotion_Due"],
        "Subject_Encoded": subject_enc,
    }

    X = pd.DataFrame([[feat_map[c] for c in feature_cols]], columns=feature_cols)
    prediction = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]
    confidence = round(float(proba[prediction]) * 100, 1)

    priority = compute_priority_score(r.to_dict())
    reasons = get_transfer_reasons(r.to_dict())

    return {
        "teacher_id": req.teacher_id,
        "teacher_name": r["Teacher_Name"],
        "subject": r["Subject"],
        "current_school": r["Current_School_Name"],
        "transfer_recommended": bool(prediction),
        "confidence": confidence,
        "priority_score": priority,
        "reasons": reasons,
        "teacher_details": {
            "age": int(r["Age"]),
            "years_of_service": int(r["Years_of_Service"]),
            "years_in_school": int(r["Years_in_Current_School"]),
            "rural_years": int(r["Rural_Service_Years"]),
            "transfer_request": bool(r["Transfer_Request"]),
            "medical_ground": bool(r["Medical_Ground"]),
            "spouse_distance": int(r["Spouse_Location_Distance"]),
            "promotion_due": bool(r["Promotion_Due"]),
        }
    }


@app.post("/recommend_school")
def recommend_school(req: SchoolRecommendRequest):
    reload_data()
    teacher = teachers_df[teachers_df["Teacher_ID"] == req.teacher_id]
    if teacher.empty:
        raise HTTPException(status_code=404, detail="Teacher not found")

    t = teacher.iloc[0]
    subject = t["Subject"]
    current_school_id = t["Current_School_ID"]

    df = schools_df.copy()
    # Exclude current school
    df = df[df["School_ID"] != current_school_id]

    # Compute shortage
    df["Shortage"] = df["Required_Teacher_Count"] - df["Current_Teacher_Count"]
    # Only schools with shortage or vacancy for subject
    df = df[df["Shortage"] >= 0]  # exclude surplus

    def subject_vacancy(vacancy_str, subj):
        try:
            d = ast.literal_eval(str(vacancy_str))
            return d.get(subj, 0)
        except Exception:
            return 0

    df["Subject_Vacancy"] = df["Subject_Wise_Vacancy"].apply(
        lambda x: subject_vacancy(x, subject)
    )

    # Score: higher shortage + subject vacancy + lower ratio = better
    df["Score"] = (
        df["Shortage"] * 2 +
        df["Subject_Vacancy"] * 5 -
        df["Student_Teacher_Ratio"] * 0.1
    )

    top3 = df.nlargest(3, "Score")[
        ["School_ID", "School_Name", "District", "Student_Strength",
         "Current_Teacher_Count", "Required_Teacher_Count",
         "Student_Teacher_Ratio", "Subject_Vacancy", "Shortage", "Score"]
    ].to_dict(orient="records")

    for s in top3:
        s["Score"] = round(float(s["Score"]), 2)
        s["Student_Teacher_Ratio"] = round(float(s["Student_Teacher_Ratio"]), 2)

    return {
        "teacher_id": req.teacher_id,
        "teacher_name": t["Teacher_Name"],
        "subject": subject,
        "recommended_schools": top3
    }


@app.post("/execute_transfer")
def execute_transfer(req: TransferExecuteRequest):
    global teachers_df, schools_df
    reload_data()

    teacher_idx = teachers_df[teachers_df["Teacher_ID"] == req.teacher_id].index
    if teacher_idx.empty:
        raise HTTPException(status_code=404, detail="Teacher not found")

    school_idx = schools_df[schools_df["School_ID"] == req.target_school_id].index
    if school_idx.empty:
        raise HTTPException(status_code=404, detail="Target school not found")

    t = teachers_df.loc[teacher_idx[0]]
    old_school_id = t["Current_School_ID"]
    old_idx = schools_df[schools_df["School_ID"] == old_school_id].index

    # Decrease old school count
    if not old_idx.empty:
        schools_df.loc[old_idx[0], "Current_Teacher_Count"] = max(
            0, schools_df.loc[old_idx[0], "Current_Teacher_Count"] - 1
        )
        ss = schools_df.loc[old_idx[0], "Student_Strength"]
        ct = schools_df.loc[old_idx[0], "Current_Teacher_Count"]
        schools_df.loc[old_idx[0], "Student_Teacher_Ratio"] = round(ss / max(ct, 1), 2)

    # Increase new school count
    schools_df.loc[school_idx[0], "Current_Teacher_Count"] += 1
    ss = schools_df.loc[school_idx[0], "Student_Strength"]
    ct = schools_df.loc[school_idx[0], "Current_Teacher_Count"]
    schools_df.loc[school_idx[0], "Student_Teacher_Ratio"] = round(ss / max(ct, 1), 2)

    # Update teacher record
    new_school_name = schools_df.loc[school_idx[0], "School_Name"]
    teachers_df.loc[teacher_idx[0], "Current_School_ID"] = req.target_school_id
    teachers_df.loc[teacher_idx[0], "Current_School_Name"] = new_school_name
    teachers_df.loc[teacher_idx[0], "Years_in_Current_School"] = 0
    teachers_df.loc[teacher_idx[0], "Transfer_Recommended"] = 0
    teachers_df.loc[teacher_idx[0], "Transfer_Request"] = 0

    # Save updated data
    teachers_df.to_csv("data/teachers.csv", index=False)
    schools_df.to_csv("data/schools.csv", index=False)

    return {
        "success": True,
        "message": f"Teacher {req.teacher_id} transferred to {new_school_name}",
        "teacher_id": req.teacher_id,
        "new_school": new_school_name,
        "new_school_id": req.target_school_id,
    }


@app.get("/workforce_data")
def workforce_data():
    reload_data()
    df = schools_df.copy()
    df["Surplus_Shortage"] = df["Current_Teacher_Count"] - df["Required_Teacher_Count"]

    # District summary
    district_summary = df.groupby("District").agg(
        Schools=("School_ID", "count"),
        Total_Teachers=("Current_Teacher_Count", "sum"),
        Required_Teachers=("Required_Teacher_Count", "sum"),
        Avg_Ratio=("Student_Teacher_Ratio", "mean"),
        Surplus_Schools=(
            "Surplus_Shortage", lambda x: int((x > 0).sum())
        ),
        Shortage_Schools=(
            "Surplus_Shortage", lambda x: int((x < 0).sum())
        ),
    ).reset_index()
    district_summary["Avg_Ratio"] = district_summary["Avg_Ratio"].round(2)
    district_summary["Gap"] = (
        district_summary["Required_Teachers"] - district_summary["Total_Teachers"]
    ).astype(int)

    # Surplus/shortage schools
    surplus = df[df["Surplus_Shortage"] > 0].nlargest(10, "Surplus_Shortage")[
        ["School_Name", "District", "Current_Teacher_Count",
         "Required_Teacher_Count", "Surplus_Shortage"]
    ].to_dict(orient="records")

    shortage = df[df["Surplus_Shortage"] < 0].nsmallest(10, "Surplus_Shortage")[
        ["School_Name", "District", "Current_Teacher_Count",
         "Required_Teacher_Count", "Surplus_Shortage"]
    ].to_dict(orient="records")

    # Subject-wise teacher count
    subj_counts = teachers_df["Subject"].value_counts().reset_index()
    subj_counts.columns = ["subject", "count"]
    subject_dist = subj_counts.to_dict(orient="records")

    # Age distribution
    bins = [20, 30, 40, 50, 65]
    labels = ["20-30", "30-40", "40-50", "50-65"]
    age_series = pd.cut(teachers_df["Age"], bins=bins, labels=labels)
    age_dist = age_series.value_counts().sort_index()
    age_data = [{"range": str(k), "count": int(v)} for k, v in age_dist.items()]

    # Service year distribution
    srv_bins = [0, 5, 10, 15, 20, 40]
    srv_labels = ["0-5", "5-10", "10-15", "15-20", "20+"]
    srv_series = pd.cut(teachers_df["Years_of_Service"], bins=srv_bins, labels=srv_labels)
    srv_dist = srv_series.value_counts().sort_index()
    srv_data = [{"range": str(k), "count": int(v)} for k, v in srv_dist.items()]

    return {
        "district_summary": district_summary.to_dict(orient="records"),
        "surplus_schools": surplus,
        "shortage_schools": shortage,
        "subject_distribution": subject_dist,
        "age_distribution": age_data,
        "service_distribution": srv_data,
        "total_teachers": int(teachers_df["Transfer_Recommended"].count()),
        "transfer_pending": int(teachers_df["Transfer_Recommended"].sum()),
    }


@app.get("/model_info")
def model_info():
    if os.path.exists("models/metrics.json"):
        with open("models/metrics.json") as f:
            metrics = json.load(f)
        return metrics
    return {"error": "Model not trained yet"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
