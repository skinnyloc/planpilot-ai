'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

// Field component for consistent styling
const Field = ({ icon: Icon, label, name, type = "text", value, onChange, error, placeholder, required = false }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#ccc',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <Icon style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
      {label}{required && ' *'}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      suppressHydrationWarning={true}
      style={{
        width: '100%',
        padding: '12px',
        border: error ? '2px solid #ff6b6b' : '1px solid #f59e0b',
        borderRadius: '8px',
        backgroundColor: '#000',
        color: '#fff',
        fontSize: '14px',
        outline: 'none'
      }}
    />
    {error && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>{error}</p>}
  </div>
);

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();
  const { signUp, loading } = useAuth();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!emailRegex.test(formData.email)) newErrors.email = 'Invalid email format';

    // Name validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    // Username validation
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) newErrors.username = 'Username can only contain letters, numbers, and underscores';

    // Password validation
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

    // Confirm password validation
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setMessage('');

    try {
      const { data, error } = await signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username
      });

      if (error) {
        setMessage(`Registration failed: ${error.message}`);
      } else {
        setMessage('Registration successful! Please check your email to verify your account.');
        // Clear form
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          username: '',
          password: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setMessage(`Registration failed: ${error.message}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      backgroundColor: '#000'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: '#000',
        border: '1px solid #f59e0b',
        borderRadius: '12px',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <UserPlus style={{
            width: '48px',
            height: '48px',
            color: '#f59e0b',
            margin: '0 auto 16px'
          }} />
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#fafafa',
            marginBottom: '8px'
          }}>
            Create Account
          </h1>
          <p style={{ color: '#999', fontSize: '1rem' }}>
            Join PlanPilot AI and start building your business
          </p>
        </div>

        {message && (
          <div style={{
            backgroundColor: message.includes('successful') ? '#000' : '#dc2626',
            border: `1px solid ${message.includes('successful') ? '#f59e0b' : '#b91c1c'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: message.includes('successful') ? '#f59e0b' : '#fef2f2',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <Field
              icon={User}
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              error={errors.firstName}
              required
            />
            <Field
              icon={User}
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              error={errors.lastName}
              required
            />
          </div>

          <Field
            icon={Mail}
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            error={errors.email}
            required
          />

          <Field
            icon={User}
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a unique username"
            error={errors.username}
            required
          />

          {/* Password field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ccc',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Lock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a secure password"
                required
                suppressHydrationWarning={true}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  border: errors.password ? '2px solid #ff6b6b' : '1px solid #f59e0b',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
          </div>

          {/* Confirm Password field */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#ccc',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Lock style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
              Confirm Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                suppressHydrationWarning={true}
                style={{
                  width: '100%',
                  padding: '12px',
                  paddingRight: '40px',
                  border: errors.confirmPassword ? '2px solid #ff6b6b' : '1px solid #f59e0b',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer'
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#666' : '#f59e0b',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '24px'
            }}
          >
            {loading ? 'Creating Account...' : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f59e0b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Sign in here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}