import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FaClipboardList, 
  FaSearch, 
  FaFilter, 
  FaDownload,
  FaEye,
  FaTrash,
  FaChartLine,
  FaBrain,
  FaCalculator
} from 'react-icons/fa';

const ResultPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const response = await adminAPI.getAllPredictions();
      setPredictions(response.data.predictions);
    } catch (error) {
      toast.error('Failed to load predictions');
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

  const getPredictionStatus = (predicted, actual) => {
    if (!actual) return 'pending';
    const difference = ((predicted - actual) / actual) * 100;
    if (Math.abs(difference) <= 5) return 'accurate';
    if (difference > 0) return 'overestimated';
    return 'underestimated';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accurate': return 'success';
      case 'overestimated': return 'warning';
      case 'underestimated': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accurate': return '✓';
      case 'overestimated': return '↑';
      case 'underestimated': return '↓';
      default: return '⏳';
    }
  };

  const filteredAndSortedPredictions = predictions
    .filter(prediction => {
      const matchesSearch = prediction.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prediction.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStock = filterStock === 'all' || prediction.stock_symbol === filterStock;
      const matchesModel = filterModel === 'all' || prediction.model_used === filterModel;
      const matchesStatus = filterStatus === 'all' || 
                          getPredictionStatus(prediction.predicted_price, prediction.actual_price) === filterStatus;
      
      return matchesSearch && matchesStock && matchesModel && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.prediction_date);
          bValue = new Date(b.prediction_date);
          break;
        case 'user':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'stock':
          aValue = a.stock_symbol.toLowerCase();
          bValue = b.stock_symbol.toLowerCase();
          break;
        case 'predicted':
          aValue = a.predicted_price;
          bValue = b.predicted_price;
          break;
        case 'confidence':
          aValue = a.confidence_score;
          bValue = b.confidence_score;
          break;
        default:
          aValue = new Date(a.prediction_date);
          bValue = new Date(b.prediction_date);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Stock', 'Predicted Price', 'Actual Price', 'Model', 'Confidence', 'Status'];
    const csvData = filteredAndSortedPredictions.map(pred => [
      formatDate(pred.prediction_date),
      pred.username,
      pred.stock_symbol,
      pred.predicted_price,
      pred.actual_price || 'Pending',
      pred.model_used.toUpperCase(),
      `${(pred.confidence_score * 100).toFixed(1)}%`,
      getPredictionStatus(pred.predicted_price, pred.actual_price)
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_predictions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAnalytics = () => {
    const total = predictions.length;
    const completed = predictions.filter(p => p.actual_price).length;
    const accurate = predictions.filter(p => {
      if (!p.actual_price) return false;
      const status = getPredictionStatus(p.predicted_price, p.actual_price);
      return status === 'accurate';
    }).length;
    
    const avgConfidence = predictions.length > 0 
      ? (predictions.reduce((acc, p) => acc + p.confidence_score, 0) / predictions.length * 100).toFixed(1)
      : 0;
    
    const accuracyRate = completed > 0 ? (accurate / completed * 100).toFixed(1) : 0;
    
    return { total, completed, accurate, avgConfidence, accuracyRate };
  };

  const analytics = getAnalytics();

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
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">
            <FaClipboardList className="me-2" />
            All Predictions
          </h2>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by user or stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
          >
            <option value="all">All Stocks</option>
            <option value="TCS">TCS</option>
            <option value="WIPRO">WIPRO</option>
            <option value="INFOSYS">INFOSYS</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={filterModel}
            onChange={(e) => setFilterModel(e.target.value)}
          >
            <option value="all">All Models</option>
            <option value="lstm">LSTM</option>
            <option value="linear">Linear Regression</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accurate">Accurate</option>
            <option value="overestimated">Overestimated</option>
            <option value="underestimated">Underestimated</option>
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-success w-100" onClick={exportToCSV}>
            <FaDownload className="me-2" />
            Export
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-primary">{analytics.total}</h4>
              <p className="text-muted mb-0">Total</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-success">{analytics.completed}</h4>
              <p className="text-muted mb-0">Completed</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-warning">{analytics.accurate}</h4>
              <p className="text-muted mb-0">Accurate</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-info">{analytics.accuracyRate}%</h4>
              <p className="text-muted mb-0">Accuracy</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-primary">{analytics.avgConfidence}%</h4>
              <p className="text-muted mb-0">Avg Confidence</p>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-secondary">
                {predictions.filter(p => p.model_used === 'lstm').length}
              </h4>
              <p className="text-muted mb-0">LSTM Models</p>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaClipboardList className="me-2" />
                All Predictions ({filteredAndSortedPredictions.length} results)
              </h5>
            </div>
            <div className="card-body">
              {filteredAndSortedPredictions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Stock</th>
                        <th>Predicted Price</th>
                        <th>Actual Price</th>
                        <th>Model</th>
                        <th>Confidence</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedPredictions.map((prediction) => {
                        const status = getPredictionStatus(
                          prediction.predicted_price,
                          prediction.actual_price
                        );
                        return (
                          <tr key={prediction.id}>
                            <td>
                              <small className="text-muted">
                                {formatDate(prediction.prediction_date)}
                              </small>
                            </td>
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
                                {prediction.model_used === 'lstm' ? (
                                  <><FaBrain className="me-1" />LSTM</>
                                ) : (
                                  <><FaCalculator className="me-1" />Linear</>
                                )}
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
                              <span className={`badge bg-${getStatusColor(status)}`}>
                                {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary" title="View Details">
                                  <FaEye />
                                </button>
                                <button className="btn btn-outline-danger" title="Delete">
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaClipboardList size={50} className="text-muted mb-3" />
                  <h5 className="text-muted">No predictions found</h5>
                  <p className="text-muted">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;