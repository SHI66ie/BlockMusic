import sqlite3
from typing import Any, Dict, List, Optional

class Database:
    def __init__(self, db_name: str = 'blockmusic.db'):
        self.db_name = db_name
        self.conn = sqlite3.connect(self.db_name)
        self.create_tables()

    def create_tables(self):
        """Create necessary tables if they don't exist"""
        with self.conn:
            self.conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            self.conn.execute('''
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
            cursor = self.conn.execute(query, params)
            columns = [col[0] for col in cursor.description]
            results = []
            for row in cursor.fetchall():
                results.append(dict(zip(columns, row)))
            return results

    def execute_insert(self, query: str, params: tuple = ()) -> int:
        """Execute an insert query and return the last inserted row id"""
        with self.conn:
            cursor = self.conn.execute(query, params)
            return cursor.lastrowid

    def execute_update(self, query: str, params: tuple = ()) -> None:
        """Execute an update query"""
        with self.conn:
            self.conn.execute(query, params)

    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        query = "SELECT * FROM users WHERE username = ?"
        results = self.execute_query(query, (username,))
        return results[0] if results else None

    def create_user(self, username: str, password: str, email: str) -> int:
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
