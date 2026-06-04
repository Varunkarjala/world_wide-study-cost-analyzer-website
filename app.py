from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)

def connect_to_db():
    conn = sqlite3.connect('education.db')
    # This configuration lets us read database rows like dictionaries (by column names)
    conn.row_factory = sqlite3.Row
    return conn

# Route to display the website homepage
@app.route('/')
def index():
    return render_template('index.html')

# Backend Endpoint 1: Fetches average tuition fee rankings grouped by country
@app.route('/api/tuition-by-country')
def api_tuition_by_country():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    query = """
        SELECT Country, AVG(Tuition_USD) as Average_Tuition 
        FROM costs 
        GROUP BY Country 
        ORDER BY Average_Tuition DESC
    """
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    
    # Convert SQL rows into standard list format for the frontend
    return jsonify([dict(row) for row in results])

# Backend Endpoint 2: Fetches every university's Living Cost Index vs Rent for the scatter chart
@app.route('/api/living-vs-rent')
def api_living_vs_rent():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    query = "SELECT University, Country, Living_Cost_Index, Rent_USD FROM costs"
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in results])

# Backend Endpoint 3: Fetches all data for client-side analytics
@app.route('/api/all-costs')
def api_all_costs():
    conn = connect_to_db()
    cursor = conn.cursor()
    
    query = """
        SELECT rowid AS id, Country, City, University, Program, Level, Duration_Years, 
               Tuition_USD, Living_Cost_Index, Rent_USD, Visa_Fee_USD, 
               Insurance_USD, Exchange_Rate 
        FROM costs
    """
    cursor.execute(query)
    results = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(row) for row in results])

# Backend Endpoint 4: Create a new cost record
@app.route('/api/costs', methods=['POST'])
def add_cost():
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    try:
        country = data.get('Country')
        city = data.get('City')
        university = data.get('University')
        program = data.get('Program')
        level = data.get('Level')
        duration_years = float(data.get('Duration_Years', 1))
        tuition_usd = int(data.get('Tuition_USD', 0))
        living_cost_index = float(data.get('Living_Cost_Index', 0))
        rent_usd = int(data.get('Rent_USD', 0))
        visa_fee_usd = int(data.get('Visa_Fee_USD', 0))
        insurance_usd = int(data.get('Insurance_USD', 0))
        exchange_rate = float(data.get('Exchange_Rate', 1.0))
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid data types: {str(e)}"}), 400
    
    conn = connect_to_db()
    cursor = conn.cursor()
    query = """
        INSERT INTO costs (Country, City, University, Program, Level, Duration_Years, 
                           Tuition_USD, Living_Cost_Index, Rent_USD, Visa_Fee_USD, 
                           Insurance_USD, Exchange_Rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    try:
        cursor.execute(query, (country, city, university, program, level, duration_years, 
                               tuition_usd, living_cost_index, rent_usd, visa_fee_usd, 
                               insurance_usd, exchange_rate))
        record_id = cursor.lastrowid
        conn.commit()
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Database insertion failed: {str(e)}"}), 500
    
    conn.close()
    return jsonify({"status": "success", "id": record_id}), 201

# Backend Endpoint 5: Update an existing cost record
@app.route('/api/costs/<int:record_id>', methods=['PUT'])
def update_cost(record_id):
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    try:
        country = data.get('Country')
        city = data.get('City')
        university = data.get('University')
        program = data.get('Program')
        level = data.get('Level')
        duration_years = float(data.get('Duration_Years'))
        tuition_usd = int(data.get('Tuition_USD'))
        living_cost_index = float(data.get('Living_Cost_Index'))
        rent_usd = int(data.get('Rent_USD'))
        visa_fee_usd = int(data.get('Visa_Fee_USD'))
        insurance_usd = int(data.get('Insurance_USD'))
        exchange_rate = float(data.get('Exchange_Rate'))
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"Invalid data types: {str(e)}"}), 400

    conn = connect_to_db()
    cursor = conn.cursor()
    query = """
        UPDATE costs 
        SET Country = ?, City = ?, University = ?, Program = ?, Level = ?, Duration_Years = ?, 
            Tuition_USD = ?, Living_Cost_Index = ?, Rent_USD = ?, Visa_Fee_USD = ?, 
            Insurance_USD = ?, Exchange_Rate = ?
        WHERE rowid = ?
    """
    try:
        cursor.execute(query, (country, city, university, program, level, duration_years, 
                               tuition_usd, living_cost_index, rent_usd, visa_fee_usd, 
                               insurance_usd, exchange_rate, record_id))
        conn.commit()
        affected_rows = cursor.rowcount
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Database update failed: {str(e)}"}), 500
    
    conn.close()
    if affected_rows == 0:
        return jsonify({"error": "Record not found"}), 404
    
    return jsonify({"status": "success"})

# Backend Endpoint 6: Delete a cost record
@app.route('/api/costs/<int:record_id>', methods=['DELETE'])
def delete_cost(record_id):
    conn = connect_to_db()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM costs WHERE rowid = ?", (record_id,))
        conn.commit()
        affected_rows = cursor.rowcount
    except Exception as e:
        conn.close()
        return jsonify({"error": f"Database deletion failed: {str(e)}"}), 500
    
    conn.close()
    if affected_rows == 0:
        return jsonify({"error": "Record not found"}), 404
        
    return jsonify({"status": "success"})

if __name__ == '__main__':
    # Start the local development web server
    app.run(debug=True)