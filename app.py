
import os
import random
import math
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from functools import wraps

from flask import (
    Flask,
    abort,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Index, URL, inspect
from sqlalchemy.engine import make_url
from werkzeug.security import check_password_hash, generate_password_hash

try:
    from dotenv import load_dotenv
except ImportError:  # Environment variables can also be supplied by the host.
    load_dotenv = None

if load_dotenv:
    load_dotenv()


# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV == "production"
secret_key = os.getenv("SECRET_KEY")
if IS_PRODUCTION and not secret_key:
    raise RuntimeError("SECRET_KEY must be set when APP_ENV=production.")

app.config.update(
    SECRET_KEY=secret_key or os.urandom(32),
    DEBUG=(not IS_PRODUCTION and os.getenv("FLASK_DEBUG", "0") == "1"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=IS_PRODUCTION,
)


# =========================================================
# DATABASE CONFIGURATION
# =========================================================

mysql_user = os.getenv("MYSQL_USER", "root")
mysql_password = os.getenv("MYSQL_PASSWORD", "")
mysql_host = os.getenv("MYSQL_HOST", "127.0.0.1")
mysql_port = os.getenv("MYSQL_PORT", "3306")
mysql_db = os.getenv("MYSQL_DB", "aviator")


def build_database_url():
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        if database_url.startswith("mysql://"):
            database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)
        try:
            parsed_url = make_url(database_url)
        except Exception as exc:
            raise RuntimeError("DATABASE_URL is not a valid MySQL connection URL.") from exc
        if parsed_url.get_backend_name() != "mysql":
            raise RuntimeError("This app is configured for MySQL only; DATABASE_URL must use MySQL.")
        if parsed_url.drivername == "mysql":
            parsed_url = parsed_url.set(drivername="mysql+pymysql")
        elif parsed_url.drivername != "mysql+pymysql":
            raise RuntimeError("MySQL must use the PyMySQL driver (mysql+pymysql).")
        return parsed_url

    if IS_PRODUCTION and not os.getenv("MYSQL_HOST"):
        raise RuntimeError("Set a MySQL DATABASE_URL or MYSQL_HOST in production.")

    try:
        port = int(mysql_port)
    except ValueError as exc:
        raise RuntimeError("MYSQL_PORT must be a valid port number.") from exc

    return URL.create(
        "mysql+pymysql",
        username=mysql_user,
        password=mysql_password,
        host=mysql_host,
        port=port,
        database=mysql_db,
        query={"charset": "utf8mb4"},
    )


app.config["SQLALCHEMY_DATABASE_URI"] = build_database_url()
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# =========================================================
# USER MODEL
# =========================================================

class User(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    username = db.Column(
        db.String(80),
        unique=True,
        nullable=False
    )

    email = db.Column(
        db.String(120),
        unique=True,
        nullable=False
    )

    phone = db.Column(
        db.String(32),
        nullable=True,
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    balance = db.Column(
        db.Float,
        default=0.0,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    game_history = db.relationship(
        "GameHistory",
        backref="user",
        lazy=True
    )


def normalize_phone_number(value):
    """Return a normalized international-style phone string, or None."""
    raw = str(value or "").strip()
    if not raw or not re.fullmatch(r"[+0-9() .-]+", raw):
        return None
    if raw.count("+") > 1 or ("+" in raw and not raw.startswith("+")):
        return None

    digits = re.sub(r"\D", "", raw)
    # Accept common Kenyan local mobile formats as well as +254 numbers.
    if len(digits) == 10 and digits.startswith("0"):
        digits = "254" + digits[1:]

    if not 7 <= len(digits) <= 15:
        return None

    return "+" + digits


# =========================================================
# GAME HISTORY MODEL
# =========================================================

class GameHistory(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    bet_amount = db.Column(
        db.Float,
        nullable=False
    )

    multiplier = db.Column(
        db.Float,
        nullable=False
    )

    result = db.Column(
        db.String(20),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )


# =========================================================
# GAME STATE MODEL
# =========================================================

class GameState(db.Model):

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    next_crash = db.Column(
        db.Float,
        nullable=False
    )


class GameRound(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    crash_point = db.Column(db.Float, nullable=False)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class Wager(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    round_id = db.Column(db.Integer, db.ForeignKey("game_round.id"), nullable=False, index=True)
    bet_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default="active", nullable=False)
    settled_multiplier = db.Column(db.Float, nullable=True)
    payout = db.Column(db.Float, default=0.0, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


# =========================================================
# CRASH GENERATOR
# =========================================================

def generate_crash():

    r = random.random()

    crash = round(
        1 / (1 - r),
        2
    )

    if crash > 100:
        crash = 100

    if crash < 2:

        crash = round(
            random.uniform(2, 4),
            2
        )

    return crash


# =========================================================
# GET OR CREATE GAME STATE
# =========================================================

def get_or_create_state():

    state = GameState.query.first()

    if state is None:

        state = GameState(
            next_crash=generate_crash()
        )

        db.session.add(state)

        db.session.commit()

    return state


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

with app.app_context():
    try:
        db.create_all()
    except Exception as exc:
        raise RuntimeError(
            "Could not initialize the MySQL database. Start MySQL in XAMPP, "
            "create the configured database (MYSQL_DB), and check MYSQL_HOST, "
            "MYSQL_PORT, MYSQL_USER, and MYSQL_PASSWORD."
        ) from exc

    # Add phone login support to databases created before phone numbers were
    # part of the account model. Existing users can add a number from Profile.
    user_table = User.__table__
    inspector = inspect(db.engine)
    user_columns = {column["name"] for column in inspector.get_columns(user_table.name)}
    if "phone" not in user_columns:
        quoted_table = db.engine.dialect.identifier_preparer.quote(user_table.name)
        with db.engine.begin() as connection:
            connection.exec_driver_sql(
                f"ALTER TABLE {quoted_table} ADD COLUMN phone VARCHAR(32)"
            )

    phone_index = Index("ix_user_phone", User.phone, unique=True)
    phone_index.create(bind=db.engine, checkfirst=True)

    get_or_create_state()


# =========================================================
# CURRENT USER
# =========================================================

def current_user():

    user_id = session.get("user_id")

    if not user_id:
        return None

    return db.session.get(
        User,
        user_id
    )


# =========================================================
# LOGIN REQUIRED DECORATOR
# =========================================================

def login_required(f):

    @wraps(f)
    def wrapper(*args, **kwargs):

        if not current_user():

            return redirect(
                url_for("login_page")
            )

        return f(*args, **kwargs)

    return wrapper


def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user:
            return redirect(url_for("login_page"))

        admin_phone = normalize_phone_number(os.getenv("ADMIN_PHONE", ""))
        if not admin_phone or user.phone != admin_phone:
            abort(403)

        return f(*args, **kwargs)

    return wrapper


# =========================================================
# HOME / AVIATOR
# =========================================================

@app.route("/")
def index():

    user = current_user()

    if not user:

        return redirect(
            url_for("login_page")
        )

    return render_template(
        "index.html",
        user=user
    )


# =========================================================
# AVIATOR ROUTE
# =========================================================

@app.route("/aviator")
@login_required
def aviator():

    user = current_user()

    return render_template(
        "index.html",
        user=user
    )


@app.route("/profile")
@app.route("/profile.html")
@login_required
def profile():
    return render_template("profile.html", user=current_user())


@app.route("/api/profile/phone", methods=["POST"])
@login_required
def update_profile_phone():
    payload = request.get_json(silent=True) or {}
    phone = normalize_phone_number(payload.get("phone"))
    if not phone:
        return jsonify({"error": "Enter a valid phone number."}), 400

    user = current_user()
    duplicate = User.query.filter(
        User.phone == phone,
        User.id != user.id,
    ).first()
    if duplicate:
        return jsonify({"error": "That phone number is already registered."}), 409

    user.phone = phone
    db.session.commit()
    return jsonify({"message": "Phone number saved.", "phone": user.phone})


# These navigation destinations are not implemented yet. Keep their URLs
# available so they can display the shared site chrome and a useful return link.
@app.route("/live.html")
@app.route("/jackpots.html")
@app.route("/shikisha-bet.html")
@app.route("/ligi-bigi.html")
@app.route("/casino.html")
@app.route("/promotions.html")
@app.route("/virtuals.html")
@app.route("/betika-fasta.html")
@app.route("/crash-games.html")
@app.route("/live-score.html")
def unavailable_section():
    return render_template("unavailable_section.html"), 404


# =========================================================
# FOOTER
# =========================================================
#
# footer.html is a complete standalone HTML document.
#
# The frontend loads it using:
#
#     fetch("/footer")
#
# This route simply returns the footer template.
# =========================================================

@app.route("/footer")
def footer():

    return render_template(
        "footer.html"
    )


# =========================================================
# CRASH ROUTE
# =========================================================

@app.route("/crash")
def crash():

    if not api_logged_in_user():
        return jsonify({"error": "Log in to start a game round."}), 401

    state = get_or_create_state()

    current = state.next_crash

    state.next_crash = generate_crash()
    round_row = GameRound(crash_point=current)
    db.session.add(round_row)

    # Bets queued during the previous flight join this round after countdown.
    queued_bets = Wager.query.filter_by(status="queued").all()
    for wager in queued_bets:
        wager.round_id = round_row.id
        wager.status = "active"

    db.session.commit()

    return jsonify({
        "crash": current,
        "round_id": round_row.id
    })


def api_logged_in_user():
    user_id = session.get("user_id")
    return db.session.get(User, user_id) if user_id else None


def server_round_multiplier(round_row):
    elapsed = max(0.0, (datetime.utcnow() - round_row.started_at).total_seconds())
    return math.floor((1 + elapsed * 0.25) * 100) / 100


def write_game_result(user, wager, result, multiplier):
    db.session.add(GameHistory(
        user_id=user.id,
        bet_amount=wager.bet_amount,
        multiplier=multiplier,
        result=result,
    ))


@app.route("/api/bets/place", methods=["POST"])
def place_bet():
    user = api_logged_in_user()
    if not user:
        return jsonify({"error": "Log in before placing a bet."}), 401

    payload = request.get_json(silent=True) or {}
    try:
        round_id = int(payload.get("round_id"))
        amount = Decimal(str(payload.get("amount", "")))
    except (TypeError, ValueError, InvalidOperation):
        return jsonify({"error": "Enter a valid stake and game round."}), 400

    if not amount.is_finite() or amount < Decimal("1") or amount > Decimal("1000000"):
        return jsonify({"error": "Bet amount must be between USD 1 and USD 1,000,000."}), 400

    round_row = db.session.get(GameRound, round_id)
    if not round_row:
        return jsonify({"error": "Game round not found. Wait for the next round."}), 404

    current_multiplier = server_round_multiplier(round_row)
    if current_multiplier >= round_row.crash_point:
        return jsonify({"error": "This round has crashed. Wait for the next round."}), 409

    active_count = Wager.query.filter(
        Wager.user_id == user.id,
        Wager.status.in_(("active", "queued")),
    ).count()
    if active_count >= 2:
        return jsonify({"error": "You already have two active bets this round."}), 409

    amount_value = round(float(amount), 2)
    if user.balance < amount_value:
        return jsonify({"error": "Insufficient balance."}), 400

    # If the multiplier has started, hold the bet for the next round.
    wager_status = "queued" if current_multiplier > 1.0 else "active"
    user.balance = round(user.balance - amount_value, 2)
    wager = Wager(
        user_id=user.id,
        round_id=round_row.id,
        bet_amount=amount_value,
        status=wager_status,
    )
    db.session.add(wager)
    db.session.commit()

    return jsonify({
        "wager_id": wager.id,
        "amount": amount_value,
        "balance": user.balance,
        "multiplier": current_multiplier,
        "status": wager_status,
    })


@app.route("/api/bets/cashout", methods=["POST"])
def cashout_bet():
    user = api_logged_in_user()
    if not user:
        return jsonify({"error": "Log in before cashing out."}), 401

    payload = request.get_json(silent=True) or {}
    try:
        wager_id = int(payload.get("wager_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid bet."}), 400

    wager = Wager.query.filter_by(id=wager_id, user_id=user.id).first()
    if not wager or wager.status != "active":
        return jsonify({"error": "This bet is no longer active."}), 409

    round_row = db.session.get(GameRound, wager.round_id)
    current_multiplier = server_round_multiplier(round_row)
    if current_multiplier >= round_row.crash_point:
        wager.status = "lost"
        wager.settled_multiplier = round_row.crash_point
        write_game_result(user, wager, "lose", round_row.crash_point)
        db.session.commit()
        return jsonify({
            "status": "lost",
            "multiplier": round_row.crash_point,
            "balance": user.balance,
            "error": "The plane crashed before cash-out. Your stake was lost.",
        })

    payout = round(wager.bet_amount * current_multiplier, 2)
    user.balance = round(user.balance + payout, 2)
    wager.status = "cashed_out"
    wager.settled_multiplier = current_multiplier
    wager.payout = payout
    write_game_result(user, wager, "win", current_multiplier)
    db.session.commit()

    return jsonify({
        "status": "cashed_out",
        "multiplier": current_multiplier,
        "payout": payout,
        "balance": user.balance,
    })


@app.route("/api/bets/settle-round", methods=["POST"])
def settle_round_bets():
    user = api_logged_in_user()
    if not user:
        return jsonify({"error": "Log in to settle bets."}), 401

    payload = request.get_json(silent=True) or {}
    try:
        round_id = int(payload.get("round_id"))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid game round."}), 400

    round_row = db.session.get(GameRound, round_id)
    if not round_row:
        return jsonify({"error": "Game round not found."}), 404

    wagers = Wager.query.filter_by(user_id=user.id, round_id=round_id, status="active").all()
    for wager in wagers:
        wager.status = "lost"
        wager.settled_multiplier = round_row.crash_point
        write_game_result(user, wager, "lose", round_row.crash_point)

    db.session.commit()
    return jsonify({"balance": user.balance, "lost_count": len(wagers)})


# =========================================================
# ADMIN PAGE
# =========================================================

@app.route("/admin")
@admin_required
def admin():

    return render_template(
        "admin.html"
    )


# =========================================================
# ADMIN DATA
# =========================================================

@app.route("/admin_data")
@admin_required
def admin_data():

    state = get_or_create_state()

    return jsonify({
        "next_crash": state.next_crash
    })


# =========================================================
# REGISTER
# =========================================================

@app.route(
    "/register",
    methods=["GET", "POST"]
)
def register():

    if request.method == "POST":

        payload = (
            request.get_json(silent=True)
            or request.form
        )

        username = (
            payload.get("username")
            or ""
        ).strip()

        email = (
            payload.get("email")
            or ""
        ).strip()

        phone = normalize_phone_number(payload.get("phone"))

        password = (
            payload.get("password")
            or ""
        )

        if not username or not email or not phone or not password:

            return jsonify({
                "error": (
                    "username, email, phone number, and password "
                    "are required. Enter a valid phone number."
                )
            }), 400

        existing_user = User.query.filter(
            (User.username == username)
            | (User.email == email)
            | (User.phone == phone)
        ).first()

        if existing_user:

            return jsonify({
                "error": (
                    "username, email, or phone number already exists"
                )
            }), 409

        user = User(
            username=username,
            email=email,
            phone=phone,
            password_hash=generate_password_hash(
                password
            ),
            # New accounts start with no funds. Balance changes must happen
            # through a verified payment flow, never from registration data.
            balance=0.0,
        )

        db.session.add(user)

        db.session.commit()

        # Registration is not a login; a user must authenticate explicitly
        # before they can access the game or its deposit controls.
        session.clear()

        if request.is_json:

            return jsonify({

                "message": (
                    "user registered successfully"
                ),

                "logged_in": False,

                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "phone": user.phone,
                    "balance": user.balance,
                },

            })

        return redirect(
            url_for("login_page")
        )

    return render_template(
        "register.html"
    )


# =========================================================
# LOGIN
# =========================================================

@app.route(
    "/login",
    methods=["GET", "POST"]
)
def login_page():

    if request.method == "POST":

        payload = (
            request.get_json(silent=True)
            or request.form
        )

        phone = normalize_phone_number(
            payload.get("phone")
            or ""
        )

        password = (
            payload.get("password")
            or ""
        )

        if not phone or not password:

            return jsonify({
                "error": (
                    "a valid phone number and password are required"
                )
            }), 400

        user = User.query.filter_by(
            phone=phone
        ).first()

        if (
            not user
            or not check_password_hash(
                user.password_hash,
                password
            )
        ):

            return jsonify({
                "error": (
                    "invalid phone number or password"
                )
            }), 401

        session.clear()
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
                    "phone": user.phone,
                    "balance": user.balance,
                },

            })

        return redirect(
            url_for("index")
        )

    return render_template(
        "login.html"
    )


# =========================================================
# LOGOUT
# =========================================================

@app.route(
    "/logout",
    methods=["GET", "POST"]
)
def logout():

    session.pop(
        "user_id",
        None
    )

    session.pop(
        "username",
        None
    )

    if request.method == "POST":

        return jsonify({
            "message": "logged out"
        })

    return redirect(
        url_for("login_page")
    )


# =========================================================
# CURRENT USER API
# =========================================================

@app.route("/me")
def me():

    user_id = session.get("user_id")

    if not user_id:

        return jsonify({
            "logged_in": False
        }), 401

    user = db.session.get(
        User,
        user_id
    )

    if not user:

        return jsonify({
            "logged_in": False
        }), 401

    return jsonify({

        "logged_in": True,

        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "balance": user.balance,
        },

    })


# =========================================================
# LOCAL M-PESA DEPOSIT TEST
# =========================================================

@app.route("/api/deposits/mpesa-test", methods=["POST"])
def mpesa_test_deposit():
    # This endpoint only simulates a successful provider confirmation. Keep it
    # unavailable in production so it cannot credit a live account.
    if IS_PRODUCTION and not app.testing:
        return jsonify({"error": "M-Pesa test deposits are disabled."}), 403

    user_id = session.get("user_id")
    user = db.session.get(User, user_id) if user_id else None
    if not user:
        return jsonify({"error": "Log in before depositing."}), 401

    payload = request.get_json(silent=True) or {}
    try:
        amount = Decimal(str(payload.get("amount", "")))
    except (InvalidOperation, TypeError, ValueError):
        return jsonify({"error": "Enter a valid deposit amount."}), 400

    if not amount.is_finite() or amount < Decimal("10") or amount > Decimal("1000000"):
        return jsonify({"error": "Test deposits must be between KES 10 and KES 1,000,000."}), 400

    user.balance = round(float(user.balance) + float(amount), 2)
    db.session.commit()

    return jsonify({
        "message": "Test credit added 1:1 to the USD balance. No real M-Pesa payment was made.",
        "test_mode": True,
        "amount": float(amount),
        "balance": user.balance,
    })


# =========================================================
# USERS API
# =========================================================

@app.route("/users")
@admin_required
def users():

    users = User.query.order_by(
        User.id.asc()
    ).all()

    return jsonify({

        "users": [

            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "balance": user.balance,
                "created_at": (
                    user.created_at.isoformat()
                ),
            }

            for user in users

        ]

    })


# =========================================================
# GAME HISTORY API
# =========================================================

@app.route("/game_history")
@login_required
def game_history():

    history = GameHistory.query.order_by(
        GameHistory.id.desc()
    ).filter_by(user_id=current_user().id).all()

    return jsonify({

        "history": [

            {
                "id": row.id,
                "user_id": row.user_id,
                "bet_amount": row.bet_amount,
                "multiplier": row.multiplier,
                "result": row.result,
                "created_at": (
                    row.created_at.isoformat()
                ),
            }

            for row in history

        ]

    })


# =========================================================
# PLAY GAME
# =========================================================

@app.route("/play", methods=["POST"])
def play_game():
    return jsonify({"error": "This endpoint is disabled. Use the authenticated bet and cash-out endpoints."}), 410


# =========================================================
# RUN APPLICATION
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=app.config["DEBUG"],
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "5000")),
    )
