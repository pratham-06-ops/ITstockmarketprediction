import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json

class ChartGenerator:
    def __init__(self):
        self.colors = {
            'primary': '#1f77b4',
            'secondary': '#ff7f0e',
            'success': '#2ca02c',
            'danger': '#d62728',
            'warning': '#ff7f0e',
            'info': '#17a2b8'
        }
    
    def create_line_chart(self, df, stock_symbol):
        """Create a line chart showing price trends"""
        fig = go.Figure()
        
        # Add closing price line
        fig.add_trace(go.Scatter(
            x=df['Date'],
            y=df['Close'],
            mode='lines',
            name='Close Price',
            line=dict(color=self.colors['primary'], width=2)
        ))
        
        # Add moving averages
        if 'MA_20' in df.columns:
            fig.add_trace(go.Scatter(
                x=df['Date'],
                y=df['MA_20'],
                mode='lines',
                name='20-Day MA',
                line=dict(color=self.colors['secondary'], width=1, dash='dash')
            ))
        
        if 'MA_50' in df.columns:
            fig.add_trace(go.Scatter(
                x=df['Date'],
                y=df['MA_50'],
                mode='lines',
                name='50-Day MA',
                line=dict(color=self.colors['warning'], width=1, dash='dash')
            ))
        
        # Update layout
        fig.update_layout(
            title=f'{stock_symbol} Stock Price Trend',
            xaxis_title='Date',
            yaxis_title='Price (₹)',
            hovermode='x unified',
            template='plotly_white',
            height=500
        )
        
        return json.loads(fig.to_json())
    
    def create_candlestick_chart(self, df, stock_symbol):
        """Create a candlestick chart for OHLC data"""
        fig = go.Figure(data=[go.Candlestick(
            x=df['Date'],
            open=df['Open'],
            high=df['High'],
            low=df['Low'],
            close=df['Close'],
            name='OHLC'
        )])
        
        # Add volume bars
        fig.add_trace(go.Bar(
            x=df['Date'],
            y=df['Volume'],
            name='Volume',
            yaxis='y2',
            opacity=0.3,
            marker_color=self.colors['info']
        ))
        
        # Update layout
        fig.update_layout(
            title=f'{stock_symbol} Candlestick Chart with Volume',
            xaxis_title='Date',
            yaxis_title='Price (₹)',
            yaxis2=dict(
                title='Volume',
                overlaying='y',
                side='right'
            ),
            hovermode='x unified',
            template='plotly_white',
            height=600
        )
        
        return json.loads(fig.to_json())
    
    def create_pie_chart(self, df, stock_symbol):
        """Create a pie chart showing price distribution"""
        # Create price ranges
        price_ranges = pd.cut(df['Close'], bins=10, labels=False)
        range_counts = price_ranges.value_counts().sort_index()
        
        fig = go.Figure(data=[go.Pie(
            labels=[f'Range {i+1}' for i in range_counts.index],
            values=range_counts.values,
            hole=0.3,
            marker_colors=px.colors.qualitative.Set3
        )])
        
        fig.update_layout(
            title=f'{stock_symbol} Price Distribution',
            template='plotly_white',
            height=400
        )
        
        return json.loads(fig.to_json())
    
    def create_technical_indicators_chart(self, df, stock_symbol):
        """Create a chart with technical indicators"""
        fig = make_subplots(
            rows=3, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.05,
            subplot_titles=('Price & Bollinger Bands', 'RSI', 'MACD'),
            row_heights=[0.5, 0.25, 0.25]
        )
        
        # Price and Bollinger Bands
        fig.add_trace(go.Scatter(
            x=df['Date'],
            y=df['Close'],
            mode='lines',
            name='Close Price',
            line=dict(color=self.colors['primary'])
        ), row=1, col=1)
        
        if 'BB_Upper' in df.columns and 'BB_Lower' in df.columns:
            fig.add_trace(go.Scatter(
                x=df['Date'],
                y=df['BB_Upper'],
                mode='lines',
                name='BB Upper',
                line=dict(color=self.colors['danger'], dash='dash')
            ), row=1, col=1)
            
            fig.add_trace(go.Scatter(
                x=df['Date'],
                y=df['BB_Lower'],
                mode='lines',
                name='BB Lower',
                line=dict(color=self.colors['danger'], dash='dash'),
                fill='tonexty'
            ), row=1, col=1)
        
        # RSI
        if 'RSI' in df.columns:
            fig.add_trace(go.Scatter(
                x=df['Date'],
                y=df['RSI'],
                mode='lines',
                name='RSI',
                line=dict(color=self.colors['secondary'])
            ), row=2, col=1)
            
            # Add RSI overbought/oversold lines
            fig.add_hline(y=70, line_dash="dash", line_color="red", row=2, col=1)
            fig.add_hline(y=30, line_dash="dash", line_color="green", row=2, col=1)
        
        # MACD
        if 'MACD' in df.columns and 'Signal' in df.columns:
            fig.add_trace(go.Scatter(
                x=df['Date'],
                y=df['MACD'],
                mode='lines',
                name='MACD',
                line=dict(color=self.colors['warning'])
            ), row=3, col=1)
            
            fig.add_trace(go.Scatter(
                x=df['Date'],
                y=df['Signal'],
                mode='lines',
                name='Signal',
                line=dict(color=self.colors['info'])
            ), row=3, col=1)
        
        fig.update_layout(
            title=f'{stock_symbol} Technical Analysis',
            height=800,
            template='plotly_white',
            showlegend=True
        )
        
        return json.loads(fig.to_json())
    
    def create_prediction_chart(self, df, prediction_data, stock_symbol):
        """Create a chart showing actual vs predicted prices"""
        fig = go.Figure()
        
        # Add actual prices
        fig.add_trace(go.Scatter(
            x=df['Date'],
            y=df['Close'],
            mode='lines',
            name='Actual Price',
            line=dict(color=self.colors['primary'], width=2)
        ))
        
        # Add predicted price point
        if prediction_data:
            pred_date = pd.Timestamp.now() + pd.Timedelta(days=1)
            fig.add_trace(go.Scatter(
                x=[pred_date],
                y=[prediction_data['predicted_price']],
                mode='markers',
                name='Predicted Price',
                marker=dict(color=self.colors['success'], size=10, symbol='diamond')
            ))
        
        fig.update_layout(
            title=f'{stock_symbol} Price Prediction',
            xaxis_title='Date',
            yaxis_title='Price (₹)',
            hovermode='x unified',
            template='plotly_white',
            height=500
        )
        
        return json.loads(fig.to_json())
    
    def create_volume_chart(self, df, stock_symbol):
        """Create a volume analysis chart"""
        fig = make_subplots(
            rows=2, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.05,
            subplot_titles=('Price', 'Volume'),
            row_heights=[0.7, 0.3]
        )
        
        # Price
        fig.add_trace(go.Scatter(
            x=df['Date'],
            y=df['Close'],
            mode='lines',
            name='Close Price',
            line=dict(color=self.colors['primary'])
        ), row=1, col=1)
        
        # Volume
        colors = ['red' if close < open else 'green' 
                 for close, open in zip(df['Close'], df['Open'])]
        
        fig.add_trace(go.Bar(
            x=df['Date'],
            y=df['Volume'],
            name='Volume',
            marker_color=colors,
            opacity=0.7
        ), row=2, col=1)
        
        fig.update_layout(
            title=f'{stock_symbol} Volume Analysis',
            height=600,
            template='plotly_white',
            showlegend=False
        )
        
        return json.loads(fig.to_json())
    
    def create_statistics_dashboard(self, df, stock_symbol):
        """Create a comprehensive statistics dashboard"""
        # Calculate statistics
        stats = {
            'current_price': df['Close'].iloc[-1],
            'price_change_1d': df['Close'].pct_change().iloc[-1] * 100,
            'price_change_1w': df['Close'].pct_change(periods=7).iloc[-1] * 100,
            'price_change_1m': df['Close'].pct_change(periods=30).iloc[-1] * 100,
            'highest_price': df['High'].max(),
            'lowest_price': df['Low'].min(),
            'average_volume': df['Volume'].mean(),
            'volatility': df['Close'].std()
        }
        
        # Create gauge charts for key metrics
        fig = make_subplots(
            rows=2, cols=2,
            specs=[[{"type": "indicator"}, {"type": "indicator"}],
                   [{"type": "indicator"}, {"type": "indicator"}]],
            subplot_titles=('Price Change (1D)', 'Price Change (1W)', 
                          'Price Change (1M)', 'Volatility')
        )
        
        # 1-day change
        fig.add_trace(go.Indicator(
            mode="gauge+number+delta",
            value=stats['price_change_1d'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "1-Day Change (%)"},
            delta={'reference': 0},
            gauge={'axis': {'range': [-10, 10]},
                   'bar': {'color': "darkblue"},
                   'steps': [{'range': [-10, 0], 'color': "lightgray"},
                            {'range': [0, 10], 'color': "gray"}]}
        ), row=1, col=1)
        
        # 1-week change
        fig.add_trace(go.Indicator(
            mode="gauge+number+delta",
            value=stats['price_change_1w'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "1-Week Change (%)"},
            delta={'reference': 0},
            gauge={'axis': {'range': [-20, 20]},
                   'bar': {'color': "darkblue"},
                   'steps': [{'range': [-20, 0], 'color': "lightgray"},
                            {'range': [0, 20], 'color': "gray"}]}
        ), row=1, col=2)
        
        # 1-month change
        fig.add_trace(go.Indicator(
            mode="gauge+number+delta",
            value=stats['price_change_1m'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "1-Month Change (%)"},
            delta={'reference': 0},
            gauge={'axis': {'range': [-30, 30]},
                   'bar': {'color': "darkblue"},
                   'steps': [{'range': [-30, 0], 'color': "lightgray"},
                            {'range': [0, 30], 'color': "gray"}]}
        ), row=2, col=1)
        
        # Volatility
        fig.add_trace(go.Indicator(
            mode="gauge+number",
            value=stats['volatility'],
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Volatility"},
            gauge={'axis': {'range': [0, stats['volatility'] * 2]},
                   'bar': {'color': "darkblue"},
                   'steps': [{'range': [0, stats['volatility']], 'color': "lightgray"}]}
        ), row=2, col=2)
        
        fig.update_layout(
            title=f'{stock_symbol} Statistics Dashboard',
            height=600,
            template='plotly_white'
        )
        
        return json.loads(fig.to_json())