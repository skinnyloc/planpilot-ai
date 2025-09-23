import Link from 'next/link';
import { Lightbulb, FileText, Send, File, Home } from 'lucide-react';

export default function DashboardPage() {
  const actionCards = [
    {
      title: 'Business Ideas',
      description: 'Explore and develop your business concepts',
      href: '/business-idea',
      icon: Lightbulb
    },
    {
      title: 'Business Plans',
      description: 'Create comprehensive business plans',
      href: '/business-plans',
      icon: FileText
    },
    {
      title: 'Grant Proposals',
      description: 'Submit and manage grant applications',
      href: '/grant-proposals',
      icon: Send
    },
    {
      title: 'Documents',
      description: 'Manage your files and documents',
      href: '/documents',
      icon: File
    }
  ];

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      {/* Welcome Card */}
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '24px'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#fafafa',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Home style={{ color: '#f59e0b' }} />
          Welcome to Your Business Hub
        </h1>
        <p style={{ color: '#999', fontSize: '1rem', margin: 0 }}>
          Manage your business ideas, plans, and funding opportunities all in one place.
        </p>
      </div>

      {/* Action Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px'
      }}>
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              style={{
                display: 'block',
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '24px',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#333';
                e.target.style.borderColor = '#f59e0b';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#1a1a1a';
                e.target.style.borderColor = '#333';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                <div style={{ flexShrink: 0 }}>
                  <Icon style={{ width: '32px', height: '32px', color: '#f59e0b' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#fafafa',
                    marginBottom: '8px',
                    margin: '0 0 8px'
                  }}>
                    {card.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#999',
                    marginBottom: '16px',
                    margin: '0 0 16px'
                  }}>
                    {card.description}
                  </p>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#f59e0b'
                  }}>
                    Get Started →
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}