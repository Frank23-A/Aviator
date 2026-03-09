from flask import Flask, render_template, jsonify
import random

app = Flask(__name__)

# store next crash value
next_crash = 1.0

def generate_crash():
    r = random.random()
    crash = round(1/(1-r),2)
    if crash > 100:
        crash = 100
    return crash

# create first crash value
next_crash = generate_crash()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/crash")
def crash():
    global next_crash

    current = next_crash
    next_crash = generate_crash()

    return jsonify({"crash": current})


@app.route("/admin")
def admin():
    return render_template("admin.html")


@app.route("/admin_data")
def admin_data():
    return jsonify({"next_crash": next_crash})


if __name__ == "__main__":
    app.run(debug=True)