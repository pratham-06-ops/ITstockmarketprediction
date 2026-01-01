import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import warnings
warnings.filterwarnings('ignore')

class StockPredictor:
    def __init__(self):
        self.scaler = MinMaxScaler()
        self.model = None
        self.is_trained = False
        
    def prepare_data(self, df, lookback=60):
        """Prepare data for LSTM model"""
        # Use only closing prices for prediction
        data = df['Close'].values.reshape(-1, 1)
        
        # Scale the data
        scaled_data = self.scaler.fit_transform(data)
        
        # Create sequences for LSTM
        X, y = [], []
        for i in range(lookback, len(scaled_data)):
            X.append(scaled_data[i-lookback:i, 0])
            y.append(scaled_data[i, 0])
        
        X, y = np.array(X), np.array(y)
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))
        
        return X, y
    
    def build_lstm_model(self, lookback=60):
        """Build LSTM model architecture"""
        model = Sequential([
            LSTM(units=50, return_sequences=True, input_shape=(lookback, 1)),
            Dropout(0.2),
            LSTM(units=50, return_sequences=True),
            Dropout(0.2),
            LSTM(units=50),
            Dropout(0.2),
            Dense(units=1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        return model
    
    def train_model(self, df, epochs=50, batch_size=32):
        """Train the LSTM model"""
        X, y = self.prepare_data(df)
        
        # Split data
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        # Build and train model
        self.model = self.build_lstm_model()
        self.model.fit(X_train, y_train, epochs=epochs, batch_size=batch_size, 
                      validation_data=(X_test, y_test), verbose=0)
        
        # Evaluate model
        y_pred = self.model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        
        self.is_trained = True
        return {'mse': mse, 'rmse': np.sqrt(mse)}
    
    def predict_next_day(self, df, days_ahead=1):
        """Predict stock prices for specified number of days ahead"""
        if days_ahead == 1:
            return self._predict_single_day(df)
        else:
            return self._predict_multiple_days(df, days_ahead)
    
    def _predict_single_day(self, df):
        """Predict the next day's stock price"""
        if not self.is_trained:
            self.train_model(df)
        
        # Prepare recent data
        data = df['Close'].values.reshape(-1, 1)
        scaled_data = self.scaler.transform(data)
        
        # Get the last 60 days for prediction
        X = scaled_data[-60:].reshape(1, 60, 1)
        
        # Make prediction
        pred_scaled = self.model.predict(X, verbose=0)
        prediction = self.scaler.inverse_transform(pred_scaled)[0][0]
        
        # Calculate confidence based on recent volatility
        recent_prices = df['Close'].tail(30).values
        volatility = np.std(recent_prices) / np.mean(recent_prices)
        confidence = max(0.5, 1 - volatility)
        
        return {
            'predicted_price': float(round(prediction, 2)),
            'confidence': float(round(confidence, 3)),
            'current_price': float(round(df['Close'].iloc[-1], 2)),
            'prediction_date': pd.Timestamp.now().strftime('%Y-%m-%d'),
            'days_ahead': 1
        }
    
    def _predict_multiple_days(self, df, days_ahead):
        """Predict stock prices for multiple days ahead (up to 1 week)"""
        if not self.is_trained:
            self.train_model(df)
        
        # Prepare recent data
        data = df['Close'].values.reshape(-1, 1)
        scaled_data = self.scaler.transform(data)
        
        # Get the last 60 days for prediction
        X = scaled_data[-60:].reshape(1, 60, 1)
        
        # Initialize predictions array
        predictions = []
        current_input = X.copy()
        
        # Make predictions for each day
        for day in range(1, days_ahead + 1):
            # Predict next day
            pred_scaled = self.model.predict(current_input, verbose=0)
            pred_price = self.scaler.inverse_transform(pred_scaled)[0][0]
            
            # Add to predictions
            predictions.append({
                'day': day,
                'predicted_price': round(pred_price, 2),
                'date': (pd.Timestamp.now() + pd.Timedelta(days=day)).strftime('%Y-%m-%d')
            })
            
            # Update input for next prediction (shift window and add new prediction)
            current_input = np.roll(current_input, -1, axis=2)
            current_input[0, 0, -1] = pred_scaled[0, 0]
        
        # Calculate confidence based on recent volatility and prediction consistency
        recent_prices = df['Close'].tail(30).values
        volatility = np.std(recent_prices) / np.mean(recent_prices)
        
        # Check prediction consistency (how much predictions vary)
        pred_prices = [p['predicted_price'] for p in predictions]
        pred_volatility = np.std(pred_prices) / np.mean(pred_prices) if len(pred_prices) > 1 else 0
        
        # Lower confidence for longer predictions and higher volatility
        base_confidence = max(0.5, 1 - volatility)
        time_decay = max(0.3, 1 - (days_ahead - 1) * 0.1)  # Decay confidence over time
        consistency_factor = max(0.5, 1 - pred_volatility)
        
        confidence = base_confidence * time_decay * consistency_factor
        
        return {
            'predictions': predictions,
            'confidence': float(round(confidence, 3)),
            'current_price': float(round(df['Close'].iloc[-1], 2)),
            'prediction_date': pd.Timestamp.now().strftime('%Y-%m-%d'),
            'days_ahead': days_ahead,
            'summary': {
                'min_price': float(min(pred_prices)),
                'max_price': float(max(pred_prices)),
                'avg_price': float(round(np.mean(pred_prices), 2)),
                'trend': 'upward' if pred_prices[-1] > pred_prices[0] else 'downward' if pred_prices[-1] < pred_prices[0] else 'stable'
            }
        }
    
    def get_technical_indicators(self, df):
        """Calculate technical indicators"""
        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        # Moving averages
        ma_20 = df['Close'].rolling(window=20).mean()
        ma_50 = df['Close'].rolling(window=50).mean()
        
        # Bollinger Bands
        bb_20 = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        bb_upper = bb_20 + (bb_std * 2)
        bb_lower = bb_20 - (bb_std * 2)
        
        return {
            'rsi': float(rsi.iloc[-1]),
            'ma_20': float(ma_20.iloc[-1]),
            'ma_50': float(ma_50.iloc[-1]),
            'bb_upper': float(bb_upper.iloc[-1]),
            'bb_lower': float(bb_lower.iloc[-1]),
            'current_price': float(df['Close'].iloc[-1])
        }
