'use client';

import { useState, useEffect } from 'react';
import { Save, User, Mail, Phone, MapPin, Building, Calendar, Edit3 } from 'lucide-react';

export default function ProfilePage() {
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        businessName: '',
        businessType: '',
        industry: '',
        yearsInBusiness: '',
        employeeCount: '',
        website: '',
        bio: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Load profile from localStorage
        const stored = localStorage.getItem('userProfile');
        if (stored) {
            setProfileData(JSON.parse(stored));
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);

        try {
            // Save to localStorage
            localStorage.setItem('userProfile', JSON.stringify(profileData));
            setMessage('Profile updated successfully!');
            setIsEditing(false);

            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error saving profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Reload from localStorage
        const stored = localStorage.getItem('userProfile');
        if (stored) {
            setProfileData(JSON.parse(stored));
        }
        setIsEditing(false);
    };

    const Field = ({ icon: Icon, label, name, value, onChange, type = "text", isTextarea = false, placeholder = "", required = false }) => (
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
            {isTextarea ? (
                <textarea
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={!isEditing}
                    rows={4}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        backgroundColor: isEditing ? '#000' : '#1a1a1a',
                        color: '#fff',
                        fontSize: '14px',
                        resize: 'vertical',
                        outline: 'none',
                        opacity: isEditing ? 1 : 0.7
                    }}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value || ""}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={!isEditing}
                    style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        backgroundColor: isEditing ? '#000' : '#1a1a1a',
                        color: '#fff',
                        fontSize: '14px',
                        outline: 'none',
                        opacity: isEditing ? 1 : 0.7
                    }}
                />
            )}
        </div>
    );

    return (
        <div style={{ padding: '32px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: '#fafafa',
                        marginBottom: '8px'
                    }}>
                        Profile
                    </h1>
                    <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
                        Manage your personal and business information.
                    </p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        style={{
                            backgroundColor: '#f59e0b',
                            color: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 20px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Edit3 style={{ width: '16px', height: '16px' }} />
                        Edit Profile
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleCancel}
                            style={{
                                backgroundColor: 'transparent',
                                color: '#f59e0b',
                                border: '1px solid #f59e0b',
                                borderRadius: '8px',
                                padding: '12px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            style={{
                                backgroundColor: '#f59e0b',
                                color: '#000',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: isSaving ? 0.7 : 1
                            }}
                        >
                            <Save style={{ width: '16px', height: '16px' }} />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {message && (
                <div style={{
                    backgroundColor: message.includes('Error') ? '#dc2626' : '#000',
                    border: `1px solid ${message.includes('Error') ? '#b91c1c' : '#f59e0b'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '24px',
                    color: message.includes('Error') ? '#fef2f2' : '#f59e0b',
                    fontSize: '14px'
                }}>
                    {message}
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '32px'
            }}>
                {/* Personal Information */}
                <div style={{
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '24px'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#fafafa',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <User style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                        Personal Information
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <Field
                            icon={User}
                            label="First Name"
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleInputChange}
                            placeholder="Enter your first name"
                            required
                        />
                        <Field
                            icon={User}
                            label="Last Name"
                            name="lastName"
                            value={profileData.lastName}
                            onChange={handleInputChange}
                            placeholder="Enter your last name"
                            required
                        />
                    </div>

                    <Field
                        icon={Mail}
                        label="Email Address"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        type="email"
                        placeholder="Enter your email address"
                        required
                    />

                    <Field
                        icon={Phone}
                        label="Phone Number"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        type="tel"
                        placeholder="Enter your phone number"
                    />

                    <Field
                        icon={MapPin}
                        label="Address"
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        placeholder="Enter your street address"
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                        <Field
                            icon={MapPin}
                            label="City"
                            name="city"
                            value={profileData.city}
                            onChange={handleInputChange}
                            placeholder="Enter your city"
                        />
                        <Field
                            icon={MapPin}
                            label="State"
                            name="state"
                            value={profileData.state}
                            onChange={handleInputChange}
                            placeholder="State"
                        />
                        <Field
                            icon={MapPin}
                            label="Zip Code"
                            name="zipCode"
                            value={profileData.zipCode}
                            onChange={handleInputChange}
                            placeholder="12345"
                        />
                    </div>
                </div>

                {/* Business Information */}
                <div style={{
                    backgroundColor: '#000',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    padding: '24px'
                }}>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#fafafa',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <Building style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
                        Business Information
                    </h3>

                    <Field
                        icon={Building}
                        label="Business Name"
                        name="businessName"
                        value={profileData.businessName}
                        onChange={handleInputChange}
                        placeholder="Enter your business name"
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <Field
                            icon={Building}
                            label="Business Type"
                            name="businessType"
                            value={profileData.businessType}
                            onChange={handleInputChange}
                            placeholder="LLC, Corp, Partnership, etc."
                        />
                        <Field
                            icon={Building}
                            label="Industry"
                            name="industry"
                            value={profileData.industry}
                            onChange={handleInputChange}
                            placeholder="Technology, Healthcare, etc."
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <Field
                            icon={Calendar}
                            label="Years in Business"
                            name="yearsInBusiness"
                            value={profileData.yearsInBusiness}
                            onChange={handleInputChange}
                            type="number"
                            placeholder="0"
                        />
                        <Field
                            icon={User}
                            label="Employee Count"
                            name="employeeCount"
                            value={profileData.employeeCount}
                            onChange={handleInputChange}
                            type="number"
                            placeholder="1"
                        />
                    </div>

                    <Field
                        icon={MapPin}
                        label="Website"
                        name="website"
                        value={profileData.website}
                        onChange={handleInputChange}
                        type="url"
                        placeholder="https://www.example.com"
                    />

                    <Field
                        icon={Edit3}
                        label="Bio / Description"
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        isTextarea
                        placeholder="Tell us about yourself and your business..."
                    />
                </div>
            </div>
        </div>
    );
}