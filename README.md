# Stock Market Prediction Application

A comprehensive stock market prediction web application with React.js frontend and Flask backend, featuring machine learning models for stock price prediction.

## 🚀 Features

### Frontend (React.js)
- **Public Pages**: Home, About Us, User/Admin Login
- **User Dashboard**: Prediction charts, history, password management
- **Admin Dashboard**: User management, result analysis, statistics
- **Interactive Charts**: Line charts, candlestick charts, pie charts
- **Responsive Design**: Modern, user-friendly interface

### Backend (Flask)
- **Machine Learning Models**: LSTM, Linear Regression
- **Data Processing**: CSV file handling for TCS, WIPRO, INFOSYS
- **API Endpoints**: RESTful APIs for predictions and data
- **Authentication**: User and admin authentication system

### Data Visualization
- **Prediction Charts**: Predicted vs actual prices
- **Candlestick Charts**: OHLC data visualization
- **Statistical Analysis**: RSI, daily returns, averages
- **Interactive Features**: Hover information, insights

## 📁 Project Structure
```
stock-prediction-app/
├── frontend/                 # React.js application
├── backend/                  # Flask API server
├── data/                     # CSV data files
└── docs/                     # Documentation
```

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- npm or yarn

### Quick Start
1. Clone the repository
2. Install and start MongoDB (see [MongoDB Setup Guide](backend/MONGODB_SETUP.md))
3. Install frontend dependencies: `cd frontend && npm install`
4. Install backend dependencies: `cd backend && pip install -r requirements.txt`
5. Setup MongoDB database: `cd backend && python setup_mongodb.py`
6. Start backend server: `python app.py`
7. Start frontend development server: `npm start`

## 📊 Data Sources
- TCS historical data
- WIPRO historical data  
- INFOSYS historical data

## 🤖 ML Models
- LSTM (Long Short-Term Memory)
- Linear Regression
- RMSE evaluation metrics

## 📈 Features
- Real-time stock predictions
- Historical data analysis
- User prediction history
- Admin user management
- Interactive data visualization
- Responsive design

## 🔧 Technologies Used
- **Frontend**: React.js, Chart.js, Axios
- **Backend**: Flask, Python, Pandas, Scikit-learn
- **ML**: TensorFlow/Keras, NumPy
- **Database**: MongoDB with PyMongo driver
- **Styling**: CSS3, Bootstrap