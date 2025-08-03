import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
import warnings
warnings.filterwarnings('ignore')

class LSTMModel:
    def __init__(self):
        self.scaler = MinMaxScaler()
        self.model = None
        self.is_trained = False
        self.lookback = 60
        
    def prepare_data(self, df):
        """Prepare data for LSTM model"""
        # Use only closing prices for prediction
        data = df['Close'].values.reshape(-1, 1)
        
        # Scale the data
        scaled_data = self.scaler.fit_transform(data)
        
        # Create sequences for LSTM
        X, y = [], []
        for i in range(self.lookback, len(scaled_data)):
            X.append(scaled_data[i-self.lookback:i, 0])
            y.append(scaled_data[i, 0])
        
        X, y = np.array(X), np.array(y)
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))
        
        return X, y
    
    def build_model(self):
        """Build LSTM model architecture"""
        model = Sequential([
            LSTM(units=100, return_sequences=True, input_shape=(self.lookback, 1)),
            Dropout(0.2),
            LSTM(units=100, return_sequences=True),
            Dropout(0.2),
            LSTM(units=100),
            Dropout(0.2),
            Dense(units=1)
        ])
        
        model.compile(optimizer='adam', loss='mean_squared_error')
        return model
    
    def train(self, df, epochs=50, batch_size=32):
        """Train the LSTM model"""
        X, y = self.prepare_data(df)
        
        # Split data
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        # Build and train model
        self.model = self.build_model()
        history = self.model.fit(X_train, y_train, epochs=epochs, batch_size=batch_size, 
                               validation_data=(X_test, y_test), verbose=0)
        
        # Evaluate model
        y_pred = self.model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        
        self.is_trained = True
        return {'mse': mse, 'rmse': rmse, 'history': history.history}
    
    def predict(self, df):
        """Predict the next day's stock price"""
        if not self.is_trained:
            self.train(df)
        
        # Prepare recent data
        data = df['Close'].values.reshape(-1, 1)
        scaled_data = self.scaler.transform(data)
        
        # Get the last lookback days for prediction
        X = scaled_data[-self.lookback:].reshape(1, self.lookback, 1)
        
        # Make prediction
        pred_scaled = self.model.predict(X)
        prediction = self.scaler.inverse_transform(pred_scaled)[0][0]
        
        # Calculate confidence based on recent volatility
        recent_prices = df['Close'].tail(30).values
        volatility = np.std(recent_prices) / np.mean(recent_prices)
        confidence = max(0.5, 1 - volatility)
        
        # Calculate technical indicators
        technical_indicators = self.get_technical_indicators(df)
        
        return {
            'predicted_price': round(prediction, 2),
            'confidence': round(confidence, 3),
            'current_price': round(df['Close'].iloc[-1], 2),
            'prediction_date': pd.Timestamp.now().strftime('%Y-%m-%d'),
            'technical_indicators': technical_indicators,
            'model_type': 'LSTM'
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
            'rsi': round(rsi.iloc[-1], 2),
            'ma_20': round(ma_20.iloc[-1], 2),
            'ma_50': round(ma_50.iloc[-1], 2),
            'bb_upper': round(bb_upper.iloc[-1], 2),
            'bb_lower': round(bb_lower.iloc[-1], 2),
            'macd': round(macd.iloc[-1], 2),
            'signal': round(signal.iloc[-1], 2),
            'current_price': round(df['Close'].iloc[-1], 2)
        }