#!/usr/bin/env python3
"""
Migration Script: SQLite to MongoDB
This script helps migrate existing data from SQLite to MongoDB
"""

import os
import sqlite3
from datetime import datetime
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_sqlite_to_mongodb():
    """Migrate data from SQLite to MongoDB"""
    
    # MongoDB connection settings
    MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
    MONGODB_DATABASE = os.environ.get('MONGODB_DATABASE', 'stock_prediction_db')
    
    # SQLite database path
    SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'stock_prediction.db')
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.server_info()
        logger.info("Successfully connected to MongoDB")
        
        db = client[MONGODB_DATABASE]
        users_collection = db['users']
        predictions_collection = db['predictions']
        
        # Connect to SQLite
        if not os.path.exists(SQLITE_DB_PATH):
            logger.warning(f"SQLite database not found at {SQLITE_DB_PATH}")
            logger.info("No migration needed - starting fresh with MongoDB")
            return
        
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_cursor = sqlite_conn.cursor()
        
        logger.info("Starting migration from SQLite to MongoDB...")
        
        # Migrate users
        logger.info("Migrating users...")
        sqlite_cursor.execute("SELECT id, username, email, password_hash, is_admin, created_at FROM user")
        users = sqlite_cursor.fetchall()
        
        migrated_users = 0
        for user in users:
            user_id, username, email, password_hash, is_admin, created_at = user
            
            # Check if user already exists in MongoDB
            existing_user = users_collection.find_one({"username": username})
            if existing_user:
                logger.info(f"User {username} already exists in MongoDB, skipping...")
                continue
            
            user_doc = {
                "username": username,
                "email": email,
                "password_hash": password_hash,
                "is_admin": bool(is_admin),
                "created_at": datetime.fromisoformat(created_at) if created_at else datetime.utcnow()
            }
            
            result = users_collection.insert_one(user_doc)
            logger.info(f"Migrated user: {username} -> {result.inserted_id}")
            migrated_users += 1
        
        logger.info(f"Migrated {migrated_users} users")
        
        # Migrate predictions
        logger.info("Migrating predictions...")
        sqlite_cursor.execute("""
            SELECT id, user_id, stock_symbol, predicted_price, actual_price, 
                   prediction_date, model_used, confidence_score 
            FROM prediction
        """)
        predictions = sqlite_cursor.fetchall()
        
        migrated_predictions = 0
        for prediction in predictions:
            pred_id, user_id, stock_symbol, predicted_price, actual_price, \
            prediction_date, model_used, confidence_score = prediction
            
            # Find the corresponding user in MongoDB
            user_doc = users_collection.find_one({"username": f"user_{user_id}"})
            if not user_doc:
                # Try to find by original SQLite ID (if we stored it)
                user_doc = users_collection.find_one({"sqlite_id": user_id})
            
            if not user_doc:
                logger.warning(f"Could not find user for prediction {pred_id}, skipping...")
                continue
            
            prediction_doc = {
                "user_id": str(user_doc["_id"]),
                "stock_symbol": stock_symbol,
                "predicted_price": predicted_price,
                "actual_price": actual_price,
                "prediction_date": datetime.fromisoformat(prediction_date) if prediction_date else datetime.utcnow(),
                "model_used": model_used,
                "confidence_score": confidence_score
            }
            
            result = predictions_collection.insert_one(prediction_doc)
            logger.info(f"Migrated prediction: {pred_id} -> {result.inserted_id}")
            migrated_predictions += 1
        
        logger.info(f"Migrated {migrated_predictions} predictions")
        
        # Close connections
        sqlite_conn.close()
        client.close()
        
        logger.info("Migration completed successfully!")
        logger.info(f"Migrated {migrated_users} users and {migrated_predictions} predictions")
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise e

if __name__ == "__main__":
    migrate_sqlite_to_mongodb()
