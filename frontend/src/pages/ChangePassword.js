import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaLock, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { changePassword } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Current password validation
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if new password is same as current
    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const result = await changePassword(formData.currentPassword, formData.newPassword);
      if (result.success) {
        // Clear form on success
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: 'danger', text: 'Very Weak' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    
    if (score <= 2) return { strength: score, color: 'danger', text: 'Weak' };
    if (score <= 3) return { strength: score, color: 'warning', text: 'Fair' };
    if (score <= 4) return { strength: score, color: 'info', text: 'Good' };
    return { strength: score, color: 'success', text: 'Strong' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="container-fluid p-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <FaShieldAlt className="me-2" />
                Change Password
              </h4>
            </div>
            <div className="card-body p-4">
              <div className="text-center mb-4">
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
                  <FaLock />
                </div>
                <h5 className="fw-bold">Update Your Password</h5>
                <p className="text-muted">Enter your current password and choose a new secure password</p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Current Password */}
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label fw-semibold">
                    <FaLock className="me-2" />
                    Current Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      className={`form-control form-control-lg ${errors.currentPassword ? 'is-invalid' : ''}`}
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter your current password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={{ zIndex: 10 }}
                    >
                      {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <div className="invalid-feedback">{errors.currentPassword}</div>
                  )}
                </div>

                {/* New Password */}
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label fw-semibold">
                    <FaLock className="me-2" />
                    New Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className={`form-control form-control-lg ${errors.newPassword ? 'is-invalid' : ''}`}
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter your new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ zIndex: 10 }}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <div className="invalid-feedback">{errors.newPassword}</div>
                  )}
                  
                  {/* Password Strength Indicator */}
                  {formData.newPassword && (
                    <div className="mt-2">
                      <div className="d-flex align-items-center mb-1">
                        <small className="text-muted me-2">Password Strength:</small>
                        <small className={`text-${passwordStrength.color} fw-bold`}>
                          {passwordStrength.text}
                        </small>
                      </div>
                      <div className="progress" style={{ height: '6px' }}>
                        <div
                          className={`progress-bar bg-${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label fw-semibold">
                    <FaLock className="me-2" />
                    Confirm New Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`form-control form-control-lg ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ zIndex: 10 }}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <div className="invalid-feedback">{errors.confirmPassword}</div>
                  )}
                </div>

                {/* Password Requirements */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">Password Requirements:</h6>
                  <ul className="list-unstyled small text-muted">
                    <li className={`mb-1 ${formData.newPassword?.length >= 8 ? 'text-success' : ''}`}>
                      ✓ At least 8 characters long
                    </li>
                    <li className={`mb-1 ${/[a-z]/.test(formData.newPassword || '') ? 'text-success' : ''}`}>
                      ✓ Contains lowercase letter
                    </li>
                    <li className={`mb-1 ${/[A-Z]/.test(formData.newPassword || '') ? 'text-success' : ''}`}>
                      ✓ Contains uppercase letter
                    </li>
                    <li className={`mb-1 ${/\d/.test(formData.newPassword || '') ? 'text-success' : ''}`}>
                      ✓ Contains number
                    </li>
                    <li className={`mb-1 ${/[@$!%*?&]/.test(formData.newPassword || '') ? 'text-success' : ''}`}>
                      ✓ Contains special character (@$!%*?&)
                    </li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 btn-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <FaShieldAlt className="me-2" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;