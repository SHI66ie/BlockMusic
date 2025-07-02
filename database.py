import psycopg2
import sqlite3
from datetime import datetime
import bcrypt
import os
from typing import Any, Dict, List, Optional

class Database:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL', 'sqlite:///blockmusic.db')
        self.conn = self.get_db_connection()
        self.initialize_db()

    def get_db_connection(self):
        if self.db_url.startswith('postgresql'):
            return psycopg2.connect(self.db_url)
        return sqlite3.connect(self.db_url)

    def initialize_db(self):
        self.create_tables()

    def create_tables(self):
        """Create necessary tables if they don't exist"""
        with self.conn:
            cursor = self.conn.cursor()
            if self.db_url.startswith('postgresql'):
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
            else:
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        balance REAL DEFAULT 0.0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS wallets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        balance REAL DEFAULT 0.0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users (id)
                    )
                ''')

    def execute_query(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Execute a query and return results as list of dictionaries"""
        with self.conn:
            cursor = self.conn.cursor()
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            return results

    def execute_insert(self, query: str, params: tuple = ()) -> int:
        """Execute an insert query and return the last inserted row id"""
        with self.conn:
            cursor = self.conn.cursor()
            cursor.execute(query, params)
            if self.db_url.startswith('postgresql'):
                return cursor.fetchone()[0]
            return cursor.lastrowid

    def execute_update(self, query: str, params: tuple = ()) -> None:
        """Execute an update query"""
        with self.conn:
            self.conn.execute(query, params)

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        if self.db_url.startswith('postgresql'):
            query = "SELECT * FROM users WHERE username = %s"
        else:
            query = "SELECT * FROM users WHERE username = ?"
        results = self.execute_query(query, (username,))
        return results[0] if results else None

    def create_user(self, username: str, password: str, email: str) -> int:
        if self.db_url.startswith('postgresql'):
            query = "INSERT INTO users (username, password, email) VALUES (%s, %s, %s) RETURNING id"
        else:
            query = "INSERT INTO users (username, password, email) VALUES (?, ?, ?)"
        user_id = self.execute_insert(query, (username, password, email))
        
        # Create wallet for the user
        wallet_query = "INSERT INTO wallets (user_id) VALUES (?)"
        self.execute_insert(wallet_query, (user_id,))
        
        return user_id

    def get_user_wallet(self, user_id: int) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM wallets WHERE user_id = ?"
        results = self.execute_query(query, (user_id,))
        return results[0] if results else None

    def update_wallet_balance(self, wallet_id: int, new_balance: float) -> None:
        query = "UPDATE wallets SET balance = ? WHERE id = ?"
        self.execute_update(query, (new_balance, wallet_id))
