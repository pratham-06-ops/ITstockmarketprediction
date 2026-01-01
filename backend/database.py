from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from config import Config
import logging

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
            # Test the connection
            self.client.server_info()
            self.db = self.client[Config.MONGODB_DATABASE]
            logging.info("✅ Successfully connected to MongoDB")
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logging.error(f"❌ Failed to connect to MongoDB: {e}")
            self.db = None
            raise e
    
    def get_collection(self, collection_name):
        """Get a collection from the database"""
        if self.db is None:
            self.connect()
        return self.db[collection_name]
    
    def close(self):
        """Close the MongoDB connection"""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            logging.info("🔌 MongoDB connection closed")

# Global MongoDB instance
mongodb = MongoDB()
