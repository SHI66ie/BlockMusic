from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_cors import CORS
from models import Database
from datetime import datetime, timedelta
import jwt
import os
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

CORS(app)
db = Database(os.getenv('DATABASE_URL', 'sqlite:///artist_platform.db'))
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Create upload directory if it doesn't exist
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

@login_manager.user_loader
def load_user(user_id):
    user = db.get_user_by_id(user_id)
    if user:
        return user
    return None

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    is_artist = data.get('is_artist', False)
    
    if db.get_user_by_username(username):
        return jsonify({'error': 'Username already exists'}), 400
    
    if db.get_user_by_email(email):
        return jsonify({'error': 'Email already exists'}), 400
    
    db.create_user(username, email, password, is_artist)
    
    return jsonify({'message': 'Registration successful'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if db.verify_password(username, password):
        user = db.get_user_by_username(username)
        token = jwt.encode({
            'user_id': user['id'],
            'exp': datetime.utcnow() + timedelta(hours=1)
        }, app.config['SECRET_KEY'])
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'is_artist': user['is_artist'],
                'balance': user['balance']
            }
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/upload/track', methods=['POST'])
@login_required
def upload_track():
    if not request.json.get('is_artist'):
        return jsonify({'error': 'Only artists can upload tracks'}), 403
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        track_id = db.create_track(
            title=request.form.get('title'),
            description=request.form.get('description'),
            genre=request.form.get('genre'),
            duration=float(request.form.get('duration', 0)),
            price=float(request.form.get('price', 0)),
            file_path=filepath,
            artist_id=request.json.get('user_id')
        )
        
        return jsonify({
            'message': 'Track uploaded successfully',
            'track_id': track_id
        }), 201
    
    return jsonify({'error': 'File upload failed'}), 400

@app.route('/api/tracks', methods=['GET'])
def get_tracks():
    tracks = db.get_tracks()
    return jsonify([{
        'id': track[0],
        'title': track[1],
        'artist': track[13],  # artist_name from JOIN
        'genre': track[4],
        'duration': track[5],
        'price': track[6],
        'plays': track[10],
        'cover_art': track[8]
    } for track in tracks])

@app.route('/api/subscribe/<int:artist_id>', methods=['POST'])
def subscribe(artist_id):
    if request.json.get('user_id') == artist_id:
        return jsonify({'error': 'Cannot subscribe to yourself'}), 400
    
    subscription_id = db.create_subscription(
        user_id=request.json.get('user_id'),
        artist_id=artist_id,
        amount=9.99  # Monthly subscription price
    )
    
    return jsonify({
        'message': 'Subscription successful',
        'subscription_id': subscription_id
    })

@app.route('/api/stream/<int:track_id>', methods=['POST'])
def stream_track(track_id):
    # TODO: Implement subscription check
    stream_id = db.create_stream(
        user_id=request.json.get('user_id'),
        track_id=track_id
    )
    
    return jsonify({
        'message': 'Stream successful',
        'stream_id': stream_id
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5001, debug=True)
