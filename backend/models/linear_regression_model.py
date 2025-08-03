import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import warnings
warnings.filterwarnings('ignore')

class LinearRegressionModel:
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def prepare_features(self, df):
        """Prepare features for linear regression"""
        # Create technical indicators as features
        df_features = df.copy()
        
        # Moving averages
        df_features['MA_5'] = df['Close'].rolling(window=5).mean()
        df_features['MA_10'] = df['Close'].rolling(window=10).mean()
        df_features['MA_20'] = df['Close'].rolling(window=20).mean()
        
        # Price changes
        df_features['Price_Change'] = df['Close'].pct_change()
        df_features['Price_Change_5'] = df['Close'].pct_change(periods=5)
        
        # Volatility
        df_features['Volatility'] = df['Close'].rolling(window=20).std()
        
        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df_features['RSI'] = 100 - (100 / (1 + rs))
        
        # Volume features
        df_features['Volume_MA'] = df['Volume'].rolling(window=20).mean()
        df_features['Volume_Ratio'] = df['Volume'] / df_features['Volume_MA']
        
        # High-Low ratio
        df_features['HL_Ratio'] = df['High'] / df['Low']
        
        # Remove NaN values
        df_features = df_features.dropna()
        
        # Select features for prediction
        feature_columns = ['Open', 'High', 'Low', 'Volume', 'MA_5', 'MA_10', 'MA_20', 
                         'Price_Change', 'Price_Change_5', 'Volatility', 'RSI', 
                         'Volume_MA', 'Volume_Ratio', 'HL_Ratio']
        
        X = df_features[feature_columns]
        y = df_features['Close']
        
        return X, y
    
    def train(self, df):
        """Train the linear regression model"""
        X, y = self.prepare_features(df)
        
        # Split data
        train_size = int(len(X) * 0.8)
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_test, y_pred)
        
        self.is_trained = True
        return {'mse': mse, 'rmse': rmse, 'r2': r2}
    
    def predict(self, df):
        """Predict the next day's stock price"""
        if not self.is_trained:
            self.train(df)
        
        # Prepare features for prediction
        X, y = self.prepare_features(df)
        
        # Get the latest features
        latest_features = X.iloc[-1:].values
        latest_features_scaled = self.scaler.transform(latest_features)
        
        # Make prediction
        prediction = self.model.predict(latest_features_scaled)[0]
        
        # Calculate confidence based on R² score and recent volatility
        recent_prices = df['Close'].tail(30).values
        volatility = np.std(recent_prices) / np.mean(recent_prices)
        
        # Get model performance metrics
        X_full, y_full = self.prepare_features(df)
        X_full_scaled = self.scaler.transform(X_full)
        y_pred_full = self.model.predict(X_full_scaled)
        r2 = r2_score(y_full, y_pred_full)
        
        confidence = max(0.5, min(0.95, r2 * (1 - volatility)))
        
        # Calculate technical indicators
        technical_indicators = self.get_technical_indicators(df)
        
        return {
            'predicted_price': round(prediction, 2),
            'confidence': round(confidence, 3),
            'current_price': round(df['Close'].iloc[-1], 2),
            'prediction_date': pd.Timestamp.now().strftime('%Y-%m-%d'),
            'technical_indicators': technical_indicators,
            'model_type': 'Linear Regression',
            'r2_score': round(r2, 3)
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