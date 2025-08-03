import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { stockAPI } from '../services/api';
import { toast } from 'react-toastify';
import Plot from 'react-plotly.js';
import { 
  FaChartLine, 
  FaBrain, 
  FaCalculator, 
  FaChartBar, 
  FaSpinner,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

const PredictionPage = () => {
  const location = useLocation();
  const [selectedStock, setSelectedStock] = useState(location.state?.selectedStock || 'TCS');
  const [selectedModel, setSelectedModel] = useState('lstm');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [charts, setCharts] = useState({});
  const [showTechnicalIndicators, setShowTechnicalIndicators] = useState(false);
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    loadStocks();
    loadCharts(selectedStock);
  }, [selectedStock]);

  const loadStocks = async () => {
    try {
      const response = await stockAPI.getStocks();
      setStocks(response.data.stocks);
    } catch (error) {
      toast.error('Failed to load stocks');
    }
  };

  const loadCharts = async (stockSymbol) => {
    try {
      const response = await stockAPI.getCharts(stockSymbol);
      setCharts(response.data);
    } catch (error) {
      toast.error('Failed to load charts');
    }
  };

  const handlePrediction = async () => {
    setLoading(true);
    try {
      const response = await stockAPI.predict(selectedStock, selectedModel);
      setPrediction(response.data);
      toast.success('Prediction completed successfully!');
    } catch (error) {
      toast.error('Failed to make prediction');
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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'danger';
  };

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4">
            <FaChartLine className="me-2" />
            Stock Price Prediction
          </h2>
        </div>
      </div>

      <div className="row">
        {/* Prediction Controls */}
        <div className="col-lg-4 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaCalculator className="me-2" />
                Prediction Settings
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Select Stock</label>
                <select
                  className="form-select form-select-lg"
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                >
                  {stocks.map((stock) => (
                    <option key={stock.symbol} value={stock.symbol}>
                      {stock.symbol} - {stock.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Select Model</label>
                <div className="d-flex gap-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="model"
                      id="lstm"
                      value="lstm"
                      checked={selectedModel === 'lstm'}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="lstm">
                      <FaBrain className="me-1" />
                      LSTM
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="model"
                      id="linear"
                      value="linear"
                      checked={selectedModel === 'linear'}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor="linear">
                      <FaCalculator className="me-1" />
                      Linear Regression
                    </label>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-primary w-100 btn-lg"
                onClick={handlePrediction}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="me-2" />
                    Making Prediction...
                  </>
                ) : (
                  <>
                    <FaChartLine className="me-2" />
                    Make Prediction
                  </>
                )}
              </button>

              {/* Prediction Result */}
              {prediction && (
                <div className="mt-4">
                  <h6 className="fw-bold mb-3">Prediction Result</h6>
                  <div className="row g-2">
                    <div className="col-6">
                      <div className="card bg-light">
                        <div className="card-body text-center p-2">
                          <small className="text-muted">Current Price</small>
                          <div className="fw-bold">{formatCurrency(prediction.prediction.current_price)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="card bg-success text-white">
                        <div className="card-body text-center p-2">
                          <small>Predicted Price</small>
                          <div className="fw-bold">{formatCurrency(prediction.prediction.predicted_price)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className={`card bg-${getConfidenceColor(prediction.prediction.confidence)} text-white`}>
                        <div className="card-body text-center p-2">
                          <small>Confidence</small>
                          <div className="fw-bold">{(prediction.prediction.confidence * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Technical Indicators */}
                  {prediction.prediction.technical_indicators && (
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-secondary btn-sm w-100"
                        onClick={() => setShowTechnicalIndicators(!showTechnicalIndicators)}
                      >
                        {showTechnicalIndicators ? <FaEyeSlash /> : <FaEye />} Technical Indicators
                      </button>
                      
                      {showTechnicalIndicators && (
                        <div className="mt-3 p-3 bg-light rounded">
                          <h6 className="fw-bold mb-2">Technical Analysis</h6>
                          <div className="row g-2">
                            <div className="col-6">
                              <small className="text-muted">RSI</small>
                              <div className="fw-bold">{prediction.prediction.technical_indicators.rsi}</div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">MACD</small>
                              <div className="fw-bold">{prediction.prediction.technical_indicators.macd}</div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">MA 20</small>
                              <div className="fw-bold">{formatCurrency(prediction.prediction.technical_indicators.ma_20)}</div>
                            </div>
                            <div className="col-6">
                              <small className="text-muted">MA 50</small>
                              <div className="fw-bold">{formatCurrency(prediction.prediction.technical_indicators.ma_50)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-lg-8">
          <div className="row">
            {/* Line Chart */}
            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <FaChartBar className="me-2" />
                    Price Trend - {selectedStock}
                  </h5>
                </div>
                <div className="card-body">
                  {charts.line_chart ? (
                    <Plot
                      data={charts.line_chart.data}
                      layout={{
                        ...charts.line_chart.layout,
                        height: 400,
                        margin: { t: 20, r: 20, b: 40, l: 60 }
                      }}
                      config={{ displayModeBar: false }}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <div className="loading">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Candlestick Chart */}
            <div className="col-12 mb-4">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <FaChartBar className="me-2" />
                    OHLC Chart - {selectedStock}
                  </h5>
                </div>
                <div className="card-body">
                  {charts.candlestick_chart ? (
                    <Plot
                      data={charts.candlestick_chart.data}
                      layout={{
                        ...charts.candlestick_chart.layout,
                        height: 400,
                        margin: { t: 20, r: 20, b: 40, l: 60 }
                      }}
                      config={{ displayModeBar: false }}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <div className="loading">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">
                    <FaChartBar className="me-2" />
                    Price Distribution
                  </h5>
                </div>
                <div className="card-body">
                  {charts.pie_chart ? (
                    <Plot
                      data={charts.pie_chart.data}
                      layout={{
                        ...charts.pie_chart.layout,
                        height: 300,
                        margin: { t: 20, r: 20, b: 20, l: 20 }
                      }}
                      config={{ displayModeBar: false }}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <div className="loading">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Technical Indicators Chart */}
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <FaBrain className="me-2" />
                    Technical Analysis
                  </h5>
                </div>
                <div className="card-body">
                  {charts.technical_indicators_chart ? (
                    <Plot
                      data={charts.technical_indicators_chart.data}
                      layout={{
                        ...charts.technical_indicators_chart.layout,
                        height: 300,
                        margin: { t: 20, r: 20, b: 40, l: 60 }
                      }}
                      config={{ displayModeBar: false }}
                      style={{ width: '100%' }}
                    />
                  ) : (
                    <div className="loading">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;