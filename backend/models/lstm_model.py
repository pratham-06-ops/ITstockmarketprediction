import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping
import warnings
warnings.filterwarnings('ignore')

class LSTMModel:
    def __init__(self):
        self.scaler = MinMaxScaler()
        self.model = None
        self.is_trained = False
        self.lookback = 60
        self.trained_lookback = None
        
    def prepare_data(self, df, lookback=None):
        """Prepare data for LSTM model"""
        # Use only closing prices for prediction
        data = df['Close'].values.reshape(-1, 1)
        
        # Scale the data
        scaled_data = self.scaler.fit_transform(data)
        
        # Create sequences for LSTM
        X, y = [], []
        lb = self.lookback if lookback is None else lookback
        if len(scaled_data) <= lb:
            raise ValueError(f"Insufficient data for lookback={lb}. Have {len(scaled_data)} points.")
        for i in range(lb, len(scaled_data)):
            X.append(scaled_data[i-lb:i, 0])
            y.append(scaled_data[i, 0])
        
        X, y = np.array(X), np.array(y)
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))
        
        return X, y
    
    def build_model(self, lookback=None):
        """Build LSTM model architecture"""
        lb = self.lookback if lookback is None else lookback
        # Simpler, faster network to avoid timeouts on first train
        model = Sequential([
            LSTM(units=64, return_sequences=True, input_shape=(lb, 1)),
            Dropout(0.2),
            LSTM(units=32),
            Dropout(0.2),
            Dense(units=1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        return model
    
    def train(self, df, epochs=10, batch_size=32):
        """Train the LSTM model"""
        effective_len = len(df['Close'].dropna())
        effective_lookback = max(5, min(self.lookback, effective_len - 1))
        X, y = self.prepare_data(df, lookback=effective_lookback)
        
        # Split data
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        # Build and train model
        self.model = self.build_model(lookback=effective_lookback)
        early_stop = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True)
        history = self.model.fit(
            X_train,
            y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_data=(X_test, y_test),
            callbacks=[early_stop],
            verbose=0
        )
        
        # Evaluate model
        y_pred = self.model.predict(X_test, verbose=0)
        mse = mean_squared_error(y_test, y_pred.reshape(-1))
        rmse = np.sqrt(mse)
        
        self.is_trained = True
        self.trained_lookback = effective_lookback
        return {'mse': mse, 'rmse': rmse, 'history': history.history}
    
    def predict(self, df, days_ahead=1):
        """Predict stock prices for specified number of days ahead"""
        if not self.is_trained:
            self.train(df)
        
        if days_ahead == 1:
            return self._predict_single_day(df)
        else:
            return self._predict_multiple_days(df, days_ahead)
    
    def _predict_single_day(self, df):
        """Predict the next day's stock price"""
        # Prepare recent data
        data = df['Close'].values.reshape(-1, 1)
        scaled_data = self.scaler.transform(data)
        
        # Get the last lookback days for prediction
        lb = self.trained_lookback if self.trained_lookback else self.lookback
        if len(scaled_data) < lb:
            raise ValueError(f"Insufficient data for prediction with lookback={lb}. Have {len(scaled_data)} points.")
        X = scaled_data[-lb:].reshape(1, lb, 1)
        
        # Make prediction
        pred_scaled = self.model.predict(X, verbose=0)
        prediction = self.scaler.inverse_transform(pred_scaled)[0][0]
        
        # Calculate confidence based on recent volatility
        recent_prices = df['Close'].tail(30).values
        volatility = np.std(recent_prices) / np.mean(recent_prices)
        confidence = max(0.5, 1 - volatility)
        
        # Calculate technical indicators
        technical_indicators = self.get_technical_indicators(df)
        
        return {
            'predicted_price': float(round(prediction, 2)),
            'confidence': float(round(confidence, 3)),
            'current_price': float(round(df['Close'].iloc[-1], 2)),
            'prediction_date': pd.Timestamp.now().strftime('%Y-%m-%d'),
            'technical_indicators': technical_indicators,
            'model_type': 'LSTM',
            'days_ahead': 1
        }
    
    def _predict_multiple_days(self, df, days_ahead):
        """Predict stock prices for multiple days ahead (up to 1 week)"""
        # Prepare recent data
        data = df['Close'].values.reshape(-1, 1)
        scaled_data = self.scaler.transform(data)
        
        # Get the last lookback days for prediction
        lb = self.trained_lookback if self.trained_lookback else self.lookback
        if len(scaled_data) < lb:
            raise ValueError(f"Insufficient data for prediction with lookback={lb}. Have {len(scaled_data)} points.")
        
        # Initialize predictions array
        predictions = []
        current_input = scaled_data[-lb:].reshape(1, lb, 1)
        
        # Make predictions for each day
        for day in range(1, days_ahead + 1):
            # Predict next day
            pred_scaled = self.model.predict(current_input, verbose=0)
            pred_price = self.scaler.inverse_transform(pred_scaled)[0][0]
            
            # Add to predictions
            predictions.append({
                'day': day,
                'predicted_price': float(round(pred_price, 2)),
                'date': (pd.Timestamp.now() + pd.Timedelta(days=day)).strftime('%Y-%m-%d')
            })
            
            # Update input for next prediction (shift window and add new prediction)
            current_input = np.roll(current_input, -1, axis=1)
            current_input[0, -1, 0] = pred_scaled[0, 0]
        
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
        
        # Calculate technical indicators
        technical_indicators = self.get_technical_indicators(df)
        
        return {
            'predictions': predictions,
            'confidence': float(round(confidence, 3)),
            'current_price': float(round(df['Close'].iloc[-1], 2)),
            'prediction_date': pd.Timestamp.now().strftime('%Y-%m-%d'),
            'technical_indicators': technical_indicators,
            'model_type': 'LSTM',
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
        
        # MACD
        exp1 = df['Close'].ewm(span=12).mean()
        exp2 = df['Close'].ewm(span=26).mean()
        macd = exp1 - exp2
        signal = macd.ewm(span=9).mean()
        
        return {
            'rsi': float(round(rsi.iloc[-1], 2)),
            'ma_20': float(round(ma_20.iloc[-1], 2)),
            'ma_50': float(round(ma_50.iloc[-1], 2)),
            'bb_upper': float(round(bb_upper.iloc[-1], 2)),
            'bb_lower': float(round(bb_lower.iloc[-1], 2)),
            'macd': float(round(macd.iloc[-1], 2)),
            'signal': float(round(signal.iloc[-1], 2)),
            'current_price': float(round(df['Close'].iloc[-1], 2))
        }
