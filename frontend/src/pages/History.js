import React, { useState, useEffect } from 'react';
import { stockAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FaHistory, 
  FaFilter, 
  FaSort, 
  FaDownload,
  FaEye
} from 'react-icons/fa';

const History = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPrices, setCurrentPrices] = useState({});
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await stockAPI.getHistory();
      setPredictions(response.data.history);
      const symbols = Array.from(new Set((response.data.history || []).map(p => p.stock_symbol)));
      if (symbols.length > 0) {
        try {
          const entries = await Promise.all(symbols.map(async (sym) => {
            try {
              const res = await stockAPI.getCurrentPrice(sym);
              return [sym, res.data.current_price];
            } catch {
              return [sym, null];
            }
          }));
          setCurrentPrices(Object.fromEntries(entries));
        } catch {}
      }
    } catch (error) {
      toast.error('Failed to load prediction history');
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

  

  const filteredAndSortedPredictions = predictions
    .filter(prediction => {
      if (filter === 'all') return true;
      if (filter === 'pending') return false;
      if (filter === 'completed') return false;
      return prediction.stock_symbol === filter;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.prediction_date);
          bValue = new Date(b.prediction_date);
          break;
        case 'stock':
          aValue = a.stock_symbol;
          bValue = b.stock_symbol;
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
    const headers = ['Date', 'Stock', 'Predicted Price', 'Model', 'Confidence'];
    const csvData = filteredAndSortedPredictions.map(pred => [
      formatDate(pred.prediction_date),
      pred.stock_symbol,
      pred.predicted_price,
      pred.model_used.toUpperCase(),
      `${(pred.confidence_score * 100).toFixed(1)}%`
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prediction_history.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-3">
            <FaHistory className="me-2" />
            Prediction History
          </h2>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="d-flex gap-3">
            <div className="d-flex align-items-center">
              <FaFilter className="me-2 text-muted" />
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Predictions</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="TCS">TCS</option>
                <option value="WIPRO">WIPRO</option>
                <option value="INFOSYS">INFOSYS</option>
              </select>
            </div>
            <div className="d-flex align-items-center">
              <FaSort className="me-2 text-muted" />
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Date</option>
                <option value="stock">Stock</option>
                <option value="predicted">Predicted Price</option>
                <option value="confidence">Confidence</option>
              </select>
            </div>
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-success" onClick={exportToCSV}>
            <FaDownload className="me-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-primary">{predictions.length}</h4>
              <p className="text-muted mb-0">Total Predictions</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-info">
                {(predictions.reduce((acc, p) => acc + p.confidence_score, 0) / predictions.length * 100).toFixed(1)}%
              </h4>
              <p className="text-muted mb-0">Avg Confidence</p>
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
                <FaHistory className="me-2" />
                Prediction History ({filteredAndSortedPredictions.length} results)
              </h5>
            </div>
            <div className="card-body">
              {filteredAndSortedPredictions.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Stock</th>
                        <th>Current Price</th>
                        <th>Predicted Price</th>
                        <th>Model</th>
                        <th>Confidence</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedPredictions.map((prediction) => {
                        return (
                          <tr key={prediction.id}>
                            <td>
                              <small className="text-muted">
                                {formatDate(prediction.prediction_date)}
                              </small>
                            </td>
                            <td>
                              <span className="badge bg-primary">{prediction.stock_symbol}</span>
                            </td>
                            <td>
                              {currentPrices[prediction.stock_symbol] != null ? (
                                formatCurrency(currentPrices[prediction.stock_symbol])
                              ) : (
                                <span className="text-muted">—</span>
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
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary" 
                                  title="View Details"
                                  onClick={() => toast.info('View details functionality coming soon!')}
                                >
                                  <FaEye />
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
                  <FaHistory size={50} className="text-muted mb-3" />
                  <h5 className="text-muted">No predictions found</h5>
                  <p className="text-muted">Try adjusting your filters or make a new prediction!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;