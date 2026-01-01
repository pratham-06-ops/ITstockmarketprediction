import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { stockAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  FaChartLine,
  FaHistory,
  FaUser,
  FaCalendarAlt,
  FaCalculator
} from 'react-icons/fa';

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPrices, setCurrentPrices] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, historyResponse] = await Promise.all([
        stockAPI.getStats(),
        stockAPI.getHistory()
      ]);
      setStats(statsResponse.data);
      const recent = historyResponse.data.history.slice(0, 5);
      setRecentPredictions(recent);
      // Fetch current prices for distinct stock symbols in recent predictions
      const symbols = Array.from(new Set(recent.map(p => p.stock_symbol)));
      if (symbols.length > 0) {
        try {
          const entries = await Promise.all(symbols.map(async (sym) => {
            try {
              const res = await stockAPI.getCurrentPrice(sym);
              return [sym, res.data.current_price];
            } catch (err) {
              console.warn(`Failed to fetch current price for ${sym}:`, err);
              return [sym, null];
            }
          }));
          setCurrentPrices(Object.fromEntries(entries));
        } catch (err) {
          console.warn('Error fetching current prices:', err);
        }
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      {/* Welcome Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm gradient-bg text-white">
            <div className="card-body p-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h2 className="mb-2">
                    Welcome back, {user?.username}! 👋
                  </h2>
                  <p className="mb-0 opacity-75">
                    Ready to make some predictions? Explore the latest stock trends and get AI-powered insights.
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <Link to="/prediction" className="btn btn-warning btn-lg">
                    <FaChartLine className="me-2" />
                    Make Prediction
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaChartLine size={30} className="text-primary" />
              </div>
              <h3 className="fw-bold text-primary">{stats?.total_predictions || 0}</h3>
              <p className="text-muted mb-0">Total Predictions</p>
            </div>
          </div>
        </div>
        {/* <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaCalculator size={30} className="text-warning" />
              </div>
              <h3 className="fw-bold text-warning">LSTM </h3>
              <p className="text-muted mb-0">ML Model</p>
            </div>
          </div>
        </div> */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUser size={30} className="text-info" />
              </div>
              <h3 className="fw-bold text-info">3</h3>
              <p className="text-muted mb-0">Supported Stocks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <h4 className="mb-3">Quick Actions</h4>
          <div className="row g-3">
            <div className="col-md-4">
              <Link to="/prediction" className="text-decoration-none">
                <div className="card border-0 shadow-sm h-100 hover-card">
                  <div className="card-body text-center p-4">
                    <FaChartLine size={40} className="text-primary mb-3" />
                    <h5 className="fw-bold">Make Prediction</h5>
                    <p className="text-muted mb-0">Use AI models to predict stock prices</p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/history" className="text-decoration-none">
                <div className="card border-0 shadow-sm h-100 hover-card">
                  <div className="card-body text-center p-4">
                    <FaHistory size={40} className="text-success mb-3" />
                    <h5 className="fw-bold">View History</h5>
                    <p className="text-muted mb-0">Check your prediction history</p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-4">
              <Link to="/change-password" className="text-decoration-none">
                <div className="card border-0 shadow-sm h-100 hover-card">
                  <div className="card-body text-center p-4">
                    <FaUser size={40} className="text-warning mb-3" />
                    <h5 className="fw-bold">Account Settings</h5>
                    <p className="text-muted mb-0">Manage your account preferences</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaHistory className="me-2" />
                Recent Predictions
              </h5>
            </div>
            <div className="card-body">
              {recentPredictions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Stock</th>
                        <th>Current Price</th>
                        <th>Predicted Price</th>
                        <th>Model</th>
                        <th>Confidence</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPredictions.map((prediction) => (
                        <tr key={prediction.id}>
                          <td>
                            <span className="badge bg-primary">{prediction.stock_symbol}</span>
                          </td>
                          <td className="fw-bold">
                            {currentPrices[prediction.stock_symbol] != null ? (
                              formatCurrency(currentPrices[prediction.stock_symbol])
                            ) : (
                              <span className="text-muted">Unable to fetch</span>
                            )}
                          </td>
                          <td className="fw-bold">{formatCurrency(prediction.predicted_price)}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {prediction.model_used.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                                <div
                                  className="progress-bar"
                                  style={{ width: `${prediction.confidence_score * 100}%` }}
                                ></div>
                              </div>
                              <small>{(prediction.confidence_score * 100).toFixed(0)}%</small>
                            </div>
                          </td>
                          <td>
                            <small className="text-muted">
                              <FaCalendarAlt className="me-1" />
                              {formatDate(prediction.prediction_date)}
                            </small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaHistory size={50} className="text-muted mb-3" />
                  <h5 className="text-muted">No predictions yet</h5>
                  <p className="text-muted">Make your first prediction to see it here!</p>
                  <Link to="/prediction" className="btn btn-primary">
                    Make Prediction
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
