from flask import Flask, request, jsonify
from flask_cors import CORS
from database import Database
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

db = Database()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    
    if not all([username, password, email]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        user_id = db.create_user(username, password, email)
        return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not all([username, password]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    user = db.get_user_by_username(username)
    if user and user['password'] == password:  # In a real app, use proper password hashing
        return jsonify({'message': 'Login successful', 'user': user}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/wallet', methods=['GET'])
def get_wallet():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID required'}), 400
    
    wallet = db.get_user_wallet(int(user_id))
    if wallet:
        return jsonify(wallet)
    return jsonify({'error': 'Wallet not found'}), 404

@app.route('/api/wallet/deposit', methods=['POST'])
def deposit():
    data = request.get_json()
    wallet_id = data.get('wallet_id')
    amount = data.get('amount')
    
    if not all([wallet_id, amount]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
            
        wallet = db.get_user_wallet(wallet_id)
        if wallet:
            new_balance = wallet['balance'] + amount
            db.update_wallet_balance(wallet_id, new_balance)
            return jsonify({'message': 'Deposit successful', 'new_balance': new_balance})
        return jsonify({'error': 'Wallet not found'}), 404
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
