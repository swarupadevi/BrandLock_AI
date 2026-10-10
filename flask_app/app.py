from flask import Flask, jsonify

from db import init_database

app = Flask(__name__)
init_database()


@app.get("/")
def home():
    return jsonify({"message": "BrandLockAI backend is running!"})


@app.get("/api/health")
def health():
    return jsonify({"status": "healthy"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
