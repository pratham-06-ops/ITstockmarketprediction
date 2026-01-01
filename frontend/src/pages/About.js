import React from 'react';

const About = () => (
  <div className="container py-5">
    <div className="row justify-content-center">
      <div className="col-lg-8">
        <div className="card border-0 shadow-lg">
          <div className="card-body p-5">
            <h2 className="fw-bold mb-3 text-primary">About IT Stock Market Prediction</h2>
            <p>
              <strong>IT Stock Market Prediction</strong> is a web application designed to help users and administrators predict future prices of major Indian IT stocks such as TCS, WIPRO, and INFOSYS.
              The platform leverages advanced machine learning models and technical analysis to provide accurate and insightful predictions for various durations.
            </p>
            <h4 className="mt-4 mb-2 text-success">Key Features</h4>
            <ul>
              <li>Live stock price fetching and display</li>
              <li>Multi-duration price prediction (3 months, 6 months, 1 year)</li>
              <li>Interactive charts (Line, Candlestick)</li>
              <li>User and admin dashboards for monitoring and management</li>
              <li>Prediction history and analytics for both users and admins</li>
              <li>Secure authentication and user management</li>
            </ul>
            <h4 className="mt-4 mb-2 text-warning">Purpose</h4>
            <p>
              This project aims to empower investors, analysts, and IT professionals with data-driven insights for stock market decision-making. 
              Both regular users and administrators can make predictions, view analytics, and manage users efficiently.
            </p>
            <h4 className="mt-4 mb-2 text-secondary">Contact & Support</h4>
            <p>
              pratham vaghela,
              mobile no:- 9463232323,
              email:- prathamvaghela702@gmail.com
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default About;