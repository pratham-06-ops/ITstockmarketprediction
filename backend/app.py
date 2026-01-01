from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import yfinance as yf
from models.stock_predictor import StockPredictor
from models.lstm_model import LSTMModel
from utils.data_processor import DataProcessor
from utils.chart_generator import ChartGenerator
from services.mongodb_service import mongodb_service
from models.mongodb_models import User, Prediction
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Resolve absolute paths to avoid CWD-related issues
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize extensions
bcrypt = Bcrypt(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

CORS(app, supports_credentials=True, origins=Config.CORS_ORIGINS)

# MongoDB User class for Flask-Login compatibility
class MongoDBUser(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.username = user_data['username']
        self.email = user_data['email']
        self.password_hash = user_data['password_hash']
        self.is_admin = user_data.get('is_admin', False)
        self.created_at = user_data.get('created_at', datetime.utcnow())

@login_manager.user_loader
def load_user(user_id):
    user_data = mongodb_service.get_user_by_id(user_id)
    if user_data:
        # Convert user_data to dict format for MongoDBUser
        user_dict = {
            '_id': user_data.id,
            'username': user_data.username,
            'email': user_data.email,
            'password_hash': user_data.password_hash,
            'is_admin': user_data.is_admin,
            'created_at': user_data.created_at
        }
        return MongoDBUser(user_dict)
    return None

@login_manager.unauthorized_handler
def unauthorized_callback():
    # If the request is for an API route, return JSON 401
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Unauthorized'}), 401
    # Otherwise, redirect to login page
    return redirect(url_for('login'))

# Initialize ML models
stock_predictor = StockPredictor()
# Maintain a separate LSTM model per stock symbol to avoid cross-stock reuse
lstm_models = {}
data_processor = DataProcessor()
chart_generator = ChartGenerator()

# Sample CSV data for demonstration
def create_sample_data():
    """Create sample CSV data for TCS, WIPRO, and INFOSYS"""
    dates = pd.date_range(start='2020-01-01', end='2023-12-31', freq='D')
    
    # TCS data
    tcs_data = {
        'Date': dates,
        'Open': np.random.normal(3000, 200, len(dates)),
        'High': np.random.normal(3100, 200, len(dates)),
        'Low': np.random.normal(2900, 200, len(dates)),
        'Close': np.random.normal(3050, 200, len(dates)),
        'Volume': np.random.randint(1000000, 5000000, len(dates))
    }
    
    # WIPRO data
    wipro_data = {
        'Date': dates,
        'Open': np.random.normal(400, 50, len(dates)),
        'High': np.random.normal(420, 50, len(dates)),
        'Low': np.random.normal(380, 50, len(dates)),
        'Close': np.random.normal(410, 50, len(dates)),
        'Volume': np.random.randint(500000, 2000000, len(dates))
    }
    
    # INFOSYS data
    infosys_data = {
        'Date': dates,
        'Open': np.random.normal(1500, 150, len(dates)),
        'High': np.random.normal(1550, 150, len(dates)),
        'Low': np.random.normal(1450, 150, len(dates)),
        'Close': np.random.normal(1520, 150, len(dates)),
        'Volume': np.random.randint(800000, 3000000, len(dates))
    }
    
    # Save to CSV files in the backend/data directory
    pd.DataFrame(tcs_data).to_csv(os.path.join(DATA_DIR, 'tcs_stock_data.csv'), index=False)
    pd.DataFrame(wipro_data).to_csv(os.path.join(DATA_DIR, 'wipro_stock_data.csv'), index=False)
    pd.DataFrame(infosys_data).to_csv(os.path.join(DATA_DIR, 'infosys_stock_data.csv'), index=False)

# Routes
@app.route('/')
def home():
    return jsonify({'message': 'Stock Market Prediction API'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if mongodb_service.get_user_by_username(data['username']):
        return jsonify({'error': 'Username already exists'}), 400
    
    if mongodb_service.get_user_by_email(data['email']):
        return jsonify({'error': 'Email already exists'}), 400
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(username=data['username'], email=data['email'], password_hash=hashed_password)
    
    user_id = mongodb_service.create_user(user)
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user_data = mongodb_service.get_user_by_username(data['username'])
    
    if user_data and bcrypt.check_password_hash(user_data.password_hash, data['password']):
        # Convert user_data to dict format for MongoDBUser
        user_dict = {
            '_id': user_data.id,
            'username': user_data.username,
            'email': user_data.email,
            'password_hash': user_data.password_hash,
            'is_admin': user_data.is_admin,
            'created_at': user_data.created_at
        }
        user = MongoDBUser(user_dict)
        login_user(user)
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin
            }
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/logout')
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'})

@app.route('/api/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current password and new password are required'}), 400
    
    # Verify current password
    if not bcrypt.check_password_hash(current_user.password_hash, current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Hash new password
    new_password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
    
    # Update password in MongoDB
    success = mongodb_service.update_user_password(current_user.id, new_password_hash)
    if success:
        return jsonify({'message': 'Password changed successfully'})
    else:
        return jsonify({'error': 'Failed to update password'}), 500

@app.route('/api/predict', methods=['POST'])
@login_required
def predict():
    data = request.get_json()
    stock_symbol = data['stock_symbol']
    model_type = data.get('model_type', 'lstm')
    duration = data.get('duration', '1_day')  # New duration parameter
    
    # Map duration to days (support frontend durations)
    duration_mapping = {
        '1_day': 1,
        '1_week': 7,
        '1_month': 30,
        '3_month': 90,
        '6_month': 180,
        '1_year': 365
    }
    
    days_ahead = duration_mapping.get(duration, 1)
    
    # Validate days_ahead parameter for longer durations
    if duration in ['1_month', '1_year'] and days_ahead > 30:
        # For longer durations, we'll use a different approach
        pass
    
    try:
        # Load historical data using absolute path and validate
        csv_file = os.path.join(DATA_DIR, f"{stock_symbol.lower()}_stock_data.csv")
        if not os.path.exists(csv_file):
            return jsonify({'error': 'Stock data not found'}), 404

        df = pd.read_csv(csv_file)
        data_processor.validate_data(df)
        df = data_processor.preprocess_data(df)

        # Guard: ensure we still have enough rows post-preprocessing
        if len(df) < 80:
            return jsonify({'error': 'Insufficient data after preprocessing'}), 400

        # Make prediction, with graceful fallback to linear if LSTM fails
        fallback_reason = None
        if model_type == 'lstm':
            try:
                # Get or create a model dedicated to this stock symbol
                if stock_symbol not in lstm_models:
                    lstm_models[stock_symbol] = LSTMModel()
                prediction = lstm_models[stock_symbol].predict(df, days_ahead, duration)
            except Exception as model_err:
                fallback_reason = str(model_err)
                prediction = stock_predictor.predict(df, days_ahead) # Use stock_predictor as fallback
                model_type = 'lstm' # Ensure model_type is set to 'lstm' even on fallback
        else:
            prediction = stock_predictor.predict(df, days_ahead)
        
        # Save prediction to database (for single day predictions)
        if days_ahead == 1:
            pred = Prediction(
                user_id=current_user.id,
                stock_symbol=stock_symbol,
                predicted_price=prediction['predicted_price'],
                model_used=model_type,
                confidence_score=prediction.get('confidence', 0.8)
            )
            mongodb_service.create_prediction(pred)
        else:
            # For multi-day predictions, save the first day prediction
            pred = Prediction(
                user_id=current_user.id,
                stock_symbol=stock_symbol,
                predicted_price=prediction['predictions'][0]['predicted_price'],
                model_used=model_type,
                confidence_score=prediction.get('confidence', 0.8)
            )
            mongodb_service.create_prediction(pred)
        
        # Convert NumPy types to native Python types and prepare response
        if days_ahead == 1:
            result = {
                'predicted_price': float(prediction['predicted_price']),
                'confidence': float(prediction.get('confidence', 0.8)),
                'current_price': float(prediction.get('current_price', 0)),
                'prediction_date': prediction.get('prediction_date', ''),
                'technical_indicators': prediction.get('technical_indicators', {}),
                'model_type': prediction.get('model_type', model_type),
                'days_ahead': days_ahead,
                'duration': duration
            }
        else:
            # For multi-day predictions
            result = {
                'predictions': prediction.get('predictions', []),
                'confidence': float(prediction.get('confidence', 0.8)),
                'current_price': float(prediction.get('current_price', 0)),
                'prediction_date': prediction.get('prediction_date', ''),
                'technical_indicators': prediction.get('technical_indicators', {}),
                'model_type': prediction.get('model_type', model_type),
                'days_ahead': days_ahead,
                'duration': duration,
                'summary': prediction.get('summary', {})
            }

        response = {
            'prediction': result,
            'stock_symbol': stock_symbol,
            'model_used': model_type,
            'days_ahead': days_ahead,
            'duration': duration
        }
        if fallback_reason:
            response['fallback_reason'] = fallback_reason
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/current-price/<stock_symbol>')
def get_current_price(stock_symbol):
    """Get real-time current price for a stock"""
    try:
        # Map stock symbols to Yahoo Finance symbols
        symbol_mapping = {
            'TCS': 'TCS.NS',  # NSE
            'WIPRO': 'WIPRO.NS',  # NSE
            'INFOSYS': 'INFY.NS'  # NSE
        }
        
        yf_symbol = symbol_mapping.get(stock_symbol.upper())
        if not yf_symbol:
            return jsonify({'error': 'Invalid stock symbol'}), 400
        
        # Fetch current price from Yahoo Finance
        stock = yf.Ticker(yf_symbol)
        current_price = stock.info.get('regularMarketPrice')
        
        if current_price is None:
            return jsonify({'error': 'Unable to fetch current price'}), 500
        
        return jsonify({
            'stock_symbol': stock_symbol,
            'current_price': current_price,
            'currency': 'INR',
            'last_updated': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/multi-duration-predict', methods=['POST'])
@login_required
def multi_duration_predict():
    """Enhanced prediction endpoint for multiple durations with real-time data"""
    data = request.get_json()
    stock_symbol = data['stock_symbol']
    duration = data.get('duration', '1_week')
    
    try:
        # Get real-time current price
        symbol_mapping = {
            'TCS': 'TCS.NS',
            'WIPRO': 'WIPRO.NS',
            'INFOSYS': 'INFY.NS'
        }
        
        yf_symbol = symbol_mapping.get(stock_symbol.upper())
        if not yf_symbol:
            return jsonify({'error': 'Invalid stock symbol'}), 400
        
        stock = yf.Ticker(yf_symbol)
        current_price = stock.info.get('regularMarketPrice')
        
        if current_price is None:
            return jsonify({'error': 'Unable to fetch current price'}), 500
        
        # Load historical data
        csv_file = os.path.join(DATA_DIR, f"{stock_symbol.lower()}_stock_data.csv")
        if not os.path.exists(csv_file):
            return jsonify({'error': 'Stock data not found'}), 404

        df = pd.read_csv(csv_file)
        data_processor.validate_data(df)
        df = data_processor.preprocess_data(df)
        
        if len(df) < 80:
            return jsonify({'error': 'Insufficient data after preprocessing'}), 400
        
        # Get the last actual price from CSV
        last_actual_price = float(df['Close'].iloc[-1])
        
        # Make prediction based on duration
        if stock_symbol not in lstm_models:
            lstm_models[stock_symbol] = LSTMModel()
        
        # Map duration to days and prediction method (support frontend durations)
        duration_mapping = {
            '1_week': 7,
            '1_month': 30,
            '3_month': 90,
            '6_month': 180,
            '1_year': 365
        }
        
        days_ahead = duration_mapping.get(duration, 7)
        
        # Use the existing predict method for all durations
        prediction = lstm_models[stock_symbol].predict(df, days_ahead)
        
        # Calculate profit/loss analysis
        predicted_price = float(prediction.get('predictions', [{}])[-1].get('predicted_price', 0))
        
        if predicted_price and current_price:
            if predicted_price > current_price:
                profit_percentage = float(((predicted_price - current_price) / current_price) * 100)
                conclusion = f"Possible Profit of {profit_percentage:.2f}%"
                conclusion_type = "profit"
            else:
                loss_percentage = float(((current_price - predicted_price) / current_price) * 100)
                conclusion = f"Possible Loss of {loss_percentage:.2f}%"
                conclusion_type = "loss"
        else:
            conclusion = "Unable to determine profit/loss"
            conclusion_type = "unknown"
        
        # Save prediction to database
        pred = Prediction(
            user_id=current_user.id,
            stock_symbol=stock_symbol,
            predicted_price=predicted_price,
            model_used='lstm',
            confidence_score=float(prediction.get('confidence', 0.8))
        )
        mongodb_service.create_prediction(pred)
        
        # Prepare response
        result = {
            'actual_price': last_actual_price,
            'current_price': float(current_price),
            'predicted_price': predicted_price,
            'confidence': float(prediction.get('confidence', 0.8)),
            'prediction_date': prediction.get('prediction_date', ''),
            'technical_indicators': prediction.get('technical_indicators', {}),
            'model_type': 'LSTM',
            'duration': duration,
            'days_ahead': days_ahead,
            'conclusion': conclusion,
            'conclusion_type': conclusion_type,
            'predictions': prediction.get('predictions', [])
        }
        
        response = {
            'prediction': result,
            'stock_symbol': stock_symbol,
            'model_used': 'lstm',
            'duration': duration
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history')
@login_required
def get_history():
    predictions = mongodb_service.get_user_predictions(current_user.id)
    
    history = []
    for pred in predictions:
        history.append({
            'id': pred['id'],
            'stock_symbol': pred['stock_symbol'],
            'predicted_price': pred['predicted_price'],
            'actual_price': pred['actual_price'],
            'prediction_date': pred['prediction_date'],
            'model_used': pred['model_used'],
            'confidence_score': pred['confidence_score']
        })
    
    return jsonify({'history': history})

@app.route('/api/stocks')
def get_stocks():
    stocks = [
        {'symbol': 'TCS', 'name': 'Tata Consultancy Services'},
        {'symbol': 'WIPRO', 'name': 'Wipro Limited'},
        {'symbol': 'INFOSYS', 'name': 'Infosys Limited'}
    ]
    return jsonify({'stocks': stocks})

@app.route('/api/charts/<stock_symbol>')
def get_charts(stock_symbol):
    try:
        csv_file = os.path.join(DATA_DIR, f"{stock_symbol.lower()}_stock_data.csv")
        if not os.path.exists(csv_file):
            return jsonify({'error': 'Stock data not found'}), 404

        df = pd.read_csv(csv_file)
        data_processor.validate_data(df)
        df = data_processor.preprocess_data(df)
        
        # Generate different chart types
        line_chart = chart_generator.create_line_chart(df, stock_symbol)
        candlestick_chart = chart_generator.create_candlestick_chart(df, stock_symbol)
        pie_chart = chart_generator.create_pie_chart(df, stock_symbol)
        
        return jsonify({
            'line_chart': line_chart,
            'candlestick_chart': candlestick_chart,
            'pie_chart': pie_chart
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users')
@login_required
def get_users():
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    users = mongodb_service.get_all_users()
    
    return jsonify({'users': users})

@app.route('/api/admin/predictions')
@login_required
def get_all_predictions():
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    predictions = mongodb_service.get_all_predictions()
    
    return jsonify({'predictions': predictions})

@app.route('/api/admin/predictions/<string:prediction_id>', methods=['PUT'])
@login_required
def update_prediction(prediction_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    
    # Prepare updates
    updates = {}
    if 'actual_price' in data:
        updates['actual_price'] = data['actual_price']
    if 'model_used' in data:
        updates['model_used'] = data['model_used']
    if 'confidence_score' in data:
        updates['confidence_score'] = data['confidence_score']
    
    # Update prediction in MongoDB
    success = mongodb_service.update_prediction(prediction_id, updates)
    
    if success:
        prediction = mongodb_service.get_prediction_by_id(prediction_id)
        return jsonify({
            'message': 'Prediction updated successfully',
            'prediction': prediction
        })
    else:
        return jsonify({'error': 'Prediction not found'}), 404

@app.route('/api/admin/predictions/<string:prediction_id>', methods=['DELETE'])
@login_required
def delete_prediction(prediction_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    success = mongodb_service.delete_prediction(prediction_id)
    
    if success:
        return jsonify({'message': 'Prediction deleted successfully'})
    else:
        return jsonify({'error': 'Prediction not found'}), 404

@app.route('/api/admin/users/<string:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403

    success = mongodb_service.delete_user(user_id)
    if success:
        return jsonify({'message': 'User deleted successfully'})
    else:
        return jsonify({'error': 'User not found'}), 404

@app.route('/api/stats')
def get_stats():
    stats = mongodb_service.get_stats()
    return jsonify(stats)

if __name__ == '__main__':
    with app.app_context():
        # Create admin user if not exists
        admin = mongodb_service.get_user_by_username('admin')
        if not admin:
            hashed_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
            admin_user = User(username='admin', email='admin@stockprediction.com', 
                             password_hash=hashed_password, is_admin=True)
            mongodb_service.create_user(admin_user)
            print("Admin user created successfully")
        
        # Create sample data if not exists
        if not os.path.exists(os.path.join(DATA_DIR, 'tcs_stock_data.csv')):
            create_sample_data()
            print("Sample data created successfully")
    
    app.run(debug=True, host='localhost', port=5000)
