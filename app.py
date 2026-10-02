import os
import random
from datetime import datetime

from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "aviator-secret-key-change-me")

mysql_user = os.getenv("MYSQL_USER", "root")
mysql_password = os.getenv("MYSQL_PASSWORD", "")
mysql_host = os.getenv("MYSQL_HOST", "localhost")
mysql_port = os.getenv("MYSQL_PORT", "3306")
mysql_db = os.getenv("MYSQL_DB", "aviator")


def build_database_url():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    if os.getenv("USE_SQLITE", "1") == "1":
        return "sqlite:///aviator.db"

    if os.getenv("USE_MYSQL", "0") == "1":
        mysql_url = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}?charset=utf8mb4"
        return mysql_url

    return "sqlite:///aviator.db"


app.config["SQLALCHEMY_DATABASE_URI"] = build_database_url()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    balance = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    game_history = db.relationship("GameHistory", backref="user", lazy=True)


class GameHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    bet_amount = db.Column(db.Float, nullable=False)
    multiplier = db.Column(db.Float, nullable=False)
    result = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class GameState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    next_crash = db.Column(db.Float, nullable=False)


def generate_crash():
    r = random.random()
    crash = round(1 / (1 - r), 2)
    if crash > 100:
        crash = 100
    if crash < 2:
        crash = round(random.uniform(2, 4), 2)
    return crash


def get_or_create_state():
    state = GameState.query.first()
    if state is None:
        state = GameState(next_crash=generate_crash())
        db.session.add(state)
        db.session.commit()
    return state


with app.app_context():
    db.create_all()
    get_or_create_state()


def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return db.session.get(User, user_id)


def login_required(f):
    def wrapper(*args, **kwargs):
        if not current_user():
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)

    wrapper.__name__ = f.__name__
    return wrapper


@app.route("/")
def index():
    user = current_user()
    if not user:
        return redirect(url_for("login_page"))
    return render_template("index.html", user=user)


@app.route("/crash")
def crash():
    state = get_or_create_state()
    current = state.next_crash
    state.next_crash = generate_crash()
    db.session.commit()
    return jsonify({"crash": current})


@app.route("/admin")
@login_required
def admin():
    return render_template("admin.html")


@app.route("/admin_data")
def admin_data():
    state = get_or_create_state()
    return jsonify({"next_crash": state.next_crash})


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        payload = request.get_json(silent=True) or request.form

        username = (payload.get("username") or "").strip()
        email = (payload.get("email") or "").strip()
        password = payload.get("password") or ""
        balance = float(payload.get("balance", 0.0) or 0.0)

        if not username or not email or not password:
            return jsonify({"error": "username, email, and password are required"}), 400

        if User.query.filter((User.username == username) | (User.email == email)).first():
            return jsonify({"error": "username or email already exists"}), 409

        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            balance=balance,
        )
        db.session.add(user)
        db.session.commit()

        session["user_id"] = user.id
        session["username"] = user.username

        if request.is_json:
            return jsonify({
                "message": "user registered successfully",
                "logged_in": True,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "balance": user.balance,
                },
            })

        return redirect(url_for("login_page"))

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "POST":
        payload = request.get_json(silent=True) or request.form
        username = (payload.get("username") or "").strip()
        password = payload.get("password") or ""

        if not username or not password:
            return jsonify({"error": "username and password are required"}), 400

        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "invalid username or password"}), 401

        session["user_id"] = user.id
        session["username"] = user.username

        if request.is_json:
            return jsonify({
                "message": "login successful",
                "logged_in": True,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "balance": user.balance,
                },
            })

        return redirect(url_for("index"))

    return render_template("login.html")


@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.pop("user_id", None)
    session.pop("username", None)
    if request.method == "POST":
        return jsonify({"message": "logged out"})
    return redirect(url_for("login_page"))


@app.route("/me")
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"logged_in": False}), 401

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"logged_in": False}), 401

    return jsonify({
        "logged_in": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "balance": user.balance,
        },
    })


@app.route("/users")
def users():
    users = User.query.order_by(User.id.asc()).all()
    return jsonify({
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "balance": user.balance,
                "created_at": user.created_at.isoformat(),
            }
            for user in users
        ]
    })


@app.route("/game_history")
def game_history():
    history = GameHistory.query.order_by(GameHistory.id.desc()).all()
    return jsonify({
        "history": [
            {
                "id": row.id,
                "user_id": row.user_id,
                "bet_amount": row.bet_amount,
                "multiplier": row.multiplier,
                "result": row.result,
                "created_at": row.created_at.isoformat(),
            }
            for row in history
        ]
    })


@app.route("/play", methods=["POST"])
def play_game():
    payload = request.get_json(silent=True) or request.form

    user_id = payload.get("user_id")
    bet_amount = float(payload.get("bet_amount", 0) or 0)
    multiplier = float(payload.get("multiplier", 1) or 1)
    result = (payload.get("result") or "lose").strip().lower()

    if user_id is None:
        return jsonify({"error": "user_id is required"}), 400

    user = db.session.get(User, int(user_id))
    if user is None:
        return jsonify({"error": "user not found"}), 404

    if result not in {"win", "lose"}:
        return jsonify({"error": "result must be 'win' or 'lose'"}), 400

    if result == "win":
        user.balance += bet_amount * multiplier
    else:
        user.balance -= bet_amount

    game_record = GameHistory(
        user_id=user.id,
        bet_amount=bet_amount,
        multiplier=multiplier,
        result=result,
    )

    db.session.add(game_record)
    db.session.commit()

    return jsonify({
        "message": "game recorded successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "balance": user.balance,
        },
        "game": {
            "id": game_record.id,
            "user_id": game_record.user_id,
            "bet_amount": game_record.bet_amount,
            "multiplier": game_record.multiplier,
            "result": game_record.result,
            "created_at": game_record.created_at.isoformat(),
        },
    })


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
