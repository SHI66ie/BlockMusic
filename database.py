import psycopg2
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import os
from typing import Any, Dict, List, Optional

class Database:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL')
        if not self.db_url:
            raise ValueError("DATABASE_URL environment variable is required")
        self.conn = self.get_db_connection()
        self.initialize_db()

    def get_db_connection(self):
        return psycopg2.connect(self.db_url)

    def initialize_db(self):
        self.create_tables()

    def create_tables(self):
        """Create necessary tables if they don't exist"""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    balance REAL DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS wallets (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    balance REAL DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            conn.commit()
        finally:
            conn.close()

    def execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Execute a query and return results as list of dictionaries"""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            return results
        finally:
            conn.close()

    def execute_insert(self, query: str, params: tuple = ()) -> int:
        """Execute an insert query and return the last inserted row id"""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.fetchone()[0]
        finally:
            conn.close()

    def execute_update(self, query: str, params: tuple = ()) -> None:
        """Execute an update query"""
        conn = self.get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(query, params)
        finally:
            conn.close()

    def get_user_by_username(self, username: str, password: str = None) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM users WHERE username = %s"
        results = self.execute_query(query, (username,))
        user = results[0] if results else None
        if user and password:
            if check_password_hash(user['password'], password):
                return user
        return user

    def create_user(self, username: str, password: str, email: str) -> int:
        hashed_password = generate_password_hash(password)
        query = "INSERT INTO users (username, password, email) VALUES (%s, %s, %s) RETURNING id"
        user_id = self.execute_insert(query, (username, hashed_password, email))
        
        # Create wallet for the user
        wallet_query = "INSERT INTO wallets (user_id) VALUES (%s)"
        self.execute_insert(wallet_query, (user_id,))
        
        return user_id

    def get_user_wallet(self, user_id: int) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM wallets WHERE user_id = %s"
        results = self.execute_query(query, (user_id,))
        return results[0] if results else None

    def update_wallet_balance(self, wallet_id: int, new_balance: float) -> None:
        query = "UPDATE wallets SET balance = %s WHERE id = %s"
        self.execute_update(query, (new_balance, wallet_id))
