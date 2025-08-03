from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from models.stock_predictor import StockPredictor
from models.lstm_model import LSTMModel
from models.linear_regression_model import LinearRegressionModel
from utils.data_processor import DataProcessor
from utils.chart_generator import ChartGenerator

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///stock_prediction.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

CORS(app)

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    predictions = db.relationship('Prediction', backref='user', lazy=True)

class Prediction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    stock_symbol = db.Column(db.String(10), nullable=False)
    predicted_price = db.Column(db.Float, nullable=False)
    actual_price = db.Column(db.Float)
    prediction_date = db.Column(db.DateTime, default=datetime.utcnow)
    model_used = db.Column(db.String(50), nullable=False)
    confidence_score = db.Column(db.Float)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Initialize ML models
stock_predictor = StockPredictor()
lstm_model = LSTMModel()
linear_model = LinearRegressionModel()
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
    
    # Save to CSV files
    pd.DataFrame(tcs_data).to_csv('data/tcs_data.csv', index=False)
    pd.DataFrame(wipro_data).to_csv('data/wipro_data.csv', index=False)
    pd.DataFrame(infosys_data).to_csv('data/infosys_data.csv', index=False)

# Routes
@app.route('/')
def home():
    return jsonify({'message': 'Stock Market Prediction API'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(username=data['username'], email=data['email'], password_hash=hashed_password)
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
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

@app.route('/api/predict', methods=['POST'])
@login_required
def predict():
    data = request.get_json()
    stock_symbol = data['stock_symbol']
    model_type = data.get('model_type', 'lstm')
    
    try:
        # Load historical data
        csv_file = f'data/{stock_symbol.lower()}_data.csv'
        if not os.path.exists(csv_file):
            return jsonify({'error': 'Stock data not found'}), 404
        
        df = pd.read_csv(csv_file)
        
        # Make prediction
        if model_type == 'lstm':
            prediction = lstm_model.predict(df)
        else:
            prediction = linear_model.predict(df)
        
        # Save prediction to database
        pred = Prediction(
            user_id=current_user.id,
            stock_symbol=stock_symbol,
            predicted_price=prediction['predicted_price'],
            model_used=model_type,
            confidence_score=prediction.get('confidence', 0.8)
        )
        db.session.add(pred)
        db.session.commit()
        
        return jsonify({
            'prediction': prediction,
            'stock_symbol': stock_symbol,
            'model_used': model_type
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history')
@login_required
def get_history():
    predictions = Prediction.query.filter_by(user_id=current_user.id).order_by(Prediction.prediction_date.desc()).all()
    
    history = []
    for pred in predictions:
        history.append({
            'id': pred.id,
            'stock_symbol': pred.stock_symbol,
            'predicted_price': pred.predicted_price,
            'actual_price': pred.actual_price,
            'prediction_date': pred.prediction_date.isoformat(),
            'model_used': pred.model_used,
            'confidence_score': pred.confidence_score
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
        csv_file = f'data/{stock_symbol.lower()}_data.csv'
        if not os.path.exists(csv_file):
            return jsonify({'error': 'Stock data not found'}), 404
        
        df = pd.read_csv(csv_file)
        
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
    
    users = User.query.all()
    user_list = []
    for user in users:
        user_list.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_admin,
            'created_at': user.created_at.isoformat(),
            'prediction_count': len(user.predictions)
        })
    
    return jsonify({'users': user_list})

@app.route('/api/admin/predictions')
@login_required
def get_all_predictions():
    if not current_user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    predictions = Prediction.query.order_by(Prediction.prediction_date.desc()).all()
    
    pred_list = []
    for pred in predictions:
        pred_list.append({
            'id': pred.id,
            'user_id': pred.user_id,
            'username': pred.user.username,
            'stock_symbol': pred.stock_symbol,
            'predicted_price': pred.predicted_price,
            'actual_price': pred.actual_price,
            'prediction_date': pred.prediction_date.isoformat(),
            'model_used': pred.model_used,
            'confidence_score': pred.confidence_score
        })
    
    return jsonify({'predictions': pred_list})

@app.route('/api/stats')
def get_stats():
    total_users = User.query.count()
    total_predictions = Prediction.query.count()
    
    # Calculate average prediction accuracy
    predictions_with_actual = Prediction.query.filter(Prediction.actual_price.isnot(None)).all()
    if predictions_with_actual:
        accuracy = np.mean([abs(p.predicted_price - p.actual_price) / p.actual_price for p in predictions_with_actual])
    else:
        accuracy = 0
    
    return jsonify({
        'total_users': total_users,
        'total_predictions': total_predictions,
        'average_accuracy': accuracy
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create admin user if not exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            hashed_password = bcrypt.generate_password_hash('admin123').decode('utf-8')
            admin = User(username='admin', email='admin@stockprediction.com', 
                        password_hash=hashed_password, is_admin=True)
            db.session.add(admin)
            db.session.commit()
        
        # Create sample data if not exists
        if not os.path.exists('data/tcs_data.csv'):
            create_sample_data()
    
    app.run(debug=True, host='0.0.0.0', port=5000)