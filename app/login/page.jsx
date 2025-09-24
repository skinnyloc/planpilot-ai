'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const router = useRouter();
  const { signIn, loading } = useAuth();

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

    // Password validation
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setMessage('');

    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        setMessage(`Login failed: ${error.message}`);
      } else {
        setMessage('Login successful! Redirecting...');
        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      setMessage(`Login failed: ${error.message}`);
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
        maxWidth: '400px',
        backgroundColor: '#000',
        border: '1px solid #f59e0b',
        borderRadius: '12px',
        padding: '40px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <LogIn style={{
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
            Welcome Back
          </h1>
          <p style={{ color: '#999', fontSize: '1rem' }}>
            Sign in to your PlanPilot AI account
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
          {/* Email field */}
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
              <Mail style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
              suppressHydrationWarning={true}
              style={{
                width: '100%',
                padding: '12px',
                border: errors.email ? '2px solid #ff6b6b' : '1px solid #f59e0b',
                borderRadius: '8px',
                backgroundColor: '#000',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            {errors.email && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
          </div>

          {/* Password field */}
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
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
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
            {loading ? 'Signing in...' : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
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
                Create account
              </button>
            </p>

            {/* Forgot password link */}
            <button
              type="button"
              onClick={() => {
                // TODO: Add forgot password functionality
                alert('Forgot password functionality coming soon!');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#999',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Forgot your password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}