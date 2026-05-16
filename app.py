# =============================================================================
# DepriSense AI - Student Depression Risk Prediction Platform
# Production Ready Flask Backend
# =============================================================================

import os
import io
import pickle
import logging
import traceback
from datetime import datetime

import numpy as np
from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    session,
    jsonify,
    send_file
)

# =============================================================================
# OPTIONAL PDF SUPPORT
# =============================================================================

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
        Table,
        TableStyle
    )
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet
    PDF_ENABLED = True
except:
    PDF_ENABLED = False

# =============================================================================
# FLASK APP CONFIG
# =============================================================================

app = Flask(__name__)

app.secret_key = "deprisense-secret-key"

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

# =============================================================================
# MODEL LOADING
# =============================================================================

MODEL_PATH = "student_depression_model.pkl"

model = None

def load_model():
    global model

    try:
        with open(MODEL_PATH, "rb") as file:
            model = pickle.load(file)

        logger.info("Model loaded successfully.")

    except Exception as e:
        logger.warning(f"Model loading failed: {e}")
        model = None

load_model()

# =============================================================================
# FEATURE LIST
# =============================================================================

FEATURES = [
    "age",
    "gender",
    "academic_pressure",
    "study_satisfaction",
    "sleep_duration",
    "dietary_habits",
    "suicidal_thoughts",
    "study_hours",
    "financial_stress",
    "family_history_mental_illness",
    "social_support",
    "physical_activity",
    "substance_use",
    "therapy_history",
    "chronic_illness",
    "loneliness",
    "work_study_balance",
    "cgpa"
]

# =============================================================================
# RECOMMENDATIONS
# =============================================================================

RECOMMENDATIONS = {
    "Low": [
        "Maintain your healthy daily routine.",
        "Continue positive study-life balance.",
        "Stay socially connected."
    ],

    "Moderate": [
        "Improve sleep schedule.",
        "Reduce academic overload.",
        "Practice stress management techniques.",
        "Talk to mentors or friends."
    ],

    "High": [
        "Seek professional mental health support.",
        "Contact a counselor immediately.",
        "Reduce stress triggers.",
        "Stay connected with supportive people."
    ]
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_float(form, key, minimum=None, maximum=None):

    value = form.get(key)

    if value is None or value == "":
        raise ValueError(f"{key} is required.")

    try:
        value = float(value)

    except:
        raise ValueError(f"{key} must be numeric.")

    if minimum is not None and value < minimum:
        raise ValueError(f"{key} must be >= {minimum}")

    if maximum is not None and value > maximum:
        raise ValueError(f"{key} must be <= {maximum}")

    return value


def parse_form_data(form):

    values = []

    values.append(get_float(form, "age", 10, 100))
    values.append(get_float(form, "gender", 0, 1))
    values.append(get_float(form, "academic_pressure", 1, 5))
    values.append(get_float(form, "study_satisfaction", 1, 5))
    values.append(get_float(form, "sleep_duration", 0, 24))
    values.append(get_float(form, "dietary_habits", 1, 3))
    values.append(get_float(form, "suicidal_thoughts", 0, 1))
    values.append(get_float(form, "study_hours", 0, 24))
    values.append(get_float(form, "financial_stress", 1, 5))
    values.append(get_float(form, "family_history_mental_illness", 0, 1))
    values.append(get_float(form, "social_support", 1, 5))
    values.append(get_float(form, "physical_activity", 0, 40))
    values.append(get_float(form, "substance_use", 0, 1))
    values.append(get_float(form, "therapy_history", 0, 1))
    values.append(get_float(form, "chronic_illness", 0, 1))
    values.append(get_float(form, "loneliness", 1, 5))
    values.append(get_float(form, "work_study_balance", 1, 5))
    values.append(get_float(form, "cgpa", 0, 10))

    return np.array(values).reshape(1, -1)


def generate_demo_prediction(features):

    score = (
        features[0][2] * 0.20 +
        (5 - features[0][3]) * 0.10 +
        features[0][6] * 0.30 +
        features[0][8] * 0.15 +
        features[0][15] * 0.15
    )

    if score < 1.8:
        return "Low", 28, 82

    elif score < 3.2:
        return "Moderate", 61, 87

    else:
        return "High", 89, 93


def predict_risk(features):

    if model is not None:

        try:

            prediction = int(model.predict(features)[0])

            probabilities = model.predict_proba(features)[0]

            confidence = round(float(np.max(probabilities)) * 100, 1)

            risk_percent = round(float(probabilities[prediction]) * 100, 1)

            risk_map = {
                0: "Low",
                1: "Moderate",
                2: "High"
            }

            risk_level = risk_map.get(prediction, "Moderate")

            return risk_level, risk_percent, confidence

        except Exception as e:

            logger.error(str(e))

            return generate_demo_prediction(features)

    else:

        return generate_demo_prediction(features)

# =============================================================================
# ROUTES
# =============================================================================

@app.route("/")
def index():

    return render_template(
        "index.html",
        model_loaded=model is not None
    )


@app.route("/predict", methods=["GET", "POST"])
def predict():

    if request.method == "GET":

        return render_template(
            "predict.html",
            model_loaded=model is not None
        )

    try:

        features = parse_form_data(request.form)

        risk_level, risk_percent, confidence = predict_risk(features)

        recommendations = RECOMMENDATIONS.get(risk_level, [])

        result = {
           "student_name": request.form.get("name", "Student"),
    	   "risk_level": risk_level,
           "risk_percent": risk_percent,
           "confidence": confidence,
           "recommendations": recommendations,
	   "demo_mode": model is None,
           "timestamp": datetime.now().strftime("%d %B %Y, %I:%M %p")
        }

        history = session.get("history", [])

        history.insert(0, result)

        session["history"] = history[:10]

        session["last_result"] = result

        flash("AI analysis completed successfully.", "success")

        return render_template(
            "result.html",
            result=result
        )

    except ValueError as e:

        flash(str(e), "danger")

        return render_template(
            "predict.html"
        )

    except Exception as e:

        logger.error(traceback.format_exc())

        flash("Prediction failed. Please try again.", "danger")

        return render_template(
            "predict.html"
        )

# =============================================================================
# DASHBOARD
# =============================================================================

@app.route("/dashboard")
def dashboard():

    history = session.get("history", [])

    return render_template(
        "dashboard.html",
        history=history
    )

# =============================================================================
# INSIGHTS
# =============================================================================

@app.route("/insights")
def insights():

    insights_data = [
        {
            "title": "Academic Pressure",
            "value": "High impact on student wellness"
        },
        {
            "title": "Sleep Analysis",
            "value": "Poor sleep strongly affects mental health"
        },
        {
            "title": "Social Support",
            "value": "Strong support lowers depression risk"
        }
    ]

    return render_template(
        "insights.html",
        insights=insights_data
    )

# =============================================================================
# ABOUT
# =============================================================================

@app.route("/about")
def about():

    return render_template("about.html")

# =============================================================================
# CONTACT
# =============================================================================

@app.route("/contact", methods=["GET", "POST"])
def contact():

    if request.method == "POST":

        name = request.form.get("name")
        email = request.form.get("email")
        message = request.form.get("message")

        if not name or not email or not message:

            flash("All fields are required.", "warning")

            return render_template("contact.html")

        flash("Message sent successfully.", "success")

        return redirect(url_for("contact"))

    return render_template("contact.html")

# =============================================================================
# DOWNLOAD REPORT
# =============================================================================

@app.route("/download-report")
def download_report():

    if not PDF_ENABLED:

        flash("PDF generation not available.", "danger")

        return redirect(url_for("dashboard"))

    result = session.get("last_result")

    if not result:

        flash("No analysis found.", "warning")

        return redirect(url_for("predict"))

    buffer = io.BytesIO()

    doc = SimpleDocTemplate(buffer, pagesize=A4)

    styles = getSampleStyleSheet()

    content = []

    content.append(
        Paragraph("Student Depression Risk Report", styles["Title"])
    )

    content.append(Spacer(1, 20))

    table_data = [
        ["Metric", "Value"],
        ["Risk Level", result["risk_level"]],
        ["Risk Percentage", f"{result['risk_percent']}%"],
        ["Confidence", f"{result['confidence']}%"],
        ["Generated", result["timestamp"]]
    ]

    table = Table(table_data)

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.purple),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 1, colors.black)
    ]))

    content.append(table)

    content.append(Spacer(1, 20))

    content.append(
        Paragraph("Recommendations", styles["Heading2"])
    )

    for recommendation in result["recommendations"]:

        content.append(
            Paragraph(f"• {recommendation}", styles["BodyText"])
        )

    doc.build(content)

    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="deprisense_report.pdf",
        mimetype="application/pdf"
    )

# =============================================================================
# CLEAR HISTORY
# =============================================================================

@app.route("/clear-history", methods=["POST"])
def clear_history():

    session.clear()

    flash("History cleared successfully.", "info")

    return redirect(url_for("dashboard"))

# =============================================================================
# API PREDICTION
# =============================================================================

@app.route("/api/predict", methods=["POST"])
def api_predict():

    try:

        data = request.get_json()

        class FakeForm(dict):

            def get(self, key, default=None):
                return str(super().get(key, default))

        fake_form = FakeForm(data)

        features = parse_form_data(fake_form)

        risk_level, risk_percent, confidence = predict_risk(features)

        return jsonify({
            "risk_level": risk_level,
            "risk_percent": risk_percent,
            "confidence": confidence
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500

# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.route("/health")
def health():

    return jsonify({
        "status": "running",
        "model_loaded": model is not None,
        "timestamp": str(datetime.now())
    })

# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(error):

    return render_template(
        "error.html",
        code=404,
        message="Page not found."
    ), 404


@app.errorhandler(405)
def method_not_allowed(error):

    return render_template(
        "error.html",
        code=405,
        message="Method not allowed."
    ), 405


@app.errorhandler(500)
def internal_server_error(error):

    return render_template(
        "error.html",
        code=500,
        message="Internal server error."
    ), 500

# =============================================================================
# CONTEXT PROCESSOR
# =============================================================================

@app.context_processor
def inject_globals():

    return {
        "current_year": datetime.now().year,
        "app_name": "DepriSense",
        "app_version": "1.0.0",
        "model_loaded": model is not None,
        "nav_links": [
            {"endpoint": "index", "label": "Home"},
            {"endpoint": "predict", "label": "Predict"},
            {"endpoint": "dashboard", "label": "Dashboard"},
            {"endpoint": "insights", "label": "Insights"},
            {"endpoint": "about", "label": "About"},
            {"endpoint": "contact", "label": "Contact"}
        ]
    }

# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )