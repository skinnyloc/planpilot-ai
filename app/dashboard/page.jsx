"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, FileText, DollarSign, CreditCard, ArrowRight, Plus } from 'lucide-react';

export default function DashboardPage() {
  const [ideaCount, setIdeaCount] = useState(0);

  useEffect(() => {
    // Load actual business ideas count from localStorage
    const loadIdeaCount = () => {
      const stored = localStorage.getItem('businessIdeas');
      if (stored) {
        const ideas = JSON.parse(stored);
        setIdeaCount(ideas.length);
      } else {
        setIdeaCount(0);
      }
    };

    loadIdeaCount();

    // Listen for localStorage changes to keep count in sync
    const handleStorageChange = () => {
      loadIdeaCount();
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically in case localStorage was updated in same tab
    const interval = setInterval(loadIdeaCount, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const actions = [
    { title: "Define Your Business Idea", icon: Building2, url: "/business-idea" },
    { title: "Generate a Business Plan", icon: FileText, url: "/business-plans" },
    { title: "Draft a Grant Proposal", icon: DollarSign, url: "/grant-proposals" },
    { title: "Build Your Business Credit", icon: CreditCard, url: "/credit-guide" },
  ];

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fafafa',
          marginBottom: '8px'
        }}>
          Welcome to Your Business Hub
        </h1>
        <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
          Plan, fund, and grow your business, all in one place.
        </p>
      </div>

      <div style={{
        backgroundColor: '#000',
        border: '2px solid #f59e0b',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>You have</p>
          <p style={{
            fontSize: '2rem',
            fontWeight: '600',
            color: '#fafafa',
            marginBottom: '4px'
          }}>
            {ideaCount} Business Idea{ideaCount !== 1 ? 's' : ''}
          </p>
          <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>ready to be developed.</p>
        </div>
        <Link
          href="/business-idea"
          style={{
            backgroundColor: '#f59e0b',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#d97706';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#f59e0b';
          }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Add Idea
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {actions.map((action) => (
          <div
            key={action.title}
            style={{
              backgroundColor: '#000',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              padding: '0',
              overflow: 'hidden',
              transition: 'all 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f59e0b'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '500',
                color: '#fafafa',
                margin: 0
              }}>
                {action.title}
              </h3>
              <action.icon style={{ width: '24px', height: '24px', color: '#999' }} />
            </div>
            <div style={{ padding: '20px' }}>
              <Link
                href={action.url}
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#000',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#d97706';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f59e0b';
                }}
              >
                Get Started
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}