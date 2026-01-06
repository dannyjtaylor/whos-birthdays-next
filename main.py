from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# In production, use a proper database
BIRTHDAYS_FILE = 'birthdays.json'

def load_birthdays():
    if os.path.exists(BIRTHDAYS_FILE):
        with open(BIRTHDAYS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_birthdays(birthdays):
    with open(BIRTHDAYS_FILE, 'w') as f:
        json.dump(birthdays, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/birthdays', methods=['GET'])
def get_birthdays():
    return jsonify(load_birthdays())

@app.route('/api/birthdays', methods=['POST'])
def add_birthday():
    data = request.json
    birthdays = load_birthdays()
    
    # Validate
    name = data.get('name', '').strip()
    month = int(data.get('month'))
    day = int(data.get('day'))
    
    # Check for duplicates
    if any(b['name'].lower() == name.lower() and b['month'] == month and b['day'] == day 
           for b in birthdays):
        return jsonify({'error': 'Birthday already exists'}), 400
    
    # Add birthday
    birthday = {
        'id': len(birthdays) + 1,
        'name': name,
        'month': month,
        'day': day,
        'created_at': datetime.now().isoformat()
    }
    birthdays.append(birthday)
    save_birthdays(birthdays)
    
    return jsonify(birthday), 201

@app.route('/api/birthdays/<int:birthday_id>', methods=['PUT'])
def update_birthday(birthday_id):
    data = request.json
    birthdays = load_birthdays()
    
    # Find birthday to update
    birthday_index = next((i for i, b in enumerate(birthdays) if b.get('id') == birthday_id), None)
    if birthday_index is None:
        return jsonify({'error': 'Birthday not found'}), 404
    
    # Validate
    name = data.get('name', '').strip()
    month = int(data.get('month'))
    day = int(data.get('day'))
    
    # Check for duplicates (excluding current birthday)
    if any(b['name'].lower() == name.lower() and b['month'] == month and b['day'] == day 
           and b.get('id') != birthday_id for b in birthdays):
        return jsonify({'error': 'Birthday already exists'}), 400
    
    # Update birthday
    birthdays[birthday_index]['name'] = name
    birthdays[birthday_index]['month'] = month
    birthdays[birthday_index]['day'] = day
    birthdays[birthday_index]['updated_at'] = datetime.now().isoformat()
    
    save_birthdays(birthdays)
    return jsonify(birthdays[birthday_index])

@app.route('/api/birthdays/<int:birthday_id>', methods=['DELETE'])
def delete_birthday(birthday_id):
    birthdays = load_birthdays()
    birthdays = [b for b in birthdays if b.get('id') != birthday_id]
    save_birthdays(birthdays)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

