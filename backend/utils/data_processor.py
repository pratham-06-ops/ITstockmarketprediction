import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

class DataProcessor:
    def __init__(self):
        self.data_path = 'data/'
        
    def load_stock_data(self, stock_symbol):
        """Load stock data from CSV file"""
        try:
            file_path = f"{self.data_path}{stock_symbol.lower()}_data.csv"
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Data file for {stock_symbol} not found")
            
            df = pd.read_csv(file_path)
            df['Date'] = pd.to_datetime(df['Date'])
            df = df.sort_values('Date')
            
            return df
        except Exception as e:
            raise Exception(f"Error loading data for {stock_symbol}: {str(e)}")
    
    def preprocess_data(self, df):
        """Preprocess stock data"""
        # Remove any missing values
        df = df.dropna()
        
        # Ensure date column is datetime
        df['Date'] = pd.to_datetime(df['Date'])
        
        # Sort by date
        df = df.sort_values('Date')
        
        # Add technical indicators
        df = self.add_technical_indicators(df)
        
        return df
    
    def add_technical_indicators(self, df):
        """Add technical indicators to the dataframe"""
        # Moving averages
        df['MA_5'] = df['Close'].rolling(window=5).mean()
        df['MA_10'] = df['Close'].rolling(window=10).mean()
        df['MA_20'] = df['Close'].rolling(window=20).mean()
        df['MA_50'] = df['Close'].rolling(window=50).mean()
        
        # Price changes
        df['Price_Change'] = df['Close'].pct_change()
        df['Price_Change_5'] = df['Close'].pct_change(periods=5)
        
        # Volatility
        df['Volatility'] = df['Close'].rolling(window=20).std()
        
        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        # Bollinger Bands
        bb_20 = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = bb_20 + (bb_std * 2)
        df['BB_Lower'] = bb_20 - (bb_std * 2)
        
        # MACD
        exp1 = df['Close'].ewm(span=12).mean()
        exp2 = df['Close'].ewm(span=26).mean()
        df['MACD'] = exp1 - exp2
        df['Signal'] = df['MACD'].ewm(span=9).mean()
        
        # Volume indicators
        df['Volume_MA'] = df['Volume'].rolling(window=20).mean()
        df['Volume_Ratio'] = df['Volume'] / df['Volume_MA']
        
        return df
    
    def get_recent_data(self, df, days=30):
        """Get recent data for analysis"""
        return df.tail(days)
    
    def calculate_statistics(self, df):
        """Calculate basic statistics for the stock data"""
        stats = {
            'total_days': len(df),
            'current_price': df['Close'].iloc[-1],
            'highest_price': df['High'].max(),
            'lowest_price': df['Low'].min(),
            'average_price': df['Close'].mean(),
            'price_volatility': df['Close'].std(),
            'total_volume': df['Volume'].sum(),
            'average_volume': df['Volume'].mean(),
            'price_change_1d': df['Close'].pct_change().iloc[-1],
            'price_change_1w': df['Close'].pct_change(periods=7).iloc[-1],
            'price_change_1m': df['Close'].pct_change(periods=30).iloc[-1]
        }
        
        return stats
    
    def get_prediction_data(self, df, lookback_days=60):
        """Get data formatted for prediction models"""
        recent_data = df.tail(lookback_days)
        
        # Ensure we have enough data
        if len(recent_data) < lookback_days:
            raise ValueError(f"Insufficient data. Need at least {lookback_days} days, got {len(recent_data)}")
        
        return recent_data
    
    def validate_data(self, df):
        """Validate stock data for completeness and quality"""
        # Check for required columns
        required_columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Check for missing values
        missing_values = df[required_columns].isnull().sum()
        if missing_values.sum() > 0:
            print(f"Warning: Found missing values: {missing_values.to_dict()}")
        
        # Check for negative prices
        price_columns = ['Open', 'High', 'Low', 'Close']
        negative_prices = df[price_columns].lt(0).any().any()
        if negative_prices:
            raise ValueError("Found negative prices in data")
        
        # Check for logical inconsistencies
        logical_errors = (
            (df['High'] < df['Low']) |
            (df['Open'] > df['High']) |
            (df['Close'] > df['High']) |
            (df['Open'] < df['Low']) |
            (df['Close'] < df['Low'])
        )
        
        if logical_errors.any():
            print(f"Warning: Found {logical_errors.sum()} logical inconsistencies in price data")
        
        return True
    
    def create_sample_data(self, stock_symbol, start_date='2020-01-01', end_date='2023-12-31'):
        """Create sample data for demonstration purposes"""
        dates = pd.date_range(start=start_date, end=end_date, freq='D')
        
        # Generate realistic stock data based on symbol
        if stock_symbol.upper() == 'TCS':
            base_price = 3000
            volatility = 200
        elif stock_symbol.upper() == 'WIPRO':
            base_price = 400
            volatility = 50
        elif stock_symbol.upper() == 'INFOSYS':
            base_price = 1500
            volatility = 150
        else:
            base_price = 1000
            volatility = 100
        
        # Generate price data with some trend and seasonality
        np.random.seed(42)  # For reproducible results
        
        # Add trend and seasonality
        trend = np.linspace(0, 0.5, len(dates))
        seasonality = 0.1 * np.sin(2 * np.pi * np.arange(len(dates)) / 252)  # Annual cycle
        
        # Generate prices
        base_prices = base_price * (1 + trend + seasonality)
        prices = base_prices + np.random.normal(0, volatility, len(dates))
        
        # Ensure prices are positive
        prices = np.maximum(prices, base_price * 0.5)
        
        # Create OHLC data
        data = {
            'Date': dates,
            'Open': prices + np.random.normal(0, volatility * 0.1, len(dates)),
            'High': prices + np.abs(np.random.normal(0, volatility * 0.2, len(dates))),
            'Low': prices - np.abs(np.random.normal(0, volatility * 0.2, len(dates))),
            'Close': prices + np.random.normal(0, volatility * 0.1, len(dates)),
            'Volume': np.random.randint(100000, 5000000, len(dates))
        }
        
        # Ensure High >= Low and other logical constraints
        for i in range(len(dates)):
            data['High'][i] = max(data['Open'][i], data['Close'][i], data['High'][i])
            data['Low'][i] = min(data['Open'][i], data['Close'][i], data['Low'][i])
        
        df = pd.DataFrame(data)
        
        # Save to CSV
        file_path = f"{self.data_path}{stock_symbol.lower()}_data.csv"
        df.to_csv(file_path, index=False)
        
        return df