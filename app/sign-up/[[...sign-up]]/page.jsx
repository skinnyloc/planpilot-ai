import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      color: '#fafafa',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '8px',
            background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Join PlanPilot AI
          </h1>
          <p style={{ color: '#999', fontSize: '1rem' }}>
            Create your account to start building your business
          </p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg rounded-lg border",
              cardBox: "shadow-lg",
              socialButtonsBlockButton: "border hover:bg-gray-50",
              formFieldInput: "border rounded-md",
              formButtonPrimary: "bg-orange-500 hover:bg-orange-600 text-white",
              footerActionLink: "text-orange-500 hover:text-orange-600"
            },
            variables: {
              colorPrimary: "#f59e0b",
              colorBackground: "#ffffff",
              colorText: "#000000"
            }
          }}
          path="/sign-up"
          signInUrl="/sign-in"
          redirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}