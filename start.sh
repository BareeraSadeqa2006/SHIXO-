#!/bin/bash
set -e
cd /home/user/app/backend

echo "Installing Python dependencies..."
pip install -r requirements.txt -q

echo "Generating synthetic dataset (10,000 teachers)..."
python generate_data.py

echo "Training ML model (RandomForestClassifier)..."
python train_model.py

echo "Starting FastAPI server on port 8000..."
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
