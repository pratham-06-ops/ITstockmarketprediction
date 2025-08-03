import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { toast } from 'react-toastify';
import { 
  FaUsers, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaUserShield,
  FaUser,
  FaCalendarAlt,
  FaChartLine
} from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
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

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || 
                         (filterRole === 'admin' && user.is_admin) ||
                         (filterRole === 'user' && !user.is_admin);
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'predictions':
          aValue = a.prediction_count;
          bValue = b.prediction_count;
          break;
        default:
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

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
            <FaUsers className="me-2" />
            User Management
          </h2>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <FaSearch />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="username">Sort by Username</option>
            <option value="predictions">Sort by Predictions</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-primary">{users.length}</h4>
              <p className="text-muted mb-0">Total Users</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-success">
                {users.filter(u => u.is_admin).length}
              </h4>
              <p className="text-muted mb-0">Admins</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-warning">
                {users.filter(u => !u.is_admin).length}
              </h4>
              <p className="text-muted mb-0">Regular Users</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h4 className="fw-bold text-info">
                {users.reduce((acc, u) => acc + u.prediction_count, 0)}
              </h4>
              <p className="text-muted mb-0">Total Predictions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <FaUsers className="me-2" />
                Users ({filteredAndSortedUsers.length} results)
              </h5>
            </div>
            <div className="card-body">
              {filteredAndSortedUsers.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Predictions</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div 
                                className="d-inline-flex align-items-center justify-content-center me-3"
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: user.is_admin 
                                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontSize: '16px'
                                }}
                              >
                                {user.is_admin ? <FaUserShield /> : <FaUser />}
                              </div>
                              <div>
                                <h6 className="mb-0 fw-bold">{user.username}</h6>
                                <small className="text-muted">ID: {user.id}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-muted">{user.email}</span>
                          </td>
                          <td>
                            {user.is_admin ? (
                              <span className="badge bg-warning">
                                <FaUserShield className="me-1" />
                                Admin
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                <FaUser className="me-1" />
                                User
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaChartLine className="me-2 text-primary" />
                              <span className="fw-bold">{user.prediction_count}</span>
                              <small className="text-muted ms-1">predictions</small>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaCalendarAlt className="me-2 text-muted" />
                              <small className="text-muted">
                                {formatDate(user.created_at)}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-primary" 
                                title="Edit User"
                                onClick={() => toast.info('Edit functionality coming soon!')}
                              >
                                <FaEdit />
                              </button>
                              {!user.is_admin && (
                                <button 
                                  className="btn btn-outline-danger" 
                                  title="Delete User"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaUsers size={50} className="text-muted mb-3" />
                  <h5 className="text-muted">No users found</h5>
                  <p className="text-muted">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;