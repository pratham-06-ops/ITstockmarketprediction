# Multi-Day Stock Price Prediction Feature

## Overview

The stock market prediction system has been enhanced to support **time-based predictions** ranging from 1 day up to **1 week (7 days)**. This feature allows users to get more comprehensive insights into stock price movements over extended periods.

## 🚀 New Features

### 1. **Time Duration Selection**
- **1 Day**: Traditional single-day prediction
- **2-6 Days**: Multi-day predictions with daily breakdowns
- **1 Week (7 Days)**: Full week prediction with trend analysis

### 2. **Enhanced Prediction Models**
Both LSTM and models now support:
- **Sequential Prediction**: Each day's prediction builds upon the previous day
- **Confidence Decay**: Longer predictions have adjusted confidence scores
- **Trend Analysis**: Overall price movement direction (upward/downward/stable)
- **Price Range**: Minimum, maximum, and average predicted prices

### 3. **Improved User Interface**
- **Duration Selector**: Dropdown to choose prediction period
- **Dynamic Results**: Different display formats for single vs. multi-day predictions
- **Visual Indicators**: Trend arrows and color-coded confidence levels
- **Daily Breakdown**: Individual day predictions with dates and prices

## 🔧 Technical Implementation

### Backend Changes

#### 1. **LSTM Model Updates** (`backend/models/lstm_model.py`)
```python
def predict(self, df, days_ahead=1):
    """Predict stock prices for specified number of days ahead"""
    if days_ahead == 1:
        return self._predict_single_day(df)
    else:
        return self._predict_multiple_days(df, days_ahead)
```

**Key Features:**
- **Rolling Window**: Uses previous predictions as input for subsequent days
- **Sequential Training**: Maintains temporal relationships between predictions
- **Confidence Calculation**: Factors in prediction consistency and volatility

#### 2. **Model Updates** (`backend/models/linear_regression_model.py`)
```python
def predict(self, df, days_ahead=1):
    """Predict stock prices for specified number of days ahead"""
    if days_ahead == 1:
        return self._predict_single_day(df)
    else:
        return self._predict_multiple_days(df, days_ahead)
```

**Key Features:**
- **Feature Evolution**: Updates technical indicators for future predictions
- **Statistical Consistency**: Maintains model performance metrics
- **Deterministic Results**: Same input always produces same output

#### 3. **API Endpoint Enhancement** (`backend/app.py`)
```python
@app.route('/api/predict', methods=['POST'])
@login_required
def predict():
    days_ahead = data.get('days_ahead', 1)  # 1-7 days
    
    # Validate days_ahead parameter
    if not isinstance(days_ahead, int) or days_ahead < 1 or days_ahead > 7:
        return jsonify({'error': 'days_ahead must be an integer between 1 and 7'}), 400
```

**New Response Format:**
- **Single Day**: Traditional format with `predicted_price`
- **Multi-Day**: New format with `predictions` array and `summary` object

### Frontend Changes

#### 1. **API Service Updates** (`frontend/src/services/api.js`)
```javascript
predict: (stockSymbol, modelType = 'lstm', daysAhead = 1) => 
  api.post('/api/predict', { 
    stock_symbol: stockSymbol, 
    model_type: modelType, 
    days_ahead: daysAhead 
  }, { timeout: 60000 }),
```

#### 2. **UI Enhancements** (`frontend/src/pages/PredictionPage.js`)
- **Duration Selector**: Dropdown for 1-7 day predictions
- **Dynamic Results**: Conditional rendering based on prediction type
- **Enhanced Display**: Summary cards, trend indicators, and daily breakdowns

## 📊 Prediction Results Format

### Single Day Prediction (1 day)
```json
{
  "prediction": {
    "predicted_price": 3050.75,
    "confidence": 0.85,
    "current_price": 3040.50,
    "prediction_date": "2024-01-15",
    "technical_indicators": {...},
    "model_type": "LSTM",
    "days_ahead": 1
  }
}
```

### Multi-Day Prediction (2-7 days)
```json
{
  "prediction": {
    "predictions": [
      {
        "day": 1,
        "predicted_price": 3050.75,
        "date": "2024-01-16"
      },
      {
        "day": 2,
        "predicted_price": 3065.20,
        "date": "2024-01-17"
      }
    ],
    "confidence": 0.78,
    "current_price": 3040.50,
    "prediction_date": "2024-01-15",
    "technical_indicators": {...},
    "model_type": "LSTM",
    "days_ahead": 2,
    "summary": {
      "min_price": 3050.75,
      "max_price": 3065.20,
      "avg_price": 3057.98,
      "trend": "upward"
    }
  }
}
```

## 🎯 Confidence Scoring

### Time Decay Factor
- **1 Day**: Full confidence (100%)
- **2 Days**: 90% of base confidence
- **3 Days**: 80% of base confidence
- **...**
- **7 Days**: 40% of base confidence

### Confidence Calculation
```python
base_confidence = max(0.5, 1 - volatility)
time_decay = max(0.3, 1 - (days_ahead - 1) * 0.1)
consistency_factor = max(0.5, 1 - pred_volatility)

confidence = base_confidence * time_decay * consistency_factor
```

## 🧪 Testing

### Test Script
Run the comprehensive test suite:
```bash
cd backend
python test_multi_day_prediction.py
```

**Test Coverage:**
- ✅ 1-7 day predictions for both models
- ✅ Response format validation
- ✅ Confidence scoring accuracy
- ✅ Model consistency checks
- ✅ Error handling

### Manual Testing
1. **Frontend**: Select different durations and verify UI updates
2. **API**: Test with Postman/curl for various `days_ahead` values
3. **Models**: Verify prediction quality and consistency

## 🚀 Usage Instructions

### For Users
1. **Navigate** to the Prediction Page
2. **Select** your desired stock (TCS, WIPRO, INFOSYS)
3. **Choose** prediction duration (1 day to 1 week)
4. **Select** model type (LSTM or Linear Regression)
5. **Click** "Make Prediction"
6. **View** detailed results and charts

### For Developers
1. **API Calls**: Include `days_ahead` parameter (1-7)
2. **Response Handling**: Check for `predictions` array vs `predicted_price`
3. **Error Handling**: Validate `days_ahead` range
4. **Database**: Multi-day predictions save first day to history

## 🔮 Future Enhancements

### Planned Features
- **Weekly/Monthly Predictions**: Extend beyond 7 days
- **Seasonal Analysis**: Account for market cycles
- **Risk Assessment**: Probability distributions for predictions
- **Portfolio Optimization**: Multi-stock correlation analysis

### Technical Improvements
- **Model Ensembling**: Combine multiple prediction approaches
- **Real-time Updates**: Live market data integration
- **Performance Optimization**: Faster prediction generation
- **Advanced Analytics**: More sophisticated technical indicators

## 📝 Notes

### Model Limitations
- **LSTM**: May show slight variations due to neural network randomness
- **Linear Regression**: Deterministic but may be less accurate for longer periods
- **Confidence**: Decreases with prediction distance (realistic approach)

### Data Requirements
- **Minimum Data**: 80+ days of historical data required
- **Data Quality**: Clean, consistent OHLCV data needed
- **Frequency**: Daily data recommended for best results

## 🤝 Contributing

To contribute to this feature:
1. **Fork** the repository
2. **Create** feature branch
3. **Implement** improvements
4. **Test** thoroughly
5. **Submit** pull request

## 📞 Support

For questions or issues:
- **GitHub Issues**: Report bugs or feature requests
- **Documentation**: Check this README and code comments
- **Testing**: Run test scripts to verify functionality

---

**🎉 Multi-day prediction is now live!** Users can predict stock prices up to 1 week ahead with enhanced confidence scoring and trend analysis.
