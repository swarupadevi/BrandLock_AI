from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATABASE_DIR = BASE_DIR / "database"
SCHEMA_PATH = DATABASE_DIR / "schema.sql"
DATABASE_PATH = DATABASE_DIR / "brandlock.db"
REPORTS_DIR = BASE_DIR / "reports"

# Locked API contract (implemented in later stages; do not rename)
API_ROUTES = {
    "home": "GET /",
    "health": "GET /api/health",
    "register": "POST /api/register",
    "login": "POST /api/login",
    "brands_create": "POST /api/brands",
    "brands_list": "GET /api/brands",
    "check_profile": "POST /api/check-profile",
    "scan_social": "POST /api/scans/social-profile",
    "scan_brand_page": "POST /api/scans/brand-page",
    "scan_scam_account": "POST /api/scans/scam-account",
    "scan_mobile_app": "POST /api/scans/mobile-app",
    "scan_history": "GET /api/scans",
    "scan_detail": "GET /api/scans/<id>",
    "report_download": "GET /api/reports/<scan_id>",
}

RISK_CATEGORIES = ("Low", "Medium", "High", "Critical")
SCAN_TYPES = (
    "social_profile",
    "brand_page",
    "scam_account",
    "mobile_app",
)
