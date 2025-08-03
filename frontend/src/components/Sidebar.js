import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, 
  FaChartLine, 
  FaHistory, 
  FaCog, 
  FaUsers, 
  FaClipboardList,
  FaUserShield
} from 'react-icons/fa';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const userMenuItems = [
    {
      path: '/dashboard',
      icon: <FaTachometerAlt />,
      label: 'Dashboard',
      adminOnly: false
    },
    {
      path: '/prediction',
      icon: <FaChartLine />,
      label: 'Make Prediction',
      adminOnly: false
    },
    {
      path: '/history',
      icon: <FaHistory />,
      label: 'History',
      adminOnly: false
    },
    {
      path: '/change-password',
      icon: <FaCog />,
      label: 'Change Password',
      adminOnly: false
    }
  ];

  const adminMenuItems = [
    {
      path: '/admin',
      icon: <FaTachometerAlt />,
      label: 'Admin Dashboard',
      adminOnly: true
    },
    {
      path: '/admin/users',
      icon: <FaUsers />,
      label: 'User Management',
      adminOnly: true
    },
    {
      path: '/admin/results',
      icon: <FaClipboardList />,
      label: 'All Results',
      adminOnly: true
    }
  ];

  const allMenuItems = [...userMenuItems, ...adminMenuItems];

  return (
    <div className="sidebar" style={{ width: '250px', minHeight: '100vh', padding: '20px 0' }}>
      <div className="px-3">
        <h6 className="text-muted mb-3 px-3">
          {user?.is_admin ? 'Admin Panel' : 'User Panel'}
        </h6>
        
        <ul className="nav flex-column">
          {allMenuItems.map((item) => {
            // Show admin items only to admins, user items to everyone
            if (item.adminOnly && !user?.is_admin) return null;
            if (!item.adminOnly && user?.is_admin) return null;
            
            return (
              <li key={item.path} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link d-flex align-items-center py-2 px-3 ${
                    isActive(item.path) ? 'active bg-primary text-white' : 'text-dark'
                  }`}
                  style={{
                    borderRadius: '8px',
                    margin: '2px 0',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span className="me-3">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {user?.is_admin && (
          <div className="mt-4 px-3">
            <div className="d-flex align-items-center text-muted">
              <FaUserShield className="me-2" />
              <small>Administrator</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;