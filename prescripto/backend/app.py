from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import re
import pytesseract
from PIL import Image
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
from datetime import datetime

# Configure tesseract executable path since we are on Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

GOOGLE_CLIENT_ID = "725427460622-eglmp3igtau3rb4vai1ag47u9cr42s4g.apps.googleusercontent.com"

# Create Flask app
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
app = Flask(__name__, static_folder=frontend_dir, static_url_path='')

app.secret_key = 'prescripto_super_secret_key_change_in_production'

# --- DATABASE CONFIGURATION ---
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- DATABASE MODELS ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    username = db.Column(db.String(100), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)
    
    name = db.Column(db.String(100), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    blood_group = db.Column(db.String(10), nullable=True)
    height_weight = db.Column(db.String(50), nullable=True)
    conditions = db.Column(db.String(255), nullable=True)
    emergency_contact = db.Column(db.String(100), nullable=True)
    language_setting = db.Column(db.String(10), default='en')

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "name": self.name,
            "age": self.age,
            "gender": self.gender,
            "blood_group": self.blood_group,
            "height_weight": self.height_weight,
            "conditions": self.conditions,
            "emergency_contact": self.emergency_contact,
            "language_setting": self.language_setting
        }

class ScheduleItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    medicine_name = db.Column(db.String(100), nullable=False)
    time_of_day = db.Column(db.String(50), nullable=False)
    instructions = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "medicine_name": self.medicine_name,
            "time_of_day": self.time_of_day,
            "instructions": self.instructions
        }

# Create the database tables if they don't exist
with app.app_context():
    db.create_all()

# --- AUTH DECORATOR ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login_page'))
        return f(*args, **kwargs)
    return decorated_function

# --- HTML ROUTES ---
@app.route('/')
def home():
    """Serve the animated welcome landing page"""
    if 'user_id' in session:
        return redirect(url_for('index'))
    return send_from_directory(frontend_dir, 'welcome.html')

@app.route('/login')
def login_page():
    """Serve the login/registration page"""
    if 'user_id' in session:
        return redirect(url_for('index'))
    return send_from_directory(frontend_dir, 'login.html')

@app.route('/dashboard')
@login_required
def index():
    return send_from_directory(frontend_dir, 'index.html')

@app.route('/upload')
@login_required
def upload():
    return send_from_directory(frontend_dir, 'upload.html')

@app.route('/medicines')
@login_required
def medicines():
    return send_from_directory(frontend_dir, 'medicines.html')

@app.route('/history')
@login_required
def history():
    return send_from_directory(frontend_dir, 'history.html')

@app.route('/profile')
@login_required
def profile():
    return send_from_directory(frontend_dir, 'profile.html')

@app.route('/settings')
@login_required
def settings():
    return send_from_directory(frontend_dir, 'settings.html')

# --- AUTHENTICATION API ROUTES ---

@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user via username and password"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    name = data.get('name', username)
    email = data.get('email', None)
    
    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400
        
    user = User.query.filter_by(username=username).first()
    if user:
        return jsonify({"success": False, "message": "Username already exists"}), 400
        
    hashed_pw = generate_password_hash(password)
    new_user = User(username=username, email=email, password_hash=hashed_pw, name=name)
    db.session.add(new_user)
    db.session.commit()
    
    session['user_id'] = new_user.id
    return jsonify({"success": True, "message": "Registered successfully", "user": new_user.to_dict()}), 201

@app.route('/api/login', methods=['POST'])
def submit_login():
    """Login a user via username/phone/email and password"""
    data = request.json
    identifier = data.get('identifier') # Could be username, email, or phone
    password = data.get('password')
    
    if not identifier or not password:
        return jsonify({"success": False, "message": "Credentials required"}), 400
    
    # Try finding by username, email, or phone
    user = User.query.filter((User.username == identifier) | (User.email == identifier) | (User.phone_number == identifier)).first()
    
    if user and user.password_hash and check_password_hash(user.password_hash, password):
        session['user_id'] = user.id
        return jsonify({"success": True, "message": "Logged in successfully", "user": user.to_dict()}), 200
        
    return jsonify({"success": False, "message": "Invalid credentials"}), 401

@app.route('/api/logout', methods=['POST', 'GET'])
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login_page'))

# --- USER DATA API ROUTES ---

@app.route('/api/me', methods=['GET'])
@login_required
def get_current_user():
    """Fetch profile data for logged in user"""
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"success": True, "user": user.to_dict()}), 200

@app.route('/api/profile', methods=['POST'])
@login_required
def update_profile():
    """Update user profile info"""
    data = request.json
    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404
        
    # Update fields if provided
    if 'name' in data: user.name = data['name']
    if 'age' in data: user.age = data['age']
    if 'gender' in data: user.gender = data['gender']
    if 'blood_group' in data: user.blood_group = data['blood_group']
    if 'height_weight' in data: user.height_weight = data['height_weight']
    if 'conditions' in data: user.conditions = data['conditions']
    if 'emergency_contact' in data: user.emergency_contact = data['emergency_contact']
    if 'language_setting' in data: user.language_setting = data['language_setting']
    
    db.session.commit()
    return jsonify({"success": True, "message": "Profile updated", "user": user.to_dict()}), 200

@app.route('/get_medicines', methods=['GET'])
@login_required
def get_medicines():
    """Fetch all saved medicines for logged in user"""
    all_items = ScheduleItem.query.filter_by(user_id=session['user_id']).all()
    return jsonify([item.to_dict() for item in all_items])

@app.route('/save_medicine', methods=['POST'])
@login_required
def save_medicine():
    """Save a single medicine schedule for the logged in user"""
    data = request.json
    medicine = data.get('medicine_name')
    time_of_day = data.get('time_of_day')
    instructions = data.get('instructions', '')

    if not medicine or not time_of_day:
        return jsonify({"error": "Missing medicine_name or time_of_day"}), 400

    new_item = ScheduleItem(
        user_id=session['user_id'],
        medicine_name=medicine, 
        time_of_day=time_of_day,
        instructions=instructions
    )
    
    db.session.add(new_item)
    db.session.commit()

    return jsonify({"message": "Medicine saved successfully!", "item": new_item.to_dict()}), 201

# --- OCR & EXTERNAL API ROUTES ---

@app.route('/upload_prescription', methods=['POST'])
@login_required
def upload_prescription():
    """Handle image upload, extract text via OCR, and return parsed medicines."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        img = Image.open(file.stream)
        extracted_text = pytesseract.image_to_string(img)
        
        keywords = ['mg', 'ml', 'tablet', 'capsule', 'syrup', 'dr.', 'dr', 'doctor', 'clinic', 'hospital', 'rx', 'prescription', 'take', 'daily']
        text_lower = extracted_text.lower()
        
        if len(text_lower.strip()) < 10 or not any(kw in text_lower for kw in keywords):
            return jsonify({
                "error": "No prescription found in the given image, make sure you have uploaded the precise prescription. Please try again with a clear image."
            }), 400
            
        results = []
        lines = extracted_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 5:
                continue
                
            line_lower = line.lower()
            
            if 'mg' in line_lower or 'ml' in line_lower or 'tablet' in line_lower:
                purpose = "Medicine"
                time = "General"
                
                if 'fever' in line_lower or 'pain' in line_lower or 'paracetamol' in line_lower:
                    purpose = "Fever / Pain relief"
                elif 'infection' in line_lower or 'amoxicillin' in line_lower:
                    purpose = "Antibiotic"
                elif 'vitamin' in line_lower or 'calcium' in line_lower:
                    purpose = "Supplement"
                    
                if 'morning' in line_lower or 'breakfast' in line_lower:
                    time = "Morning"
                elif 'afternoon' in line_lower or 'lunch' in line_lower:
                    time = "Afternoon"
                elif 'night' in line_lower or 'dinner' in line_lower or 'bed' in line_lower:
                    time = "Night"
                    
                results.append({
                    "name": line,
                    "purpose": purpose,
                    "time": time
                })
        
        if not results:
             return jsonify({
                "error": "Text was found but no recognizable medicines could be extracted. Please ensure the prescription is legible."
            }), 400
            
        return jsonify({"medicines": results}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

@app.route('/generate_schedule', methods=['POST'])
@login_required
def generate_schedule():
    """
    API endpoint to process prescription instructions
    and return a daily schedule JSON response.
    """
    data = request.json
    instructions = data.get('instructions', '')
    
    schedule = {
        "morning": [],
        "afternoon": [],
        "evening": [],
        "night": []
    }
    
    if not instructions:
        return jsonify(schedule)

    lines = instructions.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        lower_line = line.lower()
        
        keywords = ["after breakfast", "after lunch", "after dinner", "after food", "before sleep", "twice daily"]
        matched_keywords = [kw for kw in keywords if kw in lower_line]
        
        medicine = line
        for kw in matched_keywords:
            medicine = re.sub(rf'(?i){re.escape(kw)}', '', medicine)
            
        time_match = re.search(r'\b(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm)\b', lower_line)
        if time_match:
            medicine = re.sub(rf'(?i)(?:\bat\s+)?{re.escape(time_match.group(0))}', '', medicine)
            
        medicine = medicine.strip(' ,-:')
            
        if not medicine:
            continue

        is_morning = "after breakfast" in lower_line
        is_afternoon = "after lunch" in lower_line or "after food" in lower_line or "twice daily" in lower_line
        is_evening = "after dinner" in lower_line or "twice daily" in lower_line
        is_night = "before sleep" in lower_line
        
        if time_match:
            hour = int(time_match.group(1))
            ampm = time_match.group(3)
            
            if ampm == 'pm' and hour != 12:
                hour += 12
            elif ampm == 'am' and hour == 12:
                hour = 0
                
            if 5 <= hour < 12:
                is_morning = True
            elif 12 <= hour < 17:
                is_afternoon = True
            elif 17 <= hour < 21:
                is_evening = True
            else:
                is_night = True
        
        if is_morning:
            schedule["morning"].append(medicine)
        if is_afternoon:
            schedule["afternoon"].append(medicine)
        if is_evening:
            schedule["evening"].append(medicine)
        if is_night:
            schedule["night"].append(medicine)
            
    return jsonify(schedule)

@app.route('/api/google-login', methods=['POST'])
def google_login():
    data = request.get_json()
    access_token = data.get('access_token', '')

    if not access_token:
        return jsonify({"success": False, "message": "Missing access token"}), 400

    try:
        headers = {'Authorization': f'Bearer {access_token}'}
        people_api_url = 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,birthdays,genders'
        response = requests.get(people_api_url, headers=headers)
        
        if response.status_code != 200:
            return jsonify({"success": False, "message": "Failed to fetch profile from Google"}), 400
            
        profile_data = response.json()
        
        google_user_id = profile_data.get('resourceName', '').replace('people/', '')
        email = profile_data.get('emailAddresses', [{}])[0].get('value', '')
        name = profile_data.get('names', [{}])[0].get('displayName', '')
        
        if not email or not google_user_id:
            return jsonify({"success": False, "message": "Could not extract essential profile info"}), 400

        gender = None
        genders_list = profile_data.get('genders', [])
        if genders_list:
            raw_gender = genders_list[0].get('value', '').lower()
            if raw_gender == 'male':
                gender = 'Male'
            elif raw_gender == 'female':
                gender = 'Female'
            else:
                gender = raw_gender.capitalize()
                
        age = None
        birthdays_list = profile_data.get('birthdays', [])
        for b in birthdays_list:
            date_info = b.get('date', {})
            year = date_info.get('year')
            month = date_info.get('month')
            day = date_info.get('day')
            
            if year and month and day:
                today = datetime.today()
                age = today.year - year - ((today.month, today.day) < (month, day))
                break

        user = User.query.filter_by(google_id=google_user_id).first()
        if not user:
            # Also check if user exists by email, to link accounts
            user = User.query.filter_by(email=email).first()
            if user:
                user.google_id = google_user_id
            else:
                user = User(
                    email=email, 
                    name=name, 
                    google_id=google_user_id,
                    gender=gender,
                    age=age
                )
            db.session.add(user)
        else:
            updated = False
            if gender and not user.gender:
                user.gender = gender
                updated = True
            if age and not user.age:
                user.age = age
                updated = True
            if updated:
                db.session.add(user)
        
        db.session.commit()

        # Set Session
        session['user_id'] = user.id

        return jsonify({
            "success": True, 
            "message": "Login successful",
            "user": user.to_dict()
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
