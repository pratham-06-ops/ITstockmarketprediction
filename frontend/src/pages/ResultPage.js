import React, { useState, useEffect } from 'react';
import { adminAPI, stockAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FaClipboardList, 
  FaSearch, 
  FaDownload,
  FaEye,
  FaTrash,
  FaBrain,
  FaCalculator,
  FaEdit,
  FaTimes,
  FaCheck
} from 'react-icons/fa';

const ResultPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  
  const [sortBy] = useState('date');
  const [sortOrder] = useState('desc');
  const [editingPrediction, setEditingPrediction] = useState(null);
  const [editFormData, setEditFormData] = useState({
    model_used: '',
    confidence_score: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPrices, setCurrentPrices] = useState({});

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const response = await adminAPI.getAllPredictions();
      const preds = response.data.predictions;
      setPredictions(preds);
      // Fetch live current prices for distinct symbols
      const symbols = Array.from(new Set((preds || []).map(p => p.stock_symbol)));
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

  // Status helpers removed

  const filteredAndSortedPredictions = predictions
    .filter(prediction => {
      const matchesSearch = prediction.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          prediction.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStock = filterStock === 'all' || prediction.stock_symbol === filterStock;
      const matchesModel = filterModel === 'all' || prediction.model_used === filterModel;
      
      return matchesSearch && matchesStock && matchesModel;
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
    const headers = ['Date', 'User', 'Stock', 'Predicted Price', 'Model', 'Confidence'];
    const csvData = filteredAndSortedPredictions.map(pred => [
      formatDate(pred.prediction_date),
      pred.username,
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
    a.download = 'all_predictions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAnalytics = () => {
    const total = predictions.length;
    const avgConfidence = predictions.length > 0 
      ? (predictions.reduce((acc, p) => acc + p.confidence_score, 0) / predictions.length * 100).toFixed(1)
      : 0;
    
    return { total, avgConfidence };
  };

  const analytics = getAnalytics();

  const handleEditPrediction = (prediction) => {
    setEditingPrediction(prediction);
    setEditFormData({
      model_used: prediction.model_used,
      confidence_score: prediction.confidence_score
    });
    setShowEditModal(true);
  };

  const handleDeletePrediction = async (predictionId) => {
    if (window.confirm('Are you sure you want to delete this prediction? This action cannot be undone.')) {
      try {
        await adminAPI.deletePrediction(predictionId);
        setPredictions(predictions.filter(p => p.id !== predictionId));
        toast.success('Prediction deleted successfully');
      } catch (error) {
        toast.error('Failed to delete prediction');
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.updatePrediction(editingPrediction.id, editFormData);
      setPredictions(predictions.map(p => 
        p.id === editingPrediction.id ? { ...p, ...response.data.prediction } : p
      ));
      setShowEditModal(false);
      toast.success('Prediction updated successfully');
    } catch (error) {
      toast.error('Failed to update prediction');
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: name === 'confidence_score' ? parseFloat(value) : value
    }));
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
          <button className="btn btn-success w-100" onClick={exportToCSV}>
            <FaDownload className="me-2" />
            Export
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-primary">{analytics.total}</h4>
              <p className="text-muted mb-0">Total</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-primary">{analytics.avgConfidence}%</h4>
              <p className="text-muted mb-0">Avg Confidence</p>
            </div>
          </div>
        </div>
        {/* <div className="col-md-2">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-secondary">
                {predictions.filter(p => p.model_used === 'lstm').length}
              </h4>
              <p className="text-muted mb-0">LSTM Model</p>
            </div>
          </div>
        </div> */}
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
                        <th>Current Price</th>
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
                              {currentPrices[prediction.stock_symbol] != null ? (
                                formatCurrency(currentPrices[prediction.stock_symbol])
                              ) : (
                                <span className="text-muted">—</span>
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
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary" 
                                  title="View Details"
                                  onClick={() => toast.info('View details functionality coming soon!')}
                                >
                                  <FaEye />
                                </button>
                                <button 
                                  className="btn btn-outline-warning" 
                                  title="Edit Prediction"
                                  onClick={() => handleEditPrediction(prediction)}
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  className="btn btn-outline-danger" 
                                  title="Delete Prediction"
                                  onClick={() => handleDeletePrediction(prediction.id)}
                                >
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

      {/* Edit Prediction Modal */}
      {showEditModal && editingPrediction && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FaEdit className="me-2" />
                  Edit Prediction
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Stock Symbol</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingPrediction.stock_symbol}
                        disabled
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Predicted Price</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formatCurrency(editingPrediction.predicted_price)}
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    
                    <div className="col-md-6">
                      <label className="form-label">Model Used</label>
                      <select
                        className="form-select"
                        name="model_used"
                        value={editFormData.model_used}
                        onChange={handleEditInputChange}
                      >
                        <option value="lstm">LSTM</option>
                        <option value="linear">Linear Regression</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Confidence Score (0-1)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="confidence_score"
                        value={editFormData.confidence_score}
                        onChange={handleEditInputChange}
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.0 - 1.0"
                      />
                      <div className="form-text">Enter a value between 0.0 and 1.0</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">User</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingPrediction.username}
                        disabled
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    <FaTimes className="me-2" />
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <FaCheck className="me-2" />
                    Update Prediction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultPage;
