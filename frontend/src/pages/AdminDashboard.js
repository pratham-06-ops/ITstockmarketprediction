import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI, stockAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FaUsers, 
  FaChartLine, 
  FaBrain, 
  FaCalculator,
  FaUserShield,
  FaClipboardList,
  FaArrowUp,
  FaArrowDown,
  FaEye
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, usersResponse, predictionsResponse] = await Promise.all([
        stockAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getAllPredictions()
      ]);
      
      setStats(statsResponse.data);
      setUsers(usersResponse.data.users);
      setPredictions(predictionsResponse.data.predictions);
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
      day: 'numeric'
    });
  };

  const getPredictionAccuracy = () => {
    const completedPredictions = predictions.filter(p => p.actual_price);
    if (completedPredictions.length === 0) return 0;
    
    const accuratePredictions = completedPredictions.filter(p => {
      const difference = Math.abs(p.predicted_price - p.actual_price) / p.actual_price;
      return difference <= 0.05; // 5% accuracy threshold
    });
    
    return (accuratePredictions.length / completedPredictions.length * 100).toFixed(1);
  };

  const getTopPerformingStocks = () => {
    const stockStats = {};
    predictions.forEach(pred => {
      if (!stockStats[pred.stock_symbol]) {
        stockStats[pred.stock_symbol] = { count: 0, totalConfidence: 0 };
      }
      stockStats[pred.stock_symbol].count++;
      stockStats[pred.stock_symbol].totalConfidence += pred.confidence_score;
    });

    return Object.entries(stockStats)
      .map(([symbol, stats]) => ({
        symbol,
        count: stats.count,
        avgConfidence: (stats.totalConfidence / stats.count * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
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
                    <FaUserShield className="me-2" />
                    Admin Dashboard
                  </h2>
                  <p className="mb-0 opacity-75">
                    Monitor system performance, user activity, and prediction analytics
                  </p>
                </div>
                <div className="col-md-4 text-end">
                  <div className="d-flex gap-2 justify-content-end">
                    <Link to="/admin/users" className="btn btn-warning">
                      <FaUsers className="me-2" />
                      Manage Users
                    </Link>
                    <Link to="/admin/results" className="btn btn-outline-light">
                      <FaClipboardList className="me-2" />
                      View Results
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Statistics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaUsers size={30} className="text-primary" />
              </div>
              <h3 className="fw-bold text-primary">{stats?.total_users || 0}</h3>
              <p className="text-muted mb-0">Total Users</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaChartLine size={30} className="text-success" />
              </div>
              <h3 className="fw-bold text-success">{stats?.total_predictions || 0}</h3>
              <p className="text-muted mb-0">Total Predictions</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaBrain size={30} className="text-warning" />
              </div>
              <h3 className="fw-bold text-warning">{getPredictionAccuracy()}%</h3>
              <p className="text-muted mb-0">Accuracy Rate</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <div className="mb-2">
                <FaCalculator size={30} className="text-info" />
              </div>
              <h3 className="fw-bold text-info">2</h3>
              <p className="text-muted mb-0">ML Models</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Recent Users */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaUsers className="me-2" />
                Recent Users
              </h5>
            </div>
            <div className="card-body">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="d-flex align-items-center mb-3 p-2 border rounded">
                  <div 
                    className="d-inline-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontSize: '16px'
                    }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-0">{user.username}</h6>
                    <small className="text-muted">{user.email}</small>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-secondary">{user.prediction_count} predictions</span>
                    {user.is_admin && (
                      <span className="badge bg-warning ms-1">Admin</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="text-center">
                <Link to="/admin/users" className="btn btn-outline-primary btn-sm">
                  View All Users
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Stocks */}
        <div className="col-lg-6 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Top Performing Stocks
              </h5>
            </div>
            <div className="card-body">
              {getTopPerformingStocks().map((stock, index) => (
                <div key={stock.symbol} className="d-flex align-items-center mb-3 p-2 border rounded">
                  <div className="me-3">
                    <span className="badge bg-primary fs-6">{stock.symbol}</span>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <span className="fw-bold">{stock.count} predictions</span>
                      <span className="text-muted">{stock.avgConfidence}% avg confidence</span>
                    </div>
                    <div className="progress mt-1" style={{ height: '4px' }}>
                      <div
                        className="progress-bar"
                        style={{ width: `${(stock.count / Math.max(...getTopPerformingStocks().map(s => s.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <FaClipboardList className="me-2" />
                Recent Predictions
              </h5>
            </div>
            <div className="card-body">
              {predictions.slice(0, 10).length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Stock</th>
                        <th>Predicted Price</th>
                        <th>Actual Price</th>
                        <th>Model</th>
                        <th>Confidence</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.slice(0, 10).map((prediction) => (
                        <tr key={prediction.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div 
                                className="d-inline-flex align-items-center justify-content-center me-2"
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontSize: '12px'
                                }}
                              >
                                {prediction.username[0].toUpperCase()}
                              </div>
                              <span className="fw-semibold">{prediction.username}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-primary">{prediction.stock_symbol}</span>
                          </td>
                          <td className="fw-bold">{formatCurrency(prediction.predicted_price)}</td>
                          <td>
                            {prediction.actual_price ? (
                              formatCurrency(prediction.actual_price)
                            ) : (
                              <span className="text-muted">Pending</span>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {prediction.model_used.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: '4px' }}>
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
                              {formatDate(prediction.prediction_date)}
                            </small>
                          </td>
                          <td>
                            <button className="btn btn-outline-primary btn-sm" title="View Details">
                              <FaEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaClipboardList size={50} className="text-muted mb-3" />
                  <h5 className="text-muted">No predictions yet</h5>
                  <p className="text-muted">Predictions will appear here once users start making them</p>
                </div>
              )}
              <div className="text-center mt-3">
                <Link to="/admin/results" className="btn btn-outline-info">
                  View All Predictions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;