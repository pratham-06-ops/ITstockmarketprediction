#!/usr/bin/env python3
"""
MongoDB Setup Script for Stock Market Prediction Application
Run this script to set up MongoDB for the application
"""

import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_mongodb():
    """Setup MongoDB database and collections"""
    
    # MongoDB connection settings
    MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
    MONGODB_DATABASE = os.environ.get('MONGODB_DATABASE', 'stock_prediction_db')
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.server_info()
        logger.info("Successfully connected to MongoDB")
        
        # Get database
        db = client[MONGODB_DATABASE]
        
        # Create collections
        users_collection = db['users']
        predictions_collection = db['predictions']
        
        # Create indexes for better performance
        logger.info("Creating database indexes...")
        
        # Users collection indexes
        users_collection.create_index("username", unique=True)
        users_collection.create_index("email", unique=True)
        
        # Predictions collection indexes
        predictions_collection.create_index("user_id")
        predictions_collection.create_index("stock_symbol")
        predictions_collection.create_index("prediction_date")
        predictions_collection.create_index([("user_id", 1), ("prediction_date", -1)])
        
        logger.info("Database indexes created successfully")
        
        # Create admin user if not exists
        from flask_bcrypt import Bcrypt
        bcrypt = Bcrypt()
        
        admin_user = users_collection.find_one({"username": "admin"})
        if not admin_user:
            hashed_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
            admin_data = {
                "username": "admin",
                "email": "admin@stockprediction.com",
                "password_hash": hashed_password,
                "is_admin": True,
                "created_at": "2024-01-01T00:00:00Z"
            }
            users_collection.insert_one(admin_data)
            logger.info("Admin user created successfully")
        else:
            logger.info("Admin user already exists")
        
        logger.info(f"MongoDB setup completed successfully!")
        logger.info(f"Database: {MONGODB_DATABASE}")
        logger.info(f"Collections: users, predictions")
        
        client.close()
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.error("Please make sure MongoDB is running on your system")
        raise e
    except Exception as e:
        logger.error(f"Error setting up MongoDB: {e}")
        raise e

if __name__ == "__main__":
    setup_mongodb()
