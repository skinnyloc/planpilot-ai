'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Save, RotateCcw, Lock, Crown, Calendar, Activity, AlertCircle, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [profileData, setProfileData] = useState(null);

  // Load user data on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem('demoProfile');
      const userData = stored ? JSON.parse(stored) : {
        email: 'demo@planpilotai.com',
        firstName: '',
        lastName: '',
        username: ''
      };

      setFormData(userData);
      setOriginalData(userData);
      setProfileData({ plan: 'free' });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load profile. Please refresh the page and try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (formData.username && formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }

    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      localStorage.setItem('demoProfile', JSON.stringify(formData));
      setOriginalData({ ...formData });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save profile. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setFormData({ ...originalData });
    setValidationErrors({});
    setMessage({ type: '', text: '' });
  };

  const handlePasswordChange = () => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    setIsChangingPassword(true);
    setMessage({ type: '', text: '' });

    setTimeout(() => {
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setIsChangingPassword(false);
    }, 1000);
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #f59e0b',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
      </div>
    );
  }

  const isPro = false;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fafafa',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <User style={{ color: '#f59e0b' }} />
          Profile Settings
        </h1>
        <p style={{ color: '#999', fontSize: '1rem' }}>
          Manage your account information and preferences.
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div style={{
          padding: '16px',
          borderRadius: '8px',
          border: `1px solid ${message.type === 'success' ? '#10b981' : message.type === 'warning' ? '#f59e0b' : '#ef4444'}`,
          backgroundColor: message.type === 'success' ? '#064e3b' : message.type === 'warning' ? '#451a03' : '#7f1d1d',
          color: message.type === 'success' ? '#10b981' : message.type === 'warning' ? '#f59e0b' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px'
        }}>
          {message.type === 'success' ? (
            <CheckCircle style={{ width: '16px', height: '16px' }} />
          ) : (
            <AlertCircle style={{ width: '16px', height: '16px' }} />
          )}
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Main Profile Form */}
        <div>
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '32px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '50%'
              }}>
                <User style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#fafafa',
                  margin: 0
                }}>Personal Information</h2>
                <p style={{
                  fontSize: '14px',
                  color: '#999',
                  margin: 0
                }}>Update your personal details below.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '24px' }}>
              {/* Email (Read Only) */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '16px',
                    height: '16px',
                    color: '#999'
                  }} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    style={{
                      width: '100%',
                      paddingLeft: '40px',
                      paddingRight: '12px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      backgroundColor: '#222',
                      color: '#999',
                      cursor: 'not-allowed',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <p style={{
                  fontSize: '12px',
                  color: '#666',
                  marginTop: '4px',
                  margin: 0
                }}>
                  Email address cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              {/* Username */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Enter your username"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* First Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Last Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ccc',
                  marginBottom: '6px'
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #444',
                    borderRadius: '6px',
                    backgroundColor: '#333',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: '16px',
                paddingTop: '24px',
                borderTop: '1px solid #333',
                marginTop: '24px'
              }}>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges()}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: hasChanges() ? '#f59e0b' : '#666',
                    color: hasChanges() ? '#000' : '#999',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: hasChanges() ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isSaving ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid #000',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save style={{ width: '16px', height: '16px' }} />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: 'transparent',
                    color: '#f59e0b',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw style={{ width: '16px', height: '16px' }} />
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Password Management Section */}
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '32px',
            marginTop: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '50%'
              }}>
                <Lock style={{ width: '24px', height: '24px', color: '#ef4444' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#fafafa',
                  margin: 0
                }}>Password & Security</h2>
                <p style={{
                  fontSize: '14px',
                  color: '#999',
                  margin: 0
                }}>Manage your account password and security settings.</p>
              </div>
            </div>

            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <Lock style={{ width: '16px', height: '16px' }} />
                Change Password
              </button>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ccc',
                    marginBottom: '6px'
                  }}>
                    Current Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your current password"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      backgroundColor: '#333',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ccc',
                    marginBottom: '6px'
                  }}>
                    New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter your new password"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      backgroundColor: '#333',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#ccc',
                    marginBottom: '6px'
                  }}>
                    Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your new password"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #444',
                      borderRadius: '6px',
                      backgroundColor: '#333',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px', paddingTop: '16px' }}>
                  <button
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#f59e0b',
                      color: '#000',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                      opacity: isChangingPassword ? 0.5 : 1
                    }}
                  >
                    {isChangingPassword ? (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid #000',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    ) : (
                      <Lock style={{ width: '16px', height: '16px' }} />
                    )}
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setMessage({ type: '', text: '' });
                    }}
                    disabled={isChangingPassword}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'transparent',
                      color: '#f59e0b',
                      border: '1px solid #f59e0b',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                      opacity: isChangingPassword ? 0.5 : 1
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Current Plan */}
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isPro ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)'
              }}>
                <Crown style={{
                  width: '20px',
                  height: '20px',
                  color: isPro ? '#3b82f6' : '#6b7280'
                }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#fafafa',
                  margin: 0
                }}>Current Plan</h3>
                <p style={{
                  fontSize: '14px',
                  color: '#999',
                  margin: 0
                }}>
                  {isPro ? 'PlanPilot Pro' : 'Free Plan'}
                </p>
              </div>
            </div>

            {isPro ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#10b981'
                }}>
                  <CheckCircle style={{ width: '16px', height: '16px' }} />
                  <span>All premium features unlocked</span>
                </div>
                {profileData?.next_billing_date && (
                  <p style={{
                    fontSize: '12px',
                    color: '#666',
                    margin: 0
                  }}>
                    Next billing: {new Date(profileData.next_billing_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid #f59e0b',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '14px',
                    color: '#f59e0b',
                    margin: '0 0 8px'
                  }}>Upgrade to unlock premium features</p>
                  <a
                    href="/pricing"
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      backgroundColor: '#f59e0b',
                      color: '#000',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    View Plans
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Account Information */}
          <div style={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '50%'
              }}>
                <Activity style={{ width: '20px', height: '20px', color: '#10b981' }} />
              </div>
              <div>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#fafafa',
                  margin: 0
                }}>Account Info</h3>
                <p style={{
                  fontSize: '14px',
                  color: '#999',
                  margin: 0
                }}>Account details and activity</p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#999' }}>Member Since:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar style={{ width: '12px', height: '12px', color: '#999' }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#fafafa'
                  }}>
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#999' }}>Last Sign In:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity style={{ width: '12px', height: '12px', color: '#999' }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#fafafa'
                  }}>
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', color: '#999' }}>Profile Status:</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#10b981'
                }}>
                  <CheckCircle style={{ width: '12px', height: '12px' }} />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}