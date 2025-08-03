import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaChartLine, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <FaChartLine className="me-2" style={{ color: '#667eea' }} />
          <span className="fw-bold" style={{ color: '#667eea' }}>
            Stock Predictor
          </span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/about">
                About
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav">
            {isAuthenticated ? (
              <>
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle d-flex align-items-center"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <FaUser className="me-1" />
                    {user?.username}
                  </a>
                  <ul className="dropdown-menu">
                    {user?.is_admin ? (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/admin">
                            Admin Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/admin/users">
                            User Management
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/admin/results">
                            All Results
                          </Link>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                      </>
                    ) : (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/dashboard">
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/prediction">
                            Make Prediction
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/history">
                            History
                          </Link>
                        </li>
                        <li><hr className="dropdown-divider" /></li>
                      </>
                    )}
                    <li>
                      <Link className="dropdown-item" to="/change-password">
                        <FaCog className="me-2" />
                        Change Password
                      </Link>
                    </li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt className="me-2" />
                        Logout
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary ms-2" to="/register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;