from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import os
import re
import pytesseract
from PIL import Image

# Configure tesseract executable path since we are on Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Create Flask app
# Point static folder and template folder to the frontend directory so we don't need a separate static folder
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))
app = Flask(__name__, static_folder=frontend_dir, static_url_path='')

# --- DATABASE CONFIGURATION ---
basedir = os.path.abspath(os.path.dirname(__file__))
# Set path for the SQLite database file (app.db) inside the backend folder
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database
db = SQLAlchemy(app)

# --- DATABASE MODELS ---
class ScheduleItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    medicine_name = db.Column(db.String(100), nullable=False)
    time_of_day = db.Column(db.String(50), nullable=False) # e.g., 'morning', 'night'
    instructions = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "medicine_name": self.medicine_name,
            "time_of_day": self.time_of_day,
            "instructions": self.instructions
        }

# Create the database tables if they don't exist
with app.app_context():
    db.create_all()

@app.route('/')
def home():
    """Serve the landing home page"""
    return send_from_directory(frontend_dir, 'home.html')

@app.route('/dashboard')
def index():
    """Serve the main frontend page index.html"""
    return send_from_directory(frontend_dir, 'index.html')

@app.route('/upload')
def upload():
    """Serve the upload prescription page"""
    return send_from_directory(frontend_dir, 'upload.html')

@app.route('/medicines')
def medicines():
    """Serve the medicines list page"""
    return send_from_directory(frontend_dir, 'medicines.html')

@app.route('/history')
def history():
    """Serve the prescription history page"""
    return send_from_directory(frontend_dir, 'history.html')

@app.route('/profile')
def profile():
    """Serve the profile page"""
    return send_from_directory(frontend_dir, 'profile.html')

@app.route('/settings')
def settings():
    """Serve the settings page"""
    return send_from_directory(frontend_dir, 'settings.html')

@app.route('/upload_prescription', methods=['POST'])
def upload_prescription():
    """Handle image upload, extract text via OCR, and return parsed medicines."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    try:
        # Load the image
        img = Image.open(file.stream)
        
        # Extract text using Tesseract OCR
        extracted_text = pytesseract.image_to_string(img)
        
        # Simple heuristic to determine if it's a valid prescription
        # We look for common medical or dosage keywords
        keywords = ['mg', 'ml', 'tablet', 'capsule', 'syrup', 'dr.', 'dr', 'doctor', 'clinic', 'hospital', 'rx', 'prescription', 'take', 'daily']
        text_lower = extracted_text.lower()
        
        # If text is too short or doesn't contain any keywords
        if len(text_lower.strip()) < 10 or not any(kw in text_lower for kw in keywords):
            return jsonify({
                "error": "No prescription found in the given image, make sure you have uploaded the precise prescription. Please try again with a clear image."
            }), 400
            
        # Parse the extracted text to find medicines.
        # This is a very basic parser assuming format: "MedicineName Xmg Instruction"
        # Since OCR text can be messy, we'll try to extract lines that look like medicines
        results = []
        lines = extracted_text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or len(line) < 5:
                continue
                
            line_lower = line.lower()
            
            # Simple heuristic for a medicine line: contains a dosage (like 500mg) or common instruction
            if 'mg' in line_lower or 'ml' in line_lower or 'tablet' in line_lower:
                # Default values
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
                    "name": line, # Use the whole line as name to capture full context
                    "purpose": purpose,
                    "time": time
                })
        
        # If we successfully read text but couldn't parse specific medicines based on our heuristics
        if not results:
             return jsonify({
                "error": "Text was found but no recognizable medicines could be extracted. Please ensure the prescription is legible."
            }), 400
            
        return jsonify({"medicines": results}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

@app.route('/generate_schedule', methods=['POST'])
def generate_schedule():
    """
    API endpoint to process prescription instructions
    and return a daily schedule JSON response.
    """
    data = request.json
    instructions = data.get('instructions', '')
    
    # Initialize the required schedule dictionary with 4 time slots
    schedule = {
        "morning": [],
        "afternoon": [],
        "evening": [],
        "night": []
    }
    
    if not instructions:
        return jsonify(schedule)

    # Process instructions line by line
    lines = instructions.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        lower_line = line.lower()
        
        # Determine the medicine name
        # We find all matching keywords and remove them to isolate the medicine name
        keywords = ["after breakfast", "after lunch", "after dinner", "after food", "before sleep", "twice daily"]
        
        matched_keywords = [kw for kw in keywords if kw in lower_line]
        
        # Extract medicine name by removing all keywords from the line
        medicine = line
        for kw in matched_keywords:
            medicine = re.sub(rf'(?i){re.escape(kw)}', '', medicine)
            
        # Extract time if present
        time_match = re.search(r'\b(1[0-2]|0?[1-9])(?::([0-5][0-9]))?\s*(am|pm)\b', lower_line)
        if time_match:
            # Remove the time and optionally "at" before it
            medicine = re.sub(rf'(?i)(?:\bat\s+)?{re.escape(time_match.group(0))}', '', medicine)
            
        # Clean up any extra spaces or punctuation
        medicine = medicine.strip(' ,-:')
            
        if not medicine:
            continue

        # Keywords detection based on the user's requirements
        is_morning = "after breakfast" in lower_line
        is_afternoon = "after lunch" in lower_line or "after food" in lower_line or "twice daily" in lower_line
        is_evening = "after dinner" in lower_line or "twice daily" in lower_line
        is_night = "before sleep" in lower_line
        
        # Time detection based on extracted time
        if time_match:
            hour = int(time_match.group(1))
            ampm = time_match.group(3)
            
            # Convert to 24-hour format
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
        
        # Append medicine to the correct lists
        if is_morning:
            schedule["morning"].append(medicine)
        if is_afternoon:
            schedule["afternoon"].append(medicine)
        if is_evening:
            schedule["evening"].append(medicine)
        if is_night:
            schedule["night"].append(medicine)
            
        # If no explicit timing was found, we add it to a generic slot or just ignore. 
        # For this application, we only schedule it if it matches the text.
        
    return jsonify(schedule)

@app.route('/get_medicines', methods=['GET'])
def get_medicines():
    """Fetch all saved medicines from the database"""
    all_items = ScheduleItem.query.all()
    return jsonify([item.to_dict() for item in all_items])

@app.route('/save_medicine', methods=['POST'])
def save_medicine():
    """Save a single medicine schedule to the database"""
    data = request.json
    medicine = data.get('medicine_name')
    time_of_day = data.get('time_of_day')
    instructions = data.get('instructions', '')

    if not medicine or not time_of_day:
        return jsonify({"error": "Missing medicine_name or time_of_day"}), 400

    new_item = ScheduleItem(
        medicine_name=medicine, 
        time_of_day=time_of_day,
        instructions=instructions
    )
    
    db.session.add(new_item)
    db.session.commit()

    return jsonify({"message": "Medicine saved successfully!", "item": new_item.to_dict()}), 201

if __name__ == '__main__':
    # Run the Flask app
    app.run(debug=True, port=5000)
