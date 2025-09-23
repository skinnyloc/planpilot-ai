"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  Home,
  Lightbulb,
  FileText,
  Gift,
  Send,
  CreditCard,
  File,
  DollarSign,
  User,
  Shield
} from "lucide-react";


export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const currentPath = pathname;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Business Idea', href: '/business-idea', icon: Lightbulb },
    { name: 'Business Plans', href: '/business-plans', icon: FileText },
    { name: 'Grants', href: '/grants', icon: Gift },
    { name: 'Letter Proposals', href: '/grant-proposals', icon: Send },
    { name: 'Credit Guide', href: '/credit-guide', icon: CreditCard },
    { name: 'Documents', href: '/documents', icon: File },
    { name: 'Pricing', href: '/pricing', icon: DollarSign },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fafafa',
      display: 'flex'
    }}>
      {/* Always visible sidebar */}
      <div style={{
        width: '256px',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        borderRight: '1px solid #333',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid #333'
        }}>
          <h1 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#fafafa',
            background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            PlanPilot AI
          </h1>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={handleNavClick}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      backgroundColor: isActive ? '#f59e0b' : 'transparent',
                      color: isActive ? '#000' : '#fafafa'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = '#333';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <Icon style={{ width: '20px', height: '20px' }} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Main content area */}
      <div style={{
        marginLeft: '256px',
        flex: 1,
        minHeight: '100vh'
      }}>
        {/* Page content */}
        <main style={{ padding: '40px 24px' }}>
          {children}
        </main>
      </div>

      {/* Mobile sidebar overlay - hidden by default since we have persistent sidebar */}
      <div style={{
        display: 'none', // Hidden since we have persistent sidebar
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }} onClick={() => setSidebarOpen(false)}>
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100%',
          width: '256px',
          backgroundColor: '#1a1a1a',
          borderRight: '1px solid #333'
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px'
          }}>
            <h1 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#fafafa'
            }}>
              PlanPilot AI
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fafafa',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px'
              }}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
          <nav style={{ padding: '16px 12px' }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={handleNavClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        textDecoration: 'none',
                        backgroundColor: isActive ? '#f59e0b' : 'transparent',
                        color: isActive ? '#000' : '#fafafa'
                      }}
                    >
                      <Icon style={{ width: '20px', height: '20px' }} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

    </div>
  );
}