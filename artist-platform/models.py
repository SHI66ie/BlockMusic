import psycopg2
import sqlite3
from datetime import datetime
import bcrypt
import os

class Database:
    def __init__(self, db_url=None):
        self.db_url = db_url
        self.initialize_db()

    def get_db_connection(self):
        if self.db_url:
            return psycopg2.connect(self.db_url)
        return sqlite3.connect('artist_platform.db')

    def initialize_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    is_artist BOOLEAN DEFAULT FALSE,
                    balance REAL DEFAULT 0.0,
                    date_created DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Tracks table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS tracks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    genre TEXT,
                    duration REAL,
                    price REAL DEFAULT 0.0,
                    file_path TEXT NOT NULL,
                    cover_art TEXT,
                    date_uploaded DATETIME DEFAULT CURRENT_TIMESTAMP,
                    plays INTEGER DEFAULT 0,
                    earnings REAL DEFAULT 0.0,
                    artist_id INTEGER,
                    album_id INTEGER,
                    FOREIGN KEY (artist_id) REFERENCES users (id),
                    FOREIGN KEY (album_id) REFERENCES albums (id)
                )
            ''')
            
            # Albums table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS albums (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    genre TEXT,
                    cover_art TEXT,
                    date_released DATETIME DEFAULT CURRENT_TIMESTAMP,
                    artist_id INTEGER,
                    FOREIGN KEY (artist_id) REFERENCES users (id)
                )
            ''')
            
            # Subscriptions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    artist_id INTEGER NOT NULL,
                    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    end_date DATETIME,
                    amount REAL NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (artist_id) REFERENCES users (id)
                )
            ''')
            
            # Streams table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS streams (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    track_id INTEGER NOT NULL,
                    date_streamed DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (track_id) REFERENCES tracks (id)
                )
            ''')
            conn.commit()
        finally:
            conn.close()

    def get_user_by_id(self, user_id):
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            if self.db_url:
                cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))
            else:
                cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            if user:
                return {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'password_hash': user[3],
                    'is_artist': bool(user[4]),
                    'balance': user[5],
                    'date_created': user[6]
                }
            return None
        finally:
            conn.close()
    def get_user_by_username(self, username):
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            if self.db_url:
                cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
            else:
                cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            if user:
                return {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'password_hash': user[3],
                    'is_artist': bool(user[4]),
                    'balance': user[5],
                    'date_created': user[6]
                }
            return None
        finally:
            conn.close()

    def get_user_by_email(self, email):
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            if self.db_url:
                cursor.execute('SELECT * FROM users WHERE email = %s', (email,))
            else:
                cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
            user = cursor.fetchone()
            if user:
                return {
                    'id': user[0],
                    'username': user[1],
                    'email': user[2],
                    'password_hash': user[3],
                    'is_artist': bool(user[4]),
                    'balance': user[5],
                    'date_created': user[6]
                }
            return None
        finally:
            conn.close()

    def create_user(self, username, email, password, is_artist=False):
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            if self.db_url:
                cursor.execute('''
                    INSERT INTO users (username, email, password_hash, is_artist)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                ''', (username, email, password_hash, is_artist))
                return cursor.fetchone()[0]
            else:
                cursor.execute('''
                    INSERT INTO users (username, email, password_hash, is_artist)
                    VALUES (?, ?, ?, ?)
                ''', (username, email, password_hash, is_artist))
                conn.commit()
                return cursor.lastrowid
        finally:
            conn.close()

    def verify_password(self, username, password):
        user = self.get_user_by_username(username)
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return True
        return False

    def create_track(self, title, description, genre, duration, price, file_path, artist_id, album_id=None):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO tracks (title, description, genre, duration, price, file_path, artist_id, album_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (title, description, genre, duration, price, file_path, artist_id, album_id))
            conn.commit()
            return cursor.lastrowid

    def get_tracks(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT t.*, u.username as artist_name 
                FROM tracks t
                JOIN users u ON t.artist_id = u.id
            ''')
            return cursor.fetchall()

    def create_subscription(self, user_id, artist_id, amount):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO subscriptions (user_id, artist_id, amount)
                VALUES (?, ?, ?)
            ''', (user_id, artist_id, amount))
            conn.commit()
            return cursor.lastrowid

    def create_stream(self, user_id, track_id):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO streams (user_id, track_id)
                VALUES (?, ?)
            ''', (user_id, track_id))
            conn.commit()
            return cursor.lastrowid
