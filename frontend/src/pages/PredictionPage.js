import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { stockAPI, handleAPIError } from '../services/api';
import { toast } from 'react-toastify';
import Plot from 'react-plotly.js';
import { 
  FaChartLine, 
  FaChartBar, 
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaCalendarAlt,
  FaArrowUp,      // Use this for upward trend
  FaArrowDown,    // Use this for downward trend
  FaMinus,
  FaRupeeSign
} from 'react-icons/fa';

const PredictionPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState(location.state?.selectedStock || 'TCS');
  const [duration, setDuration] = useState('3_month');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [charts, setCharts] = useState({});
  const [showTechnicalIndicators, setShowTechnicalIndicators] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    loadStocks();
    loadCharts(selectedStock);
    loadCurrentPrice(selectedStock);
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

  const loadCurrentPrice = async (stockSymbol) => {
    setPriceLoading(true);
    try {
      const response = await stockAPI.getCurrentPrice(stockSymbol);
      setCurrentPrice(response.data.current_price);
    } catch (error) {
      console.warn('Failed to load current price:', error);
      setCurrentPrice(null);
    } finally {
      setPriceLoading(false);
    }
  };

  const handlePrediction = async () => {
    setLoading(true);
    try {
      // Use the new multi-duration prediction endpoint
      const response = await stockAPI.multiDurationPredict(selectedStock, duration);
      setPrediction(response.data);
      toast.success('Prediction completed successfully!');
      
      // Reload current price after prediction
      loadCurrentPrice(selectedStock);

      // Navigate to result page with prediction details
      navigate('/prediction/result', {
        state: {
          selectedStock,
          duration,
          result: response.data
        }
      });
    } catch (error) {
      const msg = handleAPIError(error);
      toast.error(msg);
      console.error('Prediction error:', error?.response?.data || error);
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


  const getDurationLabel = (duration) => {
    const labels = {
      '3_month': '3 Months',
      '6_month': '6 Months',
      '1_year': '1 Year'
    };
    return labels[duration] || duration;
  };

  const renderPredictionResult = () => {
    if (!prediction) return null;

    const pred = prediction.prediction;
    
    return (
      <div className="mt-4">
        <h6 className="fw-bold mb-3">Prediction Result - {getDurationLabel(duration)}</h6>
        
        {/* Price Comparison Cards */}
        <div className="row g-3 mb-3">
          
          <div className="col-md-4">
            <div className="card bg-info text-white">
              <div className="card-body text-center p-3">
                <small>Current Price (Live)</small>
                <div className="fw-bold fs-5">{formatCurrency(pred.current_price)}</div>
                <small>
                  <FaCalendarAlt className="me-1" />
                  {new Date().toLocaleDateString()}
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card bg-success text-white">
              <div className="card-body text-center p-3">
                <small>Predicted Price</small>
                <div className="fw-bold fs-5">{formatCurrency(pred.predictions?.[pred.predictions.length - 1]?.predicted_price || pred.predicted_price)}</div>
                <small>
                  <FaCalendarAlt className="me-1" />
                  {pred.predictions?.[pred.predictions.length - 1]?.date || 
                   new Date(Date.now() + (duration === '3_month' ? 90 * 24 * 60 * 60 * 1000 : 
                                        duration === '6_month' ? 180 * 24 * 60 * 60 * 1000 : 
                                        365 * 24 * 60 * 60 * 1000)).toLocaleDateString()}
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Profit/Loss Conclusion */}
        <div className={`card mb-3 ${
          pred.conclusion_type === 'profit' ? 'bg-success text-white' : 
          pred.conclusion_type === 'loss' ? 'bg-danger text-white' : 
          'bg-secondary text-white'
        }`}>
          <div className="card-body text-center">
            <h6 className="mb-0">
              {pred.conclusion_type === 'profit' ? <FaArrowUp className="me-2" /> : 
               pred.conclusion_type === 'loss' ? <FaArrowDown className="me-2" /> : 
               <FaMinus className="me-2" />}
              {pred.conclusion}
            </h6>
          </div>
        </div>

        {/* Confidence and Technical Indicators */}
        <div className="row g-3">
          <div className="col-md-6">
            <div className={`card bg-${getConfidenceColor(pred.confidence)} text-white`}>
              <div className="card-body text-center">
                <small>Confidence</small>
                <div className="fw-bold fs-4">{(pred.confidence * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <button
              className="btn btn-outline-secondary w-100 h-100"
              onClick={() => setShowTechnicalIndicators(!showTechnicalIndicators)}
            >
              {showTechnicalIndicators ? <FaEyeSlash /> : <FaEye />} Technical Indicators
            </button>
          </div>
        </div>

        {/* Technical Indicators */}
        {showTechnicalIndicators && pred.technical_indicators && (
          <div className="mt-3 p-3 bg-light rounded">
            <h6 className="fw-bold mb-2">Technical Analysis</h6>
            <div className="row g-2">
              <div className="col-6">
                <small className="text-muted">RSI</small>
                <div className="fw-bold">{pred.technical_indicators.rsi}</div>
              </div>
              <div className="col-6">
                <small className="text-muted">MACD</small>
                <div className="fw-bold">{pred.technical_indicators.macd}</div>
              </div>
              <div className="col-6">
                <small className="text-muted">MA 20</small>
                <div className="fw-bold">{formatCurrency(pred.technical_indicators.ma_20)}</div>
              </div>
              <div className="col-6">
                <small className="text-muted">MA 50</small>
                <div className="fw-bold">{formatCurrency(pred.technical_indicators.ma_50)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Duration-specific breakdowns */}
        {duration === '3_month' && pred.summary?.weekly_breakdown && (
          <div className="mt-3">
            <h6 className="fw-bold mb-2">Weekly Breakdown</h6>
            <div className="row g-2">
              {pred.summary.weekly_breakdown.map((week, index) => (
                <div key={index} className="col-md-6 col-lg-3">
                  <div className="card border-primary">
                    <div className="card-body text-center p-2">
                      <small className="text-muted">Week {week.week}</small>
                      <div className="fw-bold fs-6">{week.date}</div>
                      <div className="text-primary fw-bold">{formatCurrency(week.predicted_price)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {duration === '1_year' && pred.summary?.monthly_breakdown && (
          <div className="mt-3">
            <h6 className="fw-bold mb-2">Monthly Breakdown</h6>
            <div className="row g-2">
              {pred.summary.monthly_breakdown.map((month, index) => (
                <div key={index} className="col-md-6 col-lg-3">
                  <div className="card border-success">
                    <div className="card-body text-center p-2">
                      <small className="text-muted">Month {month.month}</small>
                      <div className="fw-bold fs-6">{month.date}</div>
                      <div className="text-success fw-bold">{formatCurrency(month.predicted_price)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
                <FaChartBar className="me-2" />
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

              {/* Current Price Display */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <FaRupeeSign className="me-2" />
                  Current Live Price
                </label>
                <div className="d-flex align-items-center">
                  {priceLoading ? (
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  ) : currentPrice ? (
                    <div>
                      <div className="fw-bold fs-5 text-success">{formatCurrency(currentPrice)}</div>
                      <small className="text-muted">
                        <FaCalendarAlt className="me-1" />
                        {new Date().toLocaleDateString()}
                      </small>
                    </div>
                  ) : (
                    <div className="text-muted">Unable to fetch</div>
                  )}
                  <button 
                    className="btn btn-outline-secondary btn-sm ms-2"
                    onClick={() => loadCurrentPrice(selectedStock)}
                    disabled={priceLoading}
                  >
                    <FaSpinner className={priceLoading ? 'fa-spin' : ''} />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <FaCalendarAlt className="me-2" />
                  Prediction Duration
                </label>
                <select
                  className="form-select"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="3_month">3 Months</option>
                  <option value="6_month">6 Months</option>
                  <option value="1_year">1 Year</option>
                </select>
                <small className="text-muted">
                  Select the time duration for your prediction
                </small>
              </div>

              <button
                className="btn btn-primary w-100 btn-lg"
                onClick={handlePrediction}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="me-2 fa-spin" />
                    Making Prediction...
                  </>
                ) : (
                  <>
                    <FaChartLine className="me-2" />
                    Make {getDurationLabel(duration)} Prediction
                  </>
                )}
              </button>

              {/* Prediction Result */}
              {renderPredictionResult()}
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
            {/* <div className="col-md-6">
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
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;