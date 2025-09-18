'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Save, RotateCcw, Lock, Crown, Calendar, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { getUserProfile, saveUserProfile } from '@/lib/services/profileService';
import { isProUser, getUserPlan } from '@/lib/utils/planChecker';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
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
    if (isLoaded && user) {
      loadUserProfile();
    }
  }, [isLoaded, user]);

  const loadUserProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load data from Clerk
      const userData = {
        email: user.emailAddresses?.[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      };

      // Load additional data from Supabase using service
      const profileResult = await getUserProfile(user.id);

      if (!profileResult.success && profileResult.error) {
        console.error('Error loading profile:', profileResult.error);
        setMessage({
          type: 'warning',
          text: 'Profile data could not be loaded from database. Using Clerk data only.'
        });
      }

      const profile = profileResult.profile;
      const combinedData = {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: profile?.username || ''
      };

      setFormData(combinedData);
      setOriginalData(combinedData);
      setProfileData(profile);
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

  const handleSave = async () => {
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Please fix the errors below' });
      return;
    }

    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Update Clerk data first
      const clerkUpdateData = {
        firstName: formData.firstName,
        lastName: formData.lastName
      };
      console.log('Sending to Clerk:', clerkUpdateData);
      console.log('FormData keys:', Object.keys(formData));
      await user.update(clerkUpdateData);

      // Update or create Supabase profile using service
      const saveResult = await saveUserProfile(user.id, {
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName
      });

      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save profile to database');
      }

      setOriginalData({ ...formData });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setProfileData(saveResult.profile);

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to save profile. Please try again.'
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

  const handlePasswordChange = async () => {
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

    try {
      await user.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({
        type: 'error',
        text: error.errors?.[0]?.message || 'Failed to change password. Please check your current password.'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const hasChanges = () => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-md mb-2"></div>
          <div className="h-4 bg-muted rounded-md w-3/4"></div>
        </div>
        <div className="bg-card border border-border rounded-lg p-8 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded-md"></div>
            <div className="h-10 bg-muted rounded-md"></div>
            <div className="h-4 bg-muted rounded-md"></div>
            <div className="h-10 bg-muted rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  const userPlan = getUserPlan(user);
  const isPro = isProUser(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences.
        </p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-lg border flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : message.type === 'warning'
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <div className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground">Personal Information</h2>
                  <p className="text-sm text-muted-foreground">Update your personal details below.</p>
                </div>
              </div>

          <form className="space-y-6">
            {/* Email (Read Only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-muted text-muted-foreground cursor-not-allowed focus:outline-none"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Email address cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasChanges()}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-md hover:bg-secondary/80 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Clear
              </button>
            </div>
          </form>
            </div>

            {/* Password Management Section */}
            <div className="bg-card border border-border rounded-lg p-8 mt-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-50 rounded-full">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-card-foreground">Password & Security</h2>
                  <p className="text-sm text-muted-foreground">Manage your account password and security settings.</p>
                </div>
              </div>

              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 hover:bg-orange-200 px-4 py-2 rounded-md transition-colors"
                >
                  <Lock className="h-4 w-4" />
                  Change Password
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter your current password"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter your new password"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your new password"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword}
                      className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isChangingPassword ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                      ) : (
                        <Lock className="h-4 w-4" />
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
                      className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  isPro ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Crown className={`h-5 w-5 ${
                    isPro ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {isPro ? 'PlanPilot Pro' : 'Free Plan'}
                  </p>
                </div>
              </div>

              {isPro ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>All premium features unlocked</span>
                  </div>
                  {profileData?.next_billing_date && (
                    <p className="text-xs text-muted-foreground">
                      Next billing: {new Date(profileData.next_billing_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-4">
                  <UpgradePrompt feature="advanced-features" className="!p-4" />
                </div>
              )}
            </div>

            {/* Account Information */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Account Info</h3>
                  <p className="text-sm text-muted-foreground">Account details and activity</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Member Since:</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Sign In:</span>
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Profile Status:</span>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}