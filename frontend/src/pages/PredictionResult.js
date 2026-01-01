import React, { useMemo, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import { FaArrowLeft, FaCalendarAlt, FaChartLine, FaArrowUp, FaArrowDown, FaMinus } from 'react-icons/fa';
import { stockAPI } from '../services/api';

const PredictionResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { selectedStock, duration, result } = state;

  const pred = result?.prediction;
  const [charts, setCharts] = useState(null);

  useEffect(() => {
    if (!selectedStock) return;
    let cancelled = false;
    stockAPI.getCharts(selectedStock)
      .then(res => {
        if (!cancelled) setCharts(res.data);
      })
      .catch(() => {
        if (!cancelled) setCharts(null);
      });
    return () => { cancelled = true; };
  }, [selectedStock]);

  const getDurationLabel = (d) => ({
    '3_month': '3 Months',
    '6_month': '6 Months',
    '1_year': '1 Year'
  })[d] || d;

  const chartData = useMemo(() => {
    if (!pred) return null;
    const traces = [];

    // Actual historical close price (from charts API)
    const lineChart = charts?.line_chart;
    if (lineChart?.data?.length) {
      const closeTrace = lineChart.data.find(t => t.name === 'Close Price') || lineChart.data[0];
      if (closeTrace?.x && closeTrace?.y) {
        // Limit history window based on selected duration
        const now = new Date();
        const windowDays = duration === '6_month' ? 180 : duration === '1_year' ? 365 : 90; // default 3 months
        const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
        const hx = [];
        const hy = [];
        for (let i = 0; i < closeTrace.x.length; i++) {
          const dx = new Date(closeTrace.x[i]);
          if (dx >= cutoff) {
            hx.push(closeTrace.x[i]);
            hy.push(closeTrace.y[i]);
          }
        }
        traces.push({
          x: hx.length ? hx : closeTrace.x,
          y: hy.length ? hy : closeTrace.y,
          mode: 'lines',
          name: 'Actual',
          line: { color: '#666', width: 1.5 }
        });
      }
    }

    // Predicted future series or single point
    if (Array.isArray(pred.predictions) && pred.predictions.length > 0) {
      traces.push({
        x: pred.predictions.map(p => p.date),
        y: pred.predictions.map(p => p.predicted_price),
        mode: 'lines+markers',
        name: 'Predicted',
        line: { color: '#1f77b4', width: 2 },
        marker: { size: 6 }
      });
    } else if (pred.predicted_price) {
      const date = pred.prediction_date || new Date().toISOString().slice(0, 10);
      traces.push({
        x: [date],
        y: [pred.predicted_price],
        mode: 'markers',
        name: 'Predicted',
        marker: { size: 8, color: '#1f77b4', symbol: 'diamond' }
      });
    }

    // Current price marker
    if (pred.current_price) {
      const today = new Date().toISOString().slice(0, 10);
      traces.push({
        x: [today],
        y: [pred.current_price],
        mode: 'markers',
        name: 'Current',
        marker: { size: 8, color: '#d62728', symbol: 'x' }
      });
    }

    // Compute x-axis range and separator line at today
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    const lastPredDateStr = Array.isArray(pred.predictions) && pred.predictions.length > 0
      ? pred.predictions[pred.predictions.length - 1].date
      : todayISO;
    const xRange = [
      new Date(today.getTime() - (duration === '6_month' ? 180 : duration === '1_year' ? 365 : 90) * 24 * 60 * 60 * 1000),
      new Date(lastPredDateStr)
    ];

    return {
      data: traces,
      layout: {
        title: `${selectedStock} Prediction Progress - ${getDurationLabel(duration)}`,
        xaxis: { title: 'Date', range: xRange },
        yaxis: { title: 'Price (₹)' },
        height: 450,
        margin: { t: 40, r: 20, b: 50, l: 60 },
        template: 'plotly_white',
        shapes: [
          {
            type: 'line',
            xref: 'x',
            yref: 'paper',
            x0: todayISO,
            x1: todayISO,
            y0: 0,
            y1: 1,
            line: { color: '#999', width: 1, dash: 'dash' }
          }
        ],
        annotations: [
          {
            x: todayISO,
            y: 1,
            xref: 'x',
            yref: 'paper',
            text: 'Prediction Start',
            showarrow: false,
            xanchor: 'left',
            yanchor: 'bottom',
            font: { size: 10, color: '#666' }
          }
        ]
      }
    };
  }, [pred, selectedStock, charts, duration]);

  if (!pred) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning">
          No result to display. Please make a prediction first.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/prediction')}>
          <FaArrowLeft className="me-2" />Back to Prediction
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex align-items-center mb-3">
        <button className="btn btn-outline-secondary me-3" onClick={() => navigate('/prediction')}>
          <FaArrowLeft />
        </button>
        <h3 className="mb-0">
          <FaChartLine className="me-2" />
          {selectedStock} - {getDurationLabel(duration)} Result
        </h3>
      </div>

      {/* Actual price and technical indicators before chart */}
      <div className="row g-3 mb-3">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body text-center p-3">
              <small className="text-muted">Actual Price (CSV Avg)</small>
              <div className="fw-bold fs-5">₹{pred.actual_price?.toFixed(2)}</div>
            </div>
          </div>
        </div>
        {pred.summary && (
          <div className="col-md-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center">
                <div className="row">
                  <div className="col-6">
                    <div className="text-muted">Min</div>
                    <div className="fw-bold">₹{pred.summary.min_price?.toFixed(2)}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted">Max</div>
                    <div className="fw-bold">₹{pred.summary.max_price?.toFixed(2)}</div>
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted">Average</div>
                    <div className="fw-bold">₹{pred.summary.avg_price?.toFixed(2)}</div>
                  </div>
                  <div className="col-6 mt-2">
                    <div className="text-muted">Trend</div>
                    <div className="fw-bold text-capitalize">{pred.summary.trend}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prediction progress chart */}
      <div className="card mb-4">
        <div className="card-header">
          <strong>Prediction Progress</strong>
        </div>
        <div className="card-body">
          {chartData ? (
            <Plot data={chartData.data} layout={chartData.layout} config={{ displayModeBar: false }} style={{ width: '100%' }} />
          ) : (
            <div className="text-muted">No prediction data available</div>
          )}
        </div>
      </div>

      {/* Only show current price and predicted price after chart */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <div className="card bg-info text-white">
            <div className="card-body text-center p-3">
              <small>Current Price (Live)</small>
              <div className="fw-bold fs-5">₹{pred.current_price?.toFixed(2)}</div>
              <small><FaCalendarAlt className="me-1" />{new Date().toLocaleDateString()}</small>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card bg-success text-white">
            <div className="card-body text-center p-3">
              <small>Predicted Price</small>
              <div className="fw-bold fs-5">₹{(pred.predictions?.[pred.predictions.length - 1]?.predicted_price || pred.predicted_price)?.toFixed(2)}</div>
              <small><FaCalendarAlt className="me-1" />{pred.predictions?.[pred.predictions.length - 1]?.date}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionResult;


