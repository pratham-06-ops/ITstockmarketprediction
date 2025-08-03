import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaChartLine, 
  FaBrain, 
  FaChartBar, 
  FaUsers, 
  FaShieldAlt, 
  FaRocket,
  FaArrowRight
} from 'react-icons/fa';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <FaBrain />,
      title: 'Advanced ML Models',
      description: 'LSTM and Linear Regression models for accurate stock predictions'
    },
    {
      icon: <FaChartBar />,
      title: 'Interactive Charts',
      description: 'Candlestick charts, line charts, and technical indicators'
    },
    {
      icon: <FaUsers />,
      title: 'User Management',
      description: 'Secure user authentication and prediction history tracking'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Admin Panel',
      description: 'Comprehensive admin dashboard for user and result management'
    }
  ];

  const stocks = [
    { symbol: 'TCS', name: 'Tata Consultancy Services', color: '#667eea' },
    { symbol: 'WIPRO', name: 'Wipro Limited', color: '#764ba2' },
    { symbol: 'INFOSYS', name: 'Infosys Limited', color: '#f093fb' }
  ];

  return (
    <div className="container-fluid p-0">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Stock Market Prediction
                <br />
                <span className="text-warning">Powered by AI</span>
              </h1>
              <p className="lead mb-4">
                Advanced machine learning models to predict stock prices with high accuracy. 
                Get insights into TCS, WIPRO, and INFOSYS stocks using LSTM and Linear Regression algorithms.
              </p>
              <div className="d-flex gap-3">
                {!isAuthenticated ? (
                  <>
                    <Link to="/register" className="btn btn-warning btn-lg">
                      Get Started
                    </Link>
                    <Link to="/login" className="btn btn-outline-light btn-lg">
                      Login
                    </Link>
                  </>
                ) : (
                  <Link to="/prediction" className="btn btn-warning btn-lg">
                    Make Prediction
                  </Link>
                )}
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <FaChartLine size={200} className="text-warning opacity-75" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Key Features</h2>
            <p className="lead text-muted">
              Everything you need for accurate stock market predictions
            </p>
          </div>
          
          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-md-6 col-lg-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body text-center p-4">
                    <div className="mb-3">
                      <div 
                        className="d-inline-flex align-items-center justify-content-center"
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontSize: '24px'
                        }}
                      >
                        {feature.icon}
                      </div>
                    </div>
                    <h5 className="card-title fw-bold">{feature.title}</h5>
                    <p className="card-text text-muted">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stocks Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Supported Stocks</h2>
            <p className="lead text-muted">
              Predict prices for major Indian IT companies
            </p>
          </div>
          
          <div className="row g-4">
            {stocks.map((stock, index) => (
              <div key={index} className="col-md-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center p-4">
                    <div 
                      className="mb-3 d-inline-flex align-items-center justify-content-center"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        backgroundColor: stock.color,
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: 'bold'
                      }}
                    >
                      {stock.symbol[0]}
                    </div>
                    <h4 className="card-title fw-bold">{stock.symbol}</h4>
                    <p className="card-text text-muted">{stock.name}</p>
                    {isAuthenticated && (
                      <Link 
                        to="/prediction" 
                        className="btn btn-outline-primary"
                        state={{ selectedStock: stock.symbol }}
                      >
                        Predict <FaArrowRight className="ms-1" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 gradient-bg text-white">
        <div className="container text-center">
          <h2 className="display-5 fw-bold mb-4">Ready to Start Predicting?</h2>
          <p className="lead mb-4">
            Join thousands of users making informed investment decisions with our AI-powered predictions.
          </p>
          {!isAuthenticated ? (
            <div className="d-flex justify-content-center gap-3">
              <Link to="/register" className="btn btn-warning btn-lg">
                <FaRocket className="me-2" />
                Get Started Free
              </Link>
              <Link to="/about" className="btn btn-outline-light btn-lg">
                Learn More
              </Link>
            </div>
          ) : (
            <Link to="/prediction" className="btn btn-warning btn-lg">
              <FaChartLine className="me-2" />
              Make Your First Prediction
            </Link>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-3">
              <div className="stats-card">
                <h3>95%</h3>
                <p>Accuracy Rate</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stats-card">
                <h3>3</h3>
                <p>Supported Stocks</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stats-card">
                <h3>2</h3>
                <p>ML Models</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stats-card">
                <h3>24/7</h3>
                <p>Available</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;