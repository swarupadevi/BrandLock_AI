# BrandLockAI (Flask)

Digital risk protection for fake social profiles, brand pages, scam accounts, and suspicious mobile apps.

This folder is the **Flask + HTML/CSS/JS** hackathon app. The existing FastAPI backend (`../backend`) and React frontend (`../frontend`) were left unchanged.

## Stage 1 (current)

Project layout, Flask app, SQLite schema, and `requirements.txt` only.

## Project structure

```text
flask_app/
  app.py
  config.py
  db.py
  requirements.txt
  README.md
  database/
    schema.sql
    brandlock.db          (created on first run)
  templates/              (Stage 2+)
  static/
    css/                  (Stage 2+)
    js/                   (Stage 2+)
  reports/                (downloadable reports later)
```

## Locked API routes

| Method | Route | Status |
|--------|--------|--------|
| GET | `/` | Stage 1 |
| GET | `/api/health` | Stage 1 |
| POST | `/api/register` | Stage 2 |
| POST | `/api/login` | Stage 2 |
| POST | `/api/brands` | later |
| GET | `/api/brands` | later |
| POST | `/api/check-profile` | later |
| POST | `/api/scans/social-profile` | later |
| POST | `/api/scans/brand-page` | later |
| POST | `/api/scans/scam-account` | later |
| POST | `/api/scans/mobile-app` | later |
| GET | `/api/scans` | later |
| GET | `/api/scans/<id>` | later |
| GET | `/api/reports/<scan_id>` | later |

Error JSON matches the existing FastAPI app: `{"detail": "message"}`.

## Locked auth JSON

Register request:

```json
{
  "full_name": "Test User",
  "email": "test@example.com",
  "organization_name": "BrandLockAI",
  "password": "password123"
}
```

Login request:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

Auth success:

```json
{
  "message": "Login successful!",
  "user": {
    "id": 1,
    "full_name": "Test User",
    "email": "test@example.com",
    "organization_name": "BrandLockAI"
  }
}
```

## Locked scan JSON

```json
{
  "scan_id": 1,
  "scan_type": "social_profile",
  "target": "https://instagram.com/example",
  "risk_score": 72,
  "risk_category": "High",
  "summary": "Explainable summary of why this score was assigned.",
  "evidence": [
    {"label": "Handle similarity", "detail": "Username is one character off the official brand."}
  ],
  "recommendations": [
    "Do not enter credentials on this profile.",
    "Report the account to the platform."
  ],
  "created_at": "2026-10-09 18:00:00"
}
```

`risk_score` is an integer from 0 to 100. `risk_category` is one of `Low`, `Medium`, `High`, `Critical`.

`scan_type` is one of `social_profile`, `brand_page`, `scam_account`, `mobile_app`.

## SQL tables (locked columns)

- `users`: `id`, `username`, `password_hash`, `full_name`, `email`, `organization_name`
- `brands`: `id`, `brand_name`, `website`, `social_url`, `app_url`, `logo_url`
- `scans`: `id`, `user_id`, `brand_id`, `scan_type`, `target`, `risk_score`, `risk_category`, `summary`, `created_at`
- `scan_evidence`: `id`, `scan_id`, `label`, `detail`
- `scan_recommendations`: `id`, `scan_id`, `recommendation`
- `reports`: `id`, `scan_id`, `file_path`, `created_at`

`users` and `brands` match the existing FastAPI SQLite database.

## Run (Windows PowerShell)

```powershell
cd "C:\BrandLock AI\flask_app"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000/api/health

The Flask app uses port **5000** so it does not conflict with the existing FastAPI app on port **8000**.

## Next step

Stage 2: implement `POST /api/register` and `POST /api/login` with hashed passwords (Werkzeug, already included with Flask), plus login/register HTML pages. Do not add extra packages.
