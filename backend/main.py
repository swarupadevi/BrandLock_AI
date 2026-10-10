
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pwdlib import PasswordHash


app = FastAPI(title="BrandLockAI API")

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Secure password hashing
password_hash = PasswordHash.recommended()

# Keep the database beside this Python file
DB_PATH = Path(__file__).resolve().parent / "brandlock.db"


def get_connection():
    return sqlite3.connect(DB_PATH)


# Create tables and safely update an older users table
def create_database():
    with get_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS brands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                brand_name TEXT NOT NULL,
                website TEXT,
                social_url TEXT,
                app_url TEXT,
                logo_url TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL
            )
        """)

        # Add new fields if the old users table already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = {
            row[1] for row in cursor.fetchall()
        }

        if "full_name" not in columns:
            cursor.execute(
                "ALTER TABLE users ADD COLUMN full_name TEXT DEFAULT ''"
            )

        if "email" not in columns:
            cursor.execute(
                "ALTER TABLE users ADD COLUMN email TEXT"
            )

        if "organization_name" not in columns:
            cursor.execute(
                "ALTER TABLE users ADD COLUMN organization_name TEXT DEFAULT ''"
            )

        cursor.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
            ON users(email)
        """)


create_database()


# ---------------- INPUT MODELS ----------------

class Brand(BaseModel):
    brand_name: str = Field(min_length=1, max_length=150)
    website: str = ""
    social_url: str = ""
    app_url: str = ""
    logo_url: str = ""


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=5, max_length=254)
    organization_name: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)


# ---------------- HOME & HEALTH ----------------

@app.get("/")
def home():
    return {"message": "BrandLockAI backend is running!"}


@app.get("/api/health")
def health():
    return {"status": "healthy"}


# ---------------- REGISTRATION ----------------

@app.post("/api/register")
def register(user: RegisterRequest):
    full_name = user.full_name.strip()
    email = user.email.strip().lower()
    organization = user.organization_name.strip()

    if not full_name or not organization:
        raise HTTPException(
            status_code=400,
            detail="Name and organization cannot be empty.",
        )

    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address.",
        )

    hashed_password = password_hash.hash(user.password)

    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO users
                (username, password_hash, full_name, email, organization_name)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    email,
                    hashed_password,
                    full_name,
                    email,
                    organization,
                ),
            )

            user_id = cursor.lastrowid

    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="This email is already registered. Please log in.",
        )

    return {
        "message": "Registration successful!",
        "user": {
            "id": user_id,
            "full_name": full_name,
            "email": email,
            "organization_name": organization,
        },
    }


# ---------------- LOGIN ----------------

@app.post("/api/login")
def login(user: LoginRequest):
    email = user.email.strip().lower()

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, full_name, email, organization_name, password_hash
            FROM users
            WHERE email = ?
            """,
            (email,),
        )
        result = cursor.fetchone()

    if result is None or not password_hash.verify(
        user.password, result[4]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    return {
        "message": "Login successful!",
        "user": {
            "id": result[0],
            "full_name": result[1],
            "email": result[2],
            "organization_name": result[3],
        },
    }


# ---------------- SAVE BRAND DETAILS ----------------

@app.post("/api/brands")
def add_brand(brand: Brand):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO brands
            (brand_name, website, social_url, app_url, logo_url)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                brand.brand_name,
                brand.website,
                brand.social_url,
                brand.app_url,
                brand.logo_url,
            ),
        )

        brand_id = cursor.lastrowid

    return {
        "message": "Brand saved successfully!",
        "brand_id": brand_id,
        "brand_name": brand.brand_name,
    }


# ---------------- GET SAVED BRANDS ----------------

@app.get("/api/brands")
def get_brands():
    with get_connection() as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM brands").fetchall()

    return {"brands": [dict(row) for row in rows]}


# ---------------- CHECK SOCIAL PROFILE ----------------

@app.post("/api/check-profile")
def check_profile(profile_url: str, brand_name: str):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT social_url FROM brands WHERE brand_name = ?",
            (brand_name,),
        )
        result = cursor.fetchone()

    if result is None or not result[0]:
        return {
            "status": "unknown",
            "message": "Official social profile is not registered.",
        }

    official_url = result[0].strip().rstrip("/")
    submitted_url = profile_url.strip().rstrip("/")

    if submitted_url == official_url:
        return {
            "status": "matched",
            "message": "Profile URL matches the registered official URL.",
        }

    return {
        "status": "review_needed",
        "message": (
            "Profile URL differs from the registered official URL. "
            "Please review it."
        ),
    }