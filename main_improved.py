from flask import Flask, request, jsonify
from flask_cors import CORS
from database import Database
import os
import sqlite3
import re
from datetime import datetime
from functools import wraps
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=os.getenv('ALLOWED_ORIGINS', '*').split(','))

db = Database()

# Input validation helpers
def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """Validate username (alphanumeric and underscores only, 3-20 chars)"""
    pattern = r'^[a-zA-Z0-9_]{3,20}$'
    return re.match(pattern, username) is not None

def validate_password(password):
    """Validate password strength (min 8 chars, 1 uppercase, 1 lowercase, 1 number)"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    return True, "Password is valid"

# Rate limiting decorator (simple implementation)
request_counts = {}
def rate_limit(max_requests=10, window_seconds=60):
    """Simple rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            client_ip = request.remote_addr
            current_time = datetime.now().timestamp()
            
            if client_ip not in request_counts:
                request_counts[client_ip] = []
            
            # Remove old requests outside the time window
            request_counts[client_ip] = [
                req_time for req_time in request_counts[client_ip]
                if current_time - req_time < window_seconds
            ]
            
            if len(request_counts[client_ip]) >= max_requests:
                logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                return jsonify({'error': 'Too many requests. Please try again later.'}), 429
            
            request_counts[client_ip].append(current_time)
            return f(*args, **kwargs)
        return wrapped
    return decorator

# Error handler
@app.errorhandler(Exception)
def handle_error(error):
    """Global error handler"""
    logger.error(f"Unhandled error: {str(error)}", exc_info=True)
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred. Please try again later.'
    }), 500

@app.errorhandler(404)
def not_found(error):
    """404 error handler"""
    return jsonify({'error': 'Resource not found'}), 404

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }), 200

@app.route('/api/register', methods=['POST'])
@rate_limit(max_requests=5, window_seconds=300)  # 5 requests per 5 minutes
def register():
    """Register a new user with validation"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        email = data.get('email', '').strip().lower()
        
        # Validation
        if not all([username, password, email]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if not validate_username(username):
            return jsonify({
                'error': 'Invalid username. Must be 3-20 characters and contain only letters, numbers, and underscores'
            }), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        is_valid, msg = validate_password(password)
        if not is_valid:
            return jsonify({'error': msg}), 400
        
        # Create user
        user_id = db.create_user(username, password, email)
        
        logger.info(f"New user registered: {username} (ID: {user_id})")
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id,
            'username': username
        }), 201
        
    except sqlite3.IntegrityError as e:
        error_msg = str(e).lower()
        if 'username' in error_msg:
            return jsonify({'error': 'Username already exists'}), 409
        elif 'email' in error_msg:
            return jsonify({'error': 'Email already exists'}), 409
        else:
            return jsonify({'error': 'Registration failed. Please try again.'}), 409
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Registration failed. Please try again later.'}), 500

@app.route('/api/login', methods=['POST'])
@rate_limit(max_requests=10, window_seconds=300)  # 10 requests per 5 minutes
def login():
    """User login with proper password verification"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username', '').strip()
        password = data.get('password', '')
        
        if not all([username, password]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get user and verify password
        user = db.get_user_by_username(username, password)
        
        if user:
            logger.info(f"Successful login: {username}")
            
            # Remove password from response
            user_data = {k: v for k, v in user.items() if k != 'password'}
            
            return jsonify({
                'message': 'Login successful',
                'user': user_data
            }), 200
        
        logger.warning(f"Failed login attempt: {username}")
        return jsonify({'error': 'Invalid credentials'}), 401
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Login failed. Please try again later.'}), 500

@app.route('/api/wallet', methods=['GET'])
def get_wallet():
    """Get wallet information for a user"""
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        try:
            user_id = int(user_id)
        except ValueError:
            return jsonify({'error': 'Invalid user ID format'}), 400
        
        wallet = db.get_user_wallet(user_id)
        
        if wallet:
            return jsonify(wallet), 200
        
        return jsonify({'error': 'Wallet not found'}), 404
        
    except Exception as e:
        logger.error(f"Get wallet error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to retrieve wallet'}), 500

@app.route('/api/wallet/deposit', methods=['POST'])
@rate_limit(max_requests=20, window_seconds=60)
def deposit():
    """Deposit funds to wallet"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        wallet_id = data.get('wallet_id')
        amount = data.get('amount')
        
        if not all([wallet_id, amount]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        try:
            amount = float(amount)
            wallet_id = int(wallet_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid amount or wallet ID format'}), 400
        
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        if amount > 1000000:  # Sanity check
            return jsonify({'error': 'Amount too large'}), 400
        
        wallet = db.get_user_wallet(wallet_id)
        
        if wallet:
            new_balance = wallet['balance'] + amount
            db.update_wallet_balance(wallet_id, new_balance)
            
            logger.info(f"Deposit successful: Wallet {wallet_id}, Amount {amount}")
            
            return jsonify({
                'message': 'Deposit successful',
                'new_balance': new_balance,
                'amount_deposited': amount
            }), 200
        
        return jsonify({'error': 'Wallet not found'}), 404
        
    except Exception as e:
        logger.error(f"Deposit error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Deposit failed. Please try again later.'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get platform statistics"""
    try:
        # This would normally query the database for real stats
        stats = {
            'total_users': 0,  # db.get_total_users()
            'total_transactions': 0,  # db.get_total_transactions()
            'total_volume': 0,  # db.get_total_volume()
            'timestamp': datetime.now().isoformat()
        }
        return jsonify(stats), 200
    except Exception as e:
        logger.error(f"Stats error: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to retrieve statistics'}), 500

if __name__ == '__main__':
    # Initialize database
    with app.app_context():
        try:
            db.initialize_db()
            logger.info("Database initialized successfully")
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
            raise
    
    # Get configuration from environment
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting server on {host}:{port} (debug={debug})")
    
    app.run(host=host, port=port, debug=debug)
