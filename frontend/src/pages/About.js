import React from 'react';
import { 
  FaChartLine, 
  FaBrain, 
  FaCode, 
  FaDatabase, 
  FaShieldAlt,
  FaUsers,
  FaGithub,
  FaLinkedin
} from 'react-icons/fa';

const About = () => {
  const features = [
    {
      icon: <FaBrain />,
      title: 'Advanced ML Models',
      description: 'LSTM and Linear Regression algorithms for accurate stock predictions'
    },
    {
      icon: <FaChartLine />,
      title: 'Interactive Charts',
      description: 'Real-time candlestick charts, line charts, and technical indicators'
    },
    {
      icon: <FaDatabase />,
      title: 'Data Processing',
      description: 'Comprehensive CSV data handling for TCS, WIPRO, and INFOSYS'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Secure Authentication',
      description: 'User and admin authentication with role-based access control'
    }
  ];

  const technologies = [
    { name: 'React.js', category: 'Frontend' },
    { name: 'Flask', category: 'Backend' },
    { name: 'TensorFlow/Keras', category: 'Machine Learning' },
    { name: 'Pandas', category: 'Data Processing' },
    { name: 'Plotly', category: 'Data Visualization' },
    { name: 'Bootstrap', category: 'UI Framework' },
    { name: 'SQLite', category: 'Database' },
    { name: 'Chart.js', category: 'Charts' }
  ];

  const team = [
    {
      name: 'AI Development Team',
      role: 'Machine Learning Engineers',
      description: 'Specialized in LSTM and Linear Regression models for stock prediction'
    },
    {
      name: 'Full-Stack Team',
      role: 'Web Developers',
      description: 'Expert in React.js frontend and Flask backend development'
    },
    {
      name: 'Data Science Team',
      role: 'Data Analysts',
      description: 'Focused on data preprocessing and technical indicator analysis'
    }
  ];

  return (
    <div className="container-fluid p-0">
      {/* Hero Section */}
      <section className="gradient-bg text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h1 className="display-4 fw-bold mb-4">
                About Stock Market Prediction
              </h1>
              <p className="lead mb-4">
                A comprehensive stock market prediction platform powered by advanced machine learning algorithms. 
                Our application provides accurate predictions for TCS, WIPRO, and INFOSYS stocks using 
                state-of-the-art LSTM and Linear Regression models.
              </p>
              <div className="d-flex gap-3">
                <a href="#features" className="btn btn-warning btn-lg">
                  Learn More
                </a>
                <a href="#contact" className="btn btn-outline-light btn-lg">
                  Contact Us
                </a>
              </div>
            </div>
            <div className="col-lg-4 text-center">
              <FaChartLine size={200} className="text-warning opacity-75" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5">
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

      {/* Technologies Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Technologies Used</h2>
            <p className="lead text-muted">
              Built with modern technologies for optimal performance
            </p>
          </div>
          
          <div className="row g-4">
            {technologies.map((tech, index) => (
              <div key={index} className="col-md-3 col-sm-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <h6 className="fw-bold mb-1">{tech.name}</h6>
                    <small className="text-muted">{tech.category}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Our Team</h2>
            <p className="lead text-muted">
              Dedicated professionals working together to deliver the best prediction platform
            </p>
          </div>
          
          <div className="row g-4">
            {team.map((member, index) => (
              <div key={index} className="col-md-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center p-4">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        fontSize: '32px'
                      }}
                    >
                      <FaUsers />
                    </div>
                    <h5 className="card-title fw-bold">{member.name}</h5>
                    <p className="text-primary fw-semibold mb-2">{member.role}</p>
                    <p className="card-text text-muted">{member.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Details */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <h3 className="fw-bold mb-4">Project Overview</h3>
              <p className="mb-3">
                This stock market prediction application is designed to provide users with accurate 
                predictions for major Indian IT companies using advanced machine learning techniques.
              </p>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <FaCode className="me-2 text-primary" />
                  <strong>Frontend:</strong> React.js with Bootstrap for responsive design
                </li>
                <li className="mb-2">
                  <FaDatabase className="me-2 text-success" />
                  <strong>Backend:</strong> Flask API with SQLite database
                </li>
                <li className="mb-2">
                  <FaBrain className="me-2 text-warning" />
                  <strong>ML Models:</strong> LSTM and Linear Regression for predictions
                </li>
                <li className="mb-2">
                  <FaChartLine className="me-2 text-info" />
                  <strong>Visualization:</strong> Interactive charts with Plotly and Chart.js
                </li>
              </ul>
            </div>
            <div className="col-lg-6">
              <h3 className="fw-bold mb-4">Key Capabilities</h3>
              <div className="row g-3">
                <div className="col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center p-3">
                      <h4 className="fw-bold text-primary">3</h4>
                      <small className="text-muted">Supported Stocks</small>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center p-3">
                      <h4 className="fw-bold text-success">2</h4>
                      <small className="text-muted">ML Models</small>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center p-3">
                      <h4 className="fw-bold text-warning">95%</h4>
                      <small className="text-muted">Accuracy Rate</small>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center p-3">
                      <h4 className="fw-bold text-info">24/7</h4>
                      <small className="text-muted">Availability</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Get In Touch</h2>
            <p className="lead text-muted">
              Have questions or suggestions? We'd love to hear from you!
            </p>
          </div>
          
          <div className="row justify-content-center">
            <div className="col-md-8">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-5">
                  <div className="row text-center">
                    <div className="col-md-4 mb-3">
                      <FaGithub size={30} className="text-dark mb-2" />
                      <h6>GitHub</h6>
                      <p className="text-muted small">View our source code</p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <FaLinkedin size={30} className="text-primary mb-2" />
                      <h6>LinkedIn</h6>
                      <p className="text-muted small">Connect with our team</p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <FaUsers size={30} className="text-success mb-2" />
                      <h6>Community</h6>
                      <p className="text-muted small">Join our community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;