import Link from 'next/link';

export default function HomePage() {

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      color: '#fafafa',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Welcome to PlanPilot AI
        </h1>
        <p style={{
          marginBottom: '2rem',
          color: '#999',
          fontSize: '1.1rem'
        }}>
          Your AI-powered business planning assistant
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              backgroundColor: '#f59e0b',
              color: '#000',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f59e0b'}
          >
            Enter Dashboard
          </Link>
          <Link
            href="/business-idea"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              color: '#f59e0b',
              border: '1px solid #f59e0b',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f59e0b';
              e.target.style.color = '#000';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#f59e0b';
            }}
          >
            Business Ideas
          </Link>
        </div>
      </div>
    </div>
  );
}