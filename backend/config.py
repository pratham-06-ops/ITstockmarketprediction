import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    
    # MongoDB Configuration
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb://localhost:27017/'
    MONGODB_DATABASE = os.environ.get('MONGODB_DATABASE') or 'stock_prediction_db'
    
    # MongoDB Collections
    USERS_COLLECTION = 'users'
    PREDICTIONS_COLLECTION = 'predictions'
    
    # Other configurations
    CORS_ORIGINS = ['http://localhost:3000']
    
    @staticmethod
    def init_app(app):
        pass
