"""
Train RandomForestClassifier for Transfer Recommendation
"""
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report
import joblib
import os
import json


def train():
    print("Loading data...")
    teachers_df = pd.read_csv("data/teachers.csv")

    # Features for model
    feature_cols = [
        "Age", "Years_of_Service", "Years_in_Current_School",
        "Rural_Service_Years", "Transfer_Request", "Medical_Ground",
        "Spouse_Location_Distance", "Promotion_Due"
    ]

    # Encode subject
    le_subject = LabelEncoder()
    teachers_df["Subject_Encoded"] = le_subject.fit_transform(teachers_df["Subject"])
    feature_cols.append("Subject_Encoded")

    X = teachers_df[feature_cols]
    y = teachers_df["Transfer_Recommended"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training RandomForestClassifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    cm = confusion_matrix(y_test, y_pred)

    print(f"\nModel Accuracy: {acc*100:.2f}%")
    print(f"\nConfusion Matrix:\n{cm}")
    print(f"\nClassification Report:\n{classification_report(y_test, y_pred)}")

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, "models/transfer_model.pkl")
    joblib.dump(le_subject, "models/label_encoder_subject.pkl")
    joblib.dump(feature_cols, "models/feature_cols.pkl")

    metrics = {
        "accuracy": round(acc * 100, 2),
        "confusion_matrix": cm.tolist(),
        "feature_importance": dict(zip(feature_cols, model.feature_importances_.tolist()))
    }
    with open("models/metrics.json", "w") as f:
        json.dump(metrics, f)

    print("\nModel saved to models/transfer_model.pkl")
    return metrics


if __name__ == "__main__":
    train()
